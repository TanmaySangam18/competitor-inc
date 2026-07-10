import { runAction, capabilities } from "@/lib/engine/execution";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { executionRefusal, type ActionContext, type Refusal } from "@/lib/engine/policy";
import { raiseAlert } from "@/lib/engine/alerts";
import { spendWouldExceed, recordSpend } from "@/lib/engine/spendguard";
import { isPremiumAction, serverPremium } from "@/lib/engine/access-server";
import { waitlistGateOn } from "@/lib/engine/access-gate";
import type { AgentRole, Connections } from "@/lib/engine/types";

// Runs a real, gated agent action (build / deploy / outreach / spend / payments / delete) server-side.
// Every executor is OFF unless its key is set, in which case it returns { disabled: true } and the
// client keeps its simulated behavior. Defensive: never throws a 5xx at the client.
//
// TWO server-enforced gates run before any executor fires:
//   1. POLICY FLOOR (always): the deterministic decide() engine — kill switch, forbidden actions, the
//      per-agent AUTO/APPROVE/NEVER matrix, and a hard spend ceiling. "Is this risky?" is a rule, not a
//      vibe. See lib/engine/policy.ts.
//   2. APPROVAL KEYSTONE (when Supabase is configured): the human-in-the-loop is a server invariant —
//      a real executor only fires for an authenticated user who OWNS the target company, and approval-
//      driven actions must map to an owned, approved inbox item. See authorize() below.
// When Supabase isn't configured we're in pure offline/sim mode (executors are key-gated and return
// { disabled:true }), so the keystone is skipped and the local product is unchanged.

// Approval-Inbox kinds — actions that originate from a human-approved item in the inbox.
const APPROVAL_KINDS = new Set(["spend", "outreach", "deploy", "delete"]);

