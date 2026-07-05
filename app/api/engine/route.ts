import { serviceClient } from "@/lib/engine/service";
import { runChat, runShift, runValidate, realModelConfigured, detectChatApproval, streamChatReply, probeModel, modelForAgent } from "@/lib/engine/server";
import { runSupervisedGoal } from "@/lib/engine/orchestrator";
import { githubBuildExecutor } from "@/lib/engine/build-github";
import { openhandsBuildExecutor } from "@/lib/engine/openhands";
import type { ExecuteFn } from "@/lib/engine/supervisor";
import { capabilities } from "@/lib/engine/execution";
import { connectorStatus } from "@/lib/engine/connectors";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";
import { withTrace } from "@/lib/engine/observability";
import { runGrowthStep, type FunnelSnapshot, type GrowthExperiment } from "@/lib/engine/growth";
import { readFunnel } from "@/lib/engine/funnel";
import type { AgentRole, ByokConfig, Company, Connections } from "@/lib/engine/types";
import { AGENTS } from "@/lib/engine/types";

export const runtime = "nodejs";

// Health/status — confirms the engine is reachable and whether a real model is wired.
// `?probe=1` additionally fires a tiny real model call and reports the actual error (diagnoses a
// misconfigured MODEL_* env — a decommissioned model id, bad key, etc.). Rate-limited: the probe
// spends ~5 tokens, so a flood can't run up a bill.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("probe") === "1") {
    if (process.env.VERCEL && rateLimited(clientIp(req))) {
      return Response.json({ error: "rate limited — wait a minute and retry" }, { status: 429 });
    }
    return Response.json(await probeModel());
  }
  return Response.json({
    ok: true,
    provider: process.env.MODEL_PROVIDER ?? "simulated",
    realModelConfigured: realModelConfigured(),
    capabilities: capabilities(),
    connectors: connectorStatus(capabilities()),
  });
}

type Body =
  | { kind: "validate"; idea: string; nonce?: number; byok?: ByokConfig }
  | { kind: "shift"; company: Company; experiments?: GrowthExperiment[]; byok?: ByokConfig }
  | { kind: "chat"; company: { name: string; idea: string }; message: string; soul?: string; agent?: AgentRole; byok?: ByokConfig }
  | { kind: "goal"; goal: string; roles?: AgentRole[]; build?: boolean; operate?: boolean; connections?: Connections; byok?: ByokConfig };

// The funnel used when no DB is configured (or the read fails): every stage missing. The growth step
// then closes due experiments as "inconclusive — connect the signal" instead of inventing numbers.
const MISSING_FUNNEL: FunnelSnapshot = {
  views: null,
  signups: null,
  payingCustomers: null,
  revenueCents: null,
  basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" },
};

