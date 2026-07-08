import { serviceClient } from "@/lib/engine/service";
import { runChat, runShift, runValidate, realModelConfigured, detectChatApproval, streamChatReply, probeModel, probeBuildModel, generateSiteFiles, modelForAgent } from "@/lib/engine/server";
import { FULLSTACK_BUILDS, dispatchFullstackBuild } from "@/lib/engine/fullstack-build";
import { getServerSupabase } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/engine/founders";
import { runSupervisedGoal } from "@/lib/engine/orchestrator";
import { githubBuildExecutor } from "@/lib/engine/build-github";
import { openhandsBuildExecutor } from "@/lib/engine/openhands";
import { aiderBuildExecutor } from "@/lib/engine/aider-build";
import { fullstackBuildExecutor } from "@/lib/engine/fullstack-build";
import { checkUserLimit } from "@/lib/engine/user-limits";
import type { ExecuteFn } from "@/lib/engine/supervisor";
import { capabilities } from "@/lib/engine/execution";
import { connectorStatus } from "@/lib/engine/connectors";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";
import { withTrace } from "@/lib/engine/observability";
import { runGrowthStep, type FunnelSnapshot, type GrowthExperiment } from "@/lib/engine/growth";
import { organicGrowthPlan, type ChannelInput } from "@/lib/engine/organic-growth";
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
  if (url.searchParams.get("probe") === "build") {
    if (process.env.VERCEL && rateLimited(clientIp(req))) {
      return Response.json({ error: "rate limited — wait a minute and retry" }, { status: 429 });
    }
    return Response.json(await probeBuildModel());
  }
  // FOUNDER-GATED full-pipeline dry-run: runs the REAL generate → review → self-repair loop against the
  // live build model (Gemini) and reports whether it produced a review-passing app — WITHOUT deploying (no
  // repo, no public artifact, no abuse surface). Non-null files = passed the gate; fellBack=true = the
  // credible static fallback would be used instead. This is the safe way to prove the build path end-to-end.
  if (url.searchParams.get("probe") === "buildrun") {
    const ses = await getServerSupabase();
    const { data } = (await ses?.auth.getUser()) ?? { data: null };
    if (!data?.user || !isFounderEmail(data.user.email)) {
      return Response.json({ error: "founder-gated — sign in as the founder first" }, { status: 403 });
    }
    const idea = (url.searchParams.get("idea") || "A daily habit tracker: add habits, check them off each day, and see a running streak. Data saved locally on the device.").slice(0, 500);
    const name = (url.searchParams.get("name") || "Habitry").slice(0, 60);
    const t0 = Date.now();
    const files = await generateSiteFiles(name, idea, undefined, "app");
    const ms = Date.now() - t0;
    if (!files) {
      return Response.json({ ok: false, fellBack: true, ms, reason: "no build model, or the generated app failed the review gate — the credible static fallback would be served" });
    }
    const names = Object.keys(files);
    const bytes = names.reduce((n, f) => n + (files[f]?.length ?? 0), 0);
    const hasJs = names.some((f) => /\.js$/.test(f)) || /<script/i.test(files["index.html"] || "");
    return Response.json({ ok: true, mode: "app", reviewPassed: true, fileCount: names.length, files: names, bytes, hasJs, ms, indexPreview: (files["index.html"] || "").slice(0, 220) });
  }
  // FOUNDER-GATED: run the FIRST real full-stack build (#1 Slice 2). Creates a repo in FULLSTACK_GH_ORG,
  // commits the Next.js + Vercel workflow, and dispatches it. Confirms the org + token scope + secrets are
  // wired; the Action (Aider + Vercel deploy) then runs async in the org's Actions tab. Real side-effect
  // (creates one repo), so it's founder-gated + only fires when FULLSTACK_BUILDS is on.
  if (url.searchParams.get("probe") === "fullstack") {
    const ses = await getServerSupabase();
    const { data } = (await ses?.auth.getUser()) ?? { data: null };
    if (!data?.user || !isFounderEmail(data.user.email)) {
      return Response.json({ error: "founder-gated — sign in as the founder first" }, { status: 403 });
    }
    if (!FULLSTACK_BUILDS) {
      return Response.json({ ok: false, reason: "FULLSTACK_BUILDS is not set — add FULLSTACK_BUILDS=1 + FULLSTACK_GH_ORG=<org> on Vercel (Production) and redeploy first." });
    }
    const token = process.env.GITHUB_TOKEN || "";
    if (!token) return Response.json({ ok: false, reason: "no GITHUB_TOKEN on the server" });
    const org = process.env.FULLSTACK_GH_ORG?.trim() || null;
    const goal = (url.searchParams.get("goal") || "a campus tutoring marketplace: post a listing, browse tutors, book a slot — with a real backend").slice(0, 300);
    const t0 = Date.now();
    const out = await dispatchFullstackBuild({ goal, token });
    const ms = Date.now() - t0;
    if ("error" in out) {
      return Response.json({ ok: false, ms, org, reason: out.error });
    }
    return Response.json({ ok: true, ms, org, repo: out.repo, url: out.url, note: "Repo created + secrets injected + workflow dispatched. Open the repo's Actions tab to watch the build; it deploys to Vercel when it finishes." });
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
  | { kind: "goal"; goal: string; roles?: AgentRole[]; build?: boolean; operate?: boolean; connections?: Connections; byok?: ByokConfig }
  | { kind: "organic"; funnel: FunnelSnapshot; channels?: ChannelInput[]; byok?: ByokConfig };

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

  // Per-user daily cap — server-enforced, so a shared group can't drain the operator's model budget.
  // Only applies to model-heavy kinds run on the OPERATOR's key; BYOK users are uncapped (own bill).
  // Fail-open: no DB / not signed in / migration 0022 absent ⇒ allowed (see user-limits.ts).
  const byokKey = body.byok?.apiKey;
  if (!byokKey && (body.kind === "validate" || body.kind === "shift" || body.kind === "goal")) {
    const lim = await checkUserLimit(body.kind);
    if (!lim.allowed) {
      return Response.json(
        {
          error: `Daily limit reached — ${lim.limit} ${body.kind} runs/day on the shared key. Add your own model key in Settings to keep going, or come back tomorrow.`,
          limited: true,
        },
        { status: 429 },
      );
    }
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
        // Build backend preference, best → fallback:
        //   1. OpenHands (paid/self-host) if configured — most autonomous full-app builds.
        //   2. FREE full-app builds via GitHub Actions + Aider (FREE_BUILDS=1 + a GitHub token) — real
        //      multi-file apps at $0, borrowing GitHub's own free compute (docs/FREE-FULLAPP-BUILDS.md).
        //   3. Our GitHub static/client-side builder.
        //   4. Simulated ($0, keyless).
        const oh = openhandsBuildExecutor(body.byok);
        if (oh) {
          execute = oh;
          mode = "openhands";
        }
        // FULL-STACK (Next.js + API routes → Vercel) via free Actions + Aider. Real backend, not static.
        // Flag-gated (FULLSTACK_BUILDS) + fail-soft; see docs/plans/fullstack-builds.md.
        if (!execute) {
          const fs = fullstackBuildExecutor(conn);
          if (fs) {
            execute = fs;
            mode = "fullstack-actions";
          }
        }
        if (!execute && process.env.FREE_BUILDS === "1") {
          const fa = aiderBuildExecutor(conn);
          if (fa) {
            execute = fa;
            mode = "aider-actions";
          }
        }
        if (!execute) {
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

    if (body.kind === "organic") {
      // Organic Growth Engine — pure/deterministic ($0, no model). Turns the brand's REAL funnel + channel
      // attribution into a content plan, winners/losers, and next organic experiments (organic-growth.ts).
      if (!body.funnel || typeof body.funnel !== "object") {
        return Response.json({ error: "`funnel` (a FunnelSnapshot) is required" }, { status: 400 });
      }
      const channels = Array.isArray(body.channels) ? body.channels.slice(0, 12) : [];
      return Response.json({ plan: organicGrowthPlan({ funnel: body.funnel, channels }) });
    }

    return Response.json({ error: "Unknown `kind` (expected 'validate' | 'shift' | 'chat' | 'goal' | 'organic')" }, { status: 400 });
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