// Decide whether the authenticated caller may run this action. RLS on `companies`/`approvals` (keyed to
// auth.uid()) does the ownership enforcement for us when we read through the session-bound client.
async function authorize(opts: {
  companyId?: string;
  approvalId?: string;
  action: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await getServerSupabase();
  if (!sb) return { ok: false, error: "auth unavailable" };

  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return { ok: false, error: "unauthorized" };

  if (!opts.companyId) return { ok: false, error: "missing company" };
  // RLS returns this row ONLY if the signed-in user owns it — ownership check for free.
  const { data: company } = await sb
    .from("companies")
    .select("id")
    .eq("id", opts.companyId)
    .maybeSingle();
  if (!company) return { ok: false, error: "not your company" };

  // Approval-driven action: verify it maps to an owned approval of the SAME kind, and record the
  // human's sign-off server-side (RLS-enforced) as the authoritative audit trail. The app is
  // localStorage-authoritative with best-effort async DB sync, so the row may not have synced yet —
  // in that case we proceed (the owner is authenticated and owns the company) and skip the audit write.
  if (opts.approvalId && APPROVAL_KINDS.has(opts.action)) {
    const { data: appr } = await sb
      .from("approvals")
      .select("kind, resolved, company_id")
      .eq("id", opts.approvalId)
      .maybeSingle();
    if (appr) {
      if (appr.company_id !== opts.companyId) return { ok: false, error: "approval mismatch" };
      if (appr.kind !== opts.action) return { ok: false, error: "kind mismatch" };
      if (appr.resolved === "rejected") return { ok: false, error: "approval was rejected" };
      if (appr.resolved !== "approved") {
        await sb.from("approvals").update({ resolved: "approved" }).eq("id", opts.approvalId);
      }
    }
  }

  return { ok: true };
}

export async function POST(req: Request) {
  if (await overLimit(`execute:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const b = (body ?? {}) as {
    action?: unknown;
    company?: { name?: unknown; idea?: unknown };
    item?: { kind?: unknown; title?: unknown; detail?: unknown; amount?: unknown };
    ownerEmail?: unknown;
    companyId?: unknown;
    approvalId?: unknown;
    agent?: unknown;
    connections?: Record<string, unknown>;
  };
  const action = typeof b.action === "string" ? b.action : "";
  if (!action) return Response.json({ ok: false, error: "no action" }, { status: 400 });

  const companyId = typeof b.companyId === "string" ? b.companyId : undefined;
  const approvalId = typeof b.approvalId === "string" ? b.approvalId : undefined;
  // Agent drives the per-agent policy matrix. Unknown/absent → matrix falls back to APPROVE (never
  // auto-blocked) so the hard floors (kill switch, forbidden, spend ceiling) still apply.
  const agent = (typeof b.agent === "string" ? b.agent : "unknown") as AgentRole;

  const company = { name: String(b.company?.name ?? ""), idea: String(b.company?.idea ?? "") };
  const item = b.item && typeof b.item === "object"
    ? {
        kind: String(b.item.kind ?? ""),
        title: typeof b.item.title === "string" ? b.item.title : undefined,
        detail: typeof b.item.detail === "string" ? b.item.detail : undefined,
        amount: typeof b.item.amount === "number" ? b.item.amount : undefined,
      }
    : undefined;
  const ownerEmail = typeof b.ownerEmail === "string" ? b.ownerEmail : undefined;
  // Per-user connections: client-stored, sent per-request, never persisted here. Coerce each field
  // to a trimmed string so a malformed payload can't reach an executor as a non-string credential.
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const connections: Connections | undefined = b.connections && typeof b.connections === "object"
    ? {
        githubToken: s(b.connections.githubToken),
        resendApiKey: s(b.connections.resendApiKey),
        resendFrom: s(b.connections.resendFrom),
        adsWebhookUrl: s(b.connections.adsWebhookUrl),
      }
    : undefined;

  // ── Gate 1: POLICY FLOOR (always on). Credential detection stays the executor's job (it returns
  // { disabled } when a key is missing), so here we pass hasCredential:true and let the policy enforce
  // the governance rules: kill switch, forbidden actions, the per-agent matrix, and the spend ceiling.
  const killed = process.env.ACTIONS_KILL_SWITCH === "1";
  const policyCtx: ActionContext = { type: action, agent, amountUsd: item?.amount, hasCredential: true, compliancePass: true };
  const refusal: Refusal | null = killed ? { reason: "kill switch engaged", event: "forbidden_attempt" } : executionRefusal(policyCtx);
  if (refusal) {
    console.warn(`[/api/execute] policy refused action=${action} agent=${agent}: ${refusal.reason}`);
    raiseAlert(refusal.event, `execute refused: ${refusal.reason}`, { action, agent }); // Glass Box reacts, not just logs
    return Response.json({ ok: false, disabled: true, error: "blocked by policy" });
  }

  // Daily/monthly spend ceiling (best-effort accumulator; the per-transaction cap is in the floor above).
  if (action === "spend" && companyId && item?.amount) {
    const breach = spendWouldExceed(companyId, item.amount);
    if (breach) {
      console.warn(`[/api/execute] spend ${breach}-cap breach: $${item.amount} for ${companyId}`);
      raiseAlert("cap_breach", `spend $${item.amount} would breach the ${breach} cap`, { action, agent, companyId });
      return Response.json({ ok: false, disabled: true, error: "blocked by policy" });
    }
  }

  // ── Gate 2: APPROVAL KEYSTONE (when Supabase is configured). On refusal we return { disabled:true }
  // so the client transparently falls back to its simulated/optimistic UI — a denied real action never
  // breaks the app, it just doesn't fire for real.
  if (isSupabaseConfigured()) {
    const gate = await authorize({ companyId, approvalId, action });
    if (!gate.ok) {
      console.warn(`[/api/execute] refused real action (${gate.error}) action=${action}`);
      return Response.json({ ok: false, disabled: true, error: "not authorized" });
    }
  }

  // ── Gate 3: PREMIUM (server enforcement of the tiering). Real external actions require founder-or-paid
  // when the monetization gate is on, so the UI tiering can't be bypassed via the API. Off by default
  // (flag), and fail-safe (withheld actions just stay simulated — nothing breaks).
  if (waitlistGateOn(process.env.NEXT_PUBLIC_WAITLIST_GATE) && isPremiumAction(action) && !(await serverPremium())) {
    console.warn(`[/api/execute] withheld premium action=${action} (not founder/paid)`);
    return Response.json({ ok: false, disabled: true, error: "premium required" });
  }

  try {
    const result = await runAction(action, { company, companyId, item, ownerEmail, connections });
    // Record real spend so the daily/monthly accumulator sees it (only when it actually executed).
    if (action === "spend" && companyId && item?.amount && result.ok && !result.disabled) {
      recordSpend(companyId, item.amount);
    }
    // A real executor that ran and FAILED (not merely disabled by a missing key) → react. (failurePolicy:
    // alert + pause. We never blind-retry a side-effecting POST — double-send risk — so the action simply
    // isn't marked done; a human re-approves.)
    if (!result.ok && !result.disabled && result.error) {
      raiseAlert("failure", `executor failed: ${action}`, { action, agent, error: result.error });
    }
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[/api/execute] error:", msg);
    raiseAlert("failure", `execute threw: ${action}`, { action, agent, error: msg });
    return Response.json({ ok: false, error: "execution error" }); // 200 — never 5xx the client
  }
}

// Lets the UI show which integrations are live (which keys are set).
export function GET() {
  return Response.json({ capabilities: capabilities() });
}