export async function POST(req: Request) {
  // Cost/abuse guard: soft per-IP rate limit. Active only on Vercel (real deployments) so the local
  // dev server + QA smoke harness aren't throttled. A 429 makes the clients fall back to the free
  // simulated engine, so a flooding IP can't keep spending model tokens.
  if (process.env.VERCEL && rateLimited(clientIp(req))) {
    return new Response("You're going a bit fast — give it a moment and try again.", {
      status: 429,
      headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "60" },
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Body must be an object" }, { status: 400 });
  }

  try {
    if (body.kind === "validate") {
      if (typeof body.idea !== "string" || !body.idea.trim()) {
        return Response.json({ error: "`idea` (non-empty string) is required" }, { status: 400 });
      }
      const salt = typeof body.nonce === "number" && Number.isFinite(body.nonce) ? String(body.nonce) : undefined;
      const validation = await withTrace("validate", () => runValidate(body.idea.trim(), body.byok, salt), { len: body.idea.length });
      return Response.json({ validation });
    }

    if (body.kind === "shift") {
      const c = body.company;
      if (
        !c || typeof c !== "object" ||
        typeof c.id !== "string" ||
        typeof c.idea !== "string" ||
        typeof c.night !== "number" ||
        !c.ledger || typeof c.ledger !== "object"
      ) {
        return Response.json({ error: "`company` (id, idea, night, ledger) is required" }, { status: 400 });
      }
      // Revenue Loop growth step (runs BEFORE the shift so learnings inform the model's prompt):
      // close due experiments against the REAL funnel when a DB is reachable, else against the
      // missing funnel (honest inconclusives). Deterministic + fail-soft: any error skips growth.
      const openExps = Array.isArray(body.experiments) ? body.experiments.slice(0, 12) : [];
      let growth: ReturnType<typeof runGrowthStep> | null = null;
      try {
        const sb = serviceClient();
        const funnel =
          sb && typeof c.slug === "string" && c.slug ? await readFunnel(sb, c.slug) : MISSING_FUNNEL;
        growth = await withTrace("growth", async () => runGrowthStep(c, openExps, funnel, [], c.night + 1), { companyId: c.id });
      } catch (e) {
        console.error("[/api/engine] growth step failed:", e instanceof Error ? e.message : "unknown");
      }

      const growthContext = growth
        ? {
            goal: c.growthGoal,
            constraint: growth.diagnosis.constraint,
            signal: growth.diagnosis.signal,
            learnings: growth.closed.map((x) => x.learning ?? "").filter(Boolean),
          }
        : undefined;
      const result = await withTrace("shift", () => runShift(c, body.byok, undefined, growthContext), { companyId: c.id, night: c.night });
      if (!growth) return Response.json(result);
      return Response.json({
        ...result,
        activities: [...growth.activities, ...result.activities],
        experiments: [...growth.closed, ...growth.stillOpen, ...growth.proposed],
      });
    }

    if (body.kind === "chat") {
      if (!body.company || typeof body.message !== "string" || !body.message.trim()) {
        return Response.json({ error: "`company` and `message` are required" }, { status: 400 });
      }
      const message = body.message.trim();
      // The addressed agent routes to ITS model tier (Apex/Rig → mid, Forge → strong, Pitch/Guard/Surge
      // → cheap) via modelForAgent(agent) inside the chat fns. Validate against the real roster; default
      // to ceo. (With a single BYOK key that has no tiers, every agent shares that one model — expected.)
      const agent: AgentRole = body.agent && body.agent in AGENTS ? body.agent : "ceo";
      // Consequential asks get a real ApprovalItem queued client-side; pass the seed in a header so
      // the reply can still stream. (encodeURIComponent keeps the value header-safe + unicode-safe.)
      const approval = detectChatApproval(message);
      const headers: Record<string, string> = {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      };
      if (approval) headers["x-approval"] = encodeURIComponent(JSON.stringify(approval));
      // Real model → stream its tokens as they arrive (model speed). No model / any failure →
      // fake-stream the simulated reply with a typewriter cadence so it still feels live.
      const live = await streamChatReply(body.company, message, body.soul, body.byok, agent);
      const stream = live
        ? streamTokens(live)
        : streamText(await runChat(body.company, message, body.soul, body.byok, agent));
      return new Response(stream, { headers });
    }

    if (body.kind === "goal") {
      if (typeof body.goal !== "string" || !body.goal.trim()) {
        return Response.json({ error: "`goal` (non-empty string) is required" }, { status: 400 });
      }
      // Run the agent org over the goal: decompose → supervisor spawns/verifies/hands-off/terminates,
      // escalating irreducible acts to the human spine. Deterministic simulated execution ($0, keyless);
      // Phase B injects a model-backed / OpenHands executor. Returns the full outcome for the crew view.
      const roles = Array.isArray(body.roles) ? body.roles.filter((r): r is AgentRole => r in AGENTS) : undefined;
      // Opt-in REAL build (build:true + a GitHub token) → agents ship a live site to the caller's own repo
      // (authorized by initiation); else the deterministic simulated run. OpenHands plugs into the same
      // executor for full apps. Kept opt-in so a goal-run never creates repos unless explicitly asked.
      let execute: ExecuteFn | undefined;
      let mode = "simulated";
      if (body.build === true) {
        const conn: Connections | undefined =
          body.connections && typeof body.connections === "object"
            ? { githubToken: String(body.connections.githubToken ?? "").trim(), resendApiKey: "", resendFrom: "", adsWebhookUrl: "" }
            : undefined;
        // Prefer OpenHands (full apps) when configured; else our GitHub static-site builder; else simulated.
        const oh = openhandsBuildExecutor(body.byok);
        if (oh) {
          execute = oh;
          mode = "openhands";
        } else {
          const gh = githubBuildExecutor(conn, body.byok);
          if (gh) {
            execute = gh;
            mode = "github";
          }
        }
      }
      const outcome = await withTrace(
        "goal",
        () => runSupervisedGoal(body.goal.trim(), { roles, modelForRole: modelForAgent, makeId: () => crypto.randomUUID(), execute, operate: body.operate === true }),
        { len: body.goal.length },
      );
      return Response.json({ outcome, mode });
    }

    return Response.json({ error: "Unknown `kind` (expected 'validate' | 'shift' | 'chat' | 'goal')" }, { status: 400 });
  } catch (err) {
    // Log only the message — never the raw error/body, since this path handles the BYOK key.
    console.error("[/api/engine] engine error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Engine failure" }, { status: 500 });
  }
}

// Simulated path: the reply is already resolved, so fake-chunk it word-by-word with a small delay
// to mimic a live typewriter. (Used only when no real model is configured / it failed.)
function streamText(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const tokens = text.split(/(\s+)/).filter(Boolean);
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= tokens.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(tokens[i++]));
      await new Promise((r) => setTimeout(r, 28));
    },
  });
}

// Real path: forward the model's token deltas as they arrive — no artificial delay (the model's own
// pace is the cadence). If the upstream stream drops mid-reply, end cleanly with what we have.
function streamTokens(gen: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await gen.next();
        if (done) {
          controller.close();
          return;
        }
        if (value) controller.enqueue(encoder.encode(value));
      } catch {
        controller.close();
      }
    },
    async cancel() {
      await gen.return?.(undefined);
    },
  });
}
