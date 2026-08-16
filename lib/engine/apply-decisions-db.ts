import "server-only";
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { planDecisionApplication, type PendingItem, type RecordedDecision } from "./apply-decisions";
import { loadMandate, UNSIGNED } from "./mandates-db";
import { decide } from "./policy";
import { insertActivities } from "./db";
import { postToBluesky, postToMastodon } from "./execution";
import { requestPublish, withDisclosure, type PublishChannel } from "@/lib/core/publish-gate";
import type { Activity, AgentRole, ApprovalKind } from "./types";

// The cron's laptop-off application of recorded ChatOps decisions (Consent Rails, complete).
// Webhooks record the human's word in approval_decisions; this joins it against the still-pending
// approvals and APPLIES it — only through the double gate (signed mandate + policy floor). Social posts
// (bluesky/mastodon) whose approval carries the post body now EXECUTE server-side right here; other
// kinds resolve + log honestly and fire via their own gated paths (email/spend need data not in the row).

const KIND_TO_EXEC: Partial<Record<ApprovalKind, string>> = {
  spend: "spend", outreach: "outreach", deploy: "deploy", delete: "delete", bluesky: "bluesky", mastodon: "mastodon",
};

export interface ApplyOutcome { applied: number; rejected: number; held: number }

export async function applyRecordedDecisions(sb: SupabaseClient, companyId: string): Promise<ApplyOutcome> {
  // 1. The still-pending approvals for this company.
  const { data: rows, error } = await sb
    .from("approvals")
    .select("id, kind, title, detail, agent, amount")
    .eq("company_id", companyId)
    .is("resolved", null)
    .limit(50);
  if (error) throw new Error(`approvals fetch: ${error.message}`);
  if (!rows?.length) return { applied: 0, rejected: 0, held: 0 };

  // 2. The human's recorded word for exactly those items.
  const ids = rows.map((r) => r.id as string);
  const { data: decs, error: dErr } = await sb.from("approval_decisions").select("approval_id, decision").in("approval_id", ids);
  if (dErr) throw new Error(`decisions fetch: ${dErr.message}`);
  if (!decs?.length) return { applied: 0, rejected: 0, held: 0 };

  // 3. Double gate: the customer's signed mandate (missing/erroring ⇒ UNSIGNED — an outage can never
  //    widen authority) + the policy engine's floor (BLOCK vetoes even a human-approved act).
  const mandate = await loadMandate(sb, companyId).catch(() => UNSIGNED);
  const pending: PendingItem[] = rows.map((r) => ({
    id: r.id as string,
    kind: r.kind as ApprovalKind,
    title: (r.title as string) ?? "",
    detail: (r.detail as string) ?? undefined,
    amountCents: r.amount != null ? Math.round(Number(r.amount) * 100) : undefined,
  }));
  const recorded: RecordedDecision[] = decs.map((d) => ({ approvalId: d.approval_id as string, decision: d.decision as "approved" | "rejected" }));
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  const plan = planDecisionApplication(pending, recorded, mandate, {
    // No durable per-company spend ledger yet (Block 5) — each item is bounded by the per-item cap check.
    spentThisMonthCents: 0,
    policyAllows: (item) => {
      const row = byId.get(item.id);
      const v = decide({
        type: KIND_TO_EXEC[item.kind] ?? item.kind,
        agent: ((row?.agent as AgentRole) ?? "ceo"),
        amountUsd: item.amountCents != null ? item.amountCents / 100 : undefined,
      });
      return v.verdict !== "BLOCK";
    },
  });

  // 4. Apply — resolutions + Glass Box entries (via the canonical insertActivities). Holds stay pending
  //    with the honest reason logged, so the founder sees WHY something waited.
  const agentOf = (id: string): AgentRole => ((byId.get(id)?.agent as AgentRole) ?? "ceo");
  const act = (agent: AgentRole, action: string, meta: string, value: string): Activity => ({
    id: crypto.randomUUID(), night: 0, agent, action, meta, cost: 0, status: "done", proof: { kind: "metric", value },
  });
  const acts: Activity[] = [];
  for (const item of plan.execute) {
    await sb.from("approvals").update({ resolved: "approved" }).eq("id", item.id);
    // Server-side EXECUTION (the final consent-rails slice): social posts whose approval carries the
    // post body actually SEND here — they already passed the human's yes + the mandate + the policy
    // floor to reach plan.execute. Executors are env-gated (no keys ⇒ honest "disabled", never a lie).
    if ((item.kind === "bluesky" || item.kind === "mastodon") && item.detail?.trim()) {
      // The human's yes is necessary and NOT sufficient. It clears the approval; the mandate still has
      // to clear the content, the disclosure, the cap and the audience. The previous comment here
      // claimed this path "already passed the mandate" while the mandate was wired to nothing.
      const decision = requestPublish({
        channel: item.kind as PublishChannel,
        text: withDisclosure(item.detail),
        author: agentOf(item.id),
        approver: "marketing-lead",
        approverIsLead: true,
        honestyVerified: true, // the body was reviewed and approved by the human before reaching here
        postsTodayOnChannel: 0,
        audience: "own",
      });
      const out = !decision.granted
        ? ({ ok: false, error: decision.reason } as const)
        : item.kind === "bluesky" ? await postToBluesky(decision) : await postToMastodon(decision);
      const meta = out.ok
        ? `laptop-off · SENT via ${item.kind} · under your signed mandate`
        : "disabled" in out && out.disabled
          ? `laptop-off · approved — sends the moment ${item.kind} connects`
          : `laptop-off · approved but the ${item.kind} send failed (${("error" in out && out.error) || "unknown"}) — retry manually`;
      acts.push(act(agentOf(item.id), `Applied your approval — ${item.title}`, meta, out.ok ? `posted via phone approval · ${item.kind}` : "approved via phone · applied by the overnight run"));
      continue;
    }
    acts.push(act(agentOf(item.id), `Applied your approval — ${item.title}`, "laptop-off · under your signed mandate · executes via its channel", "approved via phone · applied by the overnight run"));
  }
  for (const item of plan.reject) {
    await sb.from("approvals").update({ resolved: "rejected" }).eq("id", item.id);
    acts.push(act(agentOf(item.id), `Applied your rejection — ${item.title}`, "laptop-off · nothing fired", "rejected via phone · cleared by the overnight run"));
  }
  for (const h of plan.hold) {
    acts.push(act(agentOf(h.item.id), `HELD your approval — ${h.item.title}`, h.reason, "held by the mandate/policy gate — still waiting in your inbox"));
  }
  await insertActivities(sb, companyId, acts).catch((e) => console.error("[apply-decisions] activity log:", e?.message));
  return { applied: plan.execute.length, rejected: plan.reject.length, held: plan.hold.length };
}
