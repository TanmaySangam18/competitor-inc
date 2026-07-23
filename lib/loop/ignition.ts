import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connectionMapStatus } from "@/lib/core/connections";
import { initLoop } from "./loop-engine";
import { insertLoop, loadLoop } from "./loop-driver";
import { scanHackathons, winPlan, type RadarHit } from "./hackathon-radar";
import { isFounderEmail } from "@/lib/engine/founders";
import { postToSlack } from "@/lib/engine/slack";

// ─────────────────────────────────────────────────────────────────────────────
// IGNITION (ADR-0021) — the moment the switches are on, the company starts itself.
//
// Before this file, every autonomous loop existed but nothing BIRTHED one: the cron ticked loops that
// no code ever registered. Ignition closes that gap: each heartbeat checks the connection map, and the
// first tick where cognition exists (a model key) and no company-#0 loop exists yet, it registers the
// loop with a marketing-first roadmap — plus a hackathon objective when the radar finds a live one.
// From then on the existing machinery does everything: the loop spins org-runs, the runs advance
// laptop-off, digests land in Slack, and the governed marketing pipeline posts from real receipts.
//
// HONESTY RULES: ignition never fakes readiness (env-detected, same truth as /connect); it runs
// degraded-but-honest with any subset and SAYS what's dark; every downstream act still passes the same
// policy floor (kill switch, tiers, publishing mandate, treasury envelopes, human money floor).
// ─────────────────────────────────────────────────────────────────────────────

export const TENANT_ZERO = "competitor.inc"; // company #0 — the platform runs itself on its own engine

export interface IgnitionReading {
  ready: boolean; // cognition present — without a model key nothing ignites
  armed: string[]; // connected system ids (env-detected, never assumed)
  dark: string[]; // not connected — the org runs degraded-but-honest without these
  marketingLive: boolean; // social keys present → governed posts can actually publish
}

export function readIgnition(env: Record<string, string | undefined> = process.env): IgnitionReading {
  const map = connectionMapStatus(env);
  const armed = map.filter((c) => c.configured).map((c) => c.id);
  const dark = map.filter((c) => !c.configured).map((c) => c.id);
  return { ready: armed.includes("ai-model"), armed, dark, marketingLive: armed.includes("social") };
}

/** Pure: the roadmap company #0 wakes up with. Criteria are verifiable-artifact phrases (the loop's
 *  evidence matcher is honest — unmatched criteria stay unmet and iterate, never declare victory). */
export function ignitionRoadmap(
  reading: IgnitionReading,
  hackathon?: RadarHit,
): { goal: string; successCriteria: string[]; maxIterations?: number }[] {
  const roadmap: { goal: string; successCriteria: string[]; maxIterations?: number }[] = [
    {
      goal: reading.marketingLive
        ? "Market competitor.inc to its own opted-in audience: draft disclosed AI-authored posts from REAL shipped receipts and publish through the governed pipeline (publishing mandate rails, honesty floor, capped cadence)."
        : "Market competitor.inc: draft disclosed AI-authored posts from REAL shipped receipts; publishing queues for human approval until social accounts connect (degraded-but-honest).",
      successCriteria: ["post", "receipt"],
      maxIterations: 5,
    },
    {
      goal: "Compound the platform: read the real funnel, name the binding constraint, and ship ONE verifiable improvement per iteration through the standard pipeline (build → review → deploy → receipt).",
      successCriteria: ["deploy", "receipt"],
      maxIterations: 6,
    },
  ];
  if (hackathon) {
    roadmap.splice(1, 0, {
      goal: winPlan(hackathon).goal,
      successCriteria: ["rules check", "submission package"],
      maxIterations: 4,
    });
  }
  return roadmap;
}

/** Who owns company #0's loop: FOUNDER_USER_ID when set, else the first auth user on the founder
 *  allow-list. No founder account ⇒ no ignition (the loop must have a real, accountable owner). */
export async function resolveFounderUserId(
  sb: SupabaseClient,
  env: Record<string, string | undefined> = process.env,
): Promise<string | null> {
  if (env.FOUNDER_USER_ID) return env.FOUNDER_USER_ID;
  try {
    const { data } = await sb.auth.admin.listUsers({ perPage: 200 });
    const hit = data?.users?.find((u) => isFounderEmail(u.email));
    return hit?.id ?? null;
  } catch {
    return null;
  }
}

export interface IgniteDeps {
  env?: Record<string, string | undefined>;
  scan?: typeof scanHackathons; // injectable → offline tests
  notify?: (text: string) => Promise<void>;
}

/** The ignition check, run every heartbeat. Idempotent: once the loop exists this is a cheap no-op. */
export async function igniteCompanyZero(
  sb: SupabaseClient,
  deps: IgniteDeps = {},
): Promise<{ ignited: boolean; detail: string }> {
  const env = deps.env ?? process.env;
  const reading = readIgnition(env);
  if (!reading.ready) {
    return { ignited: false, detail: "dark — no model key; the org has no cognition, nothing ignites" };
  }
  const existing = await loadLoop(sb, TENANT_ZERO).catch(() => null);
  if (existing) return { ignited: false, detail: "already running — the loop exists; ticks advance it" };
  const userId = await resolveFounderUserId(sb, env);
  if (!userId) {
    return { ignited: false, detail: "no founder account to own the loop — set FOUNDER_USER_ID or sign in once with a founder email" };
  }

  // $0 ride-along: if the radar finds a live cash-prize hackathon right now, it's born as an objective.
  const scan = deps.scan ?? scanHackathons;
  const scanned = await scan({ minPrizeUsd: 1000 }).catch(() => ({ ok: false as const, error: "scan failed" }));
  const hit = scanned.ok ? scanned.hits.find((h) => h.openState === "open") ?? scanned.hits[0] : undefined;

  const state = initLoop(TENANT_ZERO, ignitionRoadmap(reading, hit));
  await insertLoop(sb, userId, state);

  const total = reading.armed.length + reading.dark.length;
  const detail =
    `IGNITION — company #0 started itself: ${state.objectives.length} objectives, ` +
    `${reading.armed.length}/${total} systems armed` +
    (hit ? ` · hackathon on the roadmap: ${hit.title}` : "") +
    (reading.dark.length ? ` · running degraded-but-honest without: ${reading.dark.join(", ")}` : "");
  const notify =
    deps.notify ??
    (async (text: string) => {
      const ch = env.SLACK_LOOP_CHANNEL;
      if (ch) await postToSlack(ch, text).catch(() => {});
    });
  await notify(detail);
  return { ignited: true, detail };
}
