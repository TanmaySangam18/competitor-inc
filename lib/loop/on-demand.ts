// lib/loop/on-demand.ts — RUN NOW (the time-to-first-value fix).
//
// THE PROBLEM THIS SOLVES: the outer loop's only caller was Vercel Cron, once a day at 07:00 UTC. A user
// who signed up at noon saw nothing until the next morning. Eighteen hours to first value is not a
// marketing problem, it is an architecture one, and it is the single widest gap against products where
// you type a sentence and something happens.
//
// WHAT THIS IS NOT: a bypass. Everything the nightly tick respects, this respects, because it calls the
// same tickLoop. Specifically it will NOT run when the loop is waiting on a human. "needs-human" is the
// governance floor expressing itself, and an impatient user is not a reason to step over it.
//
// FOUR GUARDS, because on-demand means user-triggered means someone will hold the button down:
//   1. KILL SWITCH first, before any work is considered.
//   2. COOLDOWN per tenant. Each tick can spend real model budget, so a run-now is rate limited in
//      seconds, not just by the HTTP layer.
//   3. BOUNDED TICKS. One request advances the loop a few steps, never indefinitely. A loop that needs
//      more than that gets it on the next request or the next nightly tick.
//   4. HONEST STOP REASON. Every result says exactly why it stopped, including when the answer is
//      "nothing to do right now", which is a real and common outcome.

import type { TickResult } from "@/lib/loop/loop-driver";

/** How many ticks a single run-now may advance. Enough to feel instant, small enough to bound spend. */
export const MAX_TICKS = 3;
/** Minimum seconds between two run-now calls for the same tenant. */
export const COOLDOWN_SECONDS = 60;

export interface OnDemandDeps {
  tick: (tenant: string) => Promise<TickResult>;
  /** true ⇒ everything is halted for this tenant (kill switch / freeze). Checked before any work. */
  halted?: (tenant: string) => boolean;
  /** epoch ms of the last run-now for this tenant, or null. */
  lastRunAt?: (tenant: string) => number | null;
  /** persist that a run happened, for the cooldown. */
  markRun?: (tenant: string, at: number) => void;
  now?: () => number;
}

export type StopReason =
  | "halted"
  | "cooling-down"
  | "no-loop"
  | "needs-human"
  | "finished"
  | "waiting"
  | "tick-cap"
  | "error";

export interface OnDemandResult {
  ok: boolean;
  ran: number; // ticks actually executed
  ticks: TickResult[];
  transcript: string[]; // plain lines a chat surface can render as-is
  stoppedBecause: StopReason;
  retryAfterSeconds?: number; // set when cooling down, so the caller can say when
}

/**
 * Per-process cooldown store. HONEST LIMITATION: serverless instances are ephemeral, so a cold start
 * forgets the last run and a user could get one extra tick. That is an acceptable overrun for a
 * 60-second window; making it durable is a table write per request, which is the follow-up if abuse
 * ever shows up in practice. It is stated here rather than hidden.
 */
export function makeCooldown() {
  const seen = new Map<string, number>();
  return {
    lastRunAt: (tenant: string) => seen.get(tenant) ?? null,
    markRun: (tenant: string, at: number) => { seen.set(tenant, at); },
  };
}

const line = (r: TickResult): string => {
  switch (r.acted) {
    case "started-objective": return `Started the next objective. ${r.detail}`;
    case "spun-iteration": return `Ran an iteration. ${r.detail}`;
    case "advanced": return `Objective met and advanced. ${r.detail}`;
    case "waiting": return `Work is in flight. ${r.detail}`;
    case "paused": return `Paused for you. ${r.detail}`;
    case "finished": return `Roadmap complete. ${r.detail}`;
    case "no-loop": return `No loop is registered yet. ${r.detail}`;
  }
};

/**
 * Advance a tenant's loop right now, up to MAX_TICKS. Returns a transcript rather than a status code,
 * because the caller is usually a person who just typed something and is watching.
 */
export async function runNow(tenant: string, deps: OnDemandDeps): Promise<OnDemandResult> {
  const now = deps.now ?? (() => Date.now());
  const at = now();
  const ticks: TickResult[] = [];
  const transcript: string[] = [];

  const done = (ok: boolean, stoppedBecause: StopReason, extra?: Partial<OnDemandResult>): OnDemandResult => ({
    ok, ran: ticks.length, ticks, transcript, stoppedBecause, ...extra,
  });

  // 1 — the kill switch outranks the user's impatience.
  if (deps.halted?.(tenant)) {
    transcript.push("Everything is halted. Nothing runs until the kill switch is released.");
    return done(false, "halted");
  }

  // 2 — cooldown. Each tick can spend real money, so this is measured in seconds, not requests.
  const last = deps.lastRunAt?.(tenant) ?? null;
  if (last !== null) {
    const elapsed = (at - last) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      const retryAfterSeconds = Math.max(1, Math.ceil(COOLDOWN_SECONDS - elapsed));
      transcript.push(`Just ran. Give it ${retryAfterSeconds} more second${retryAfterSeconds === 1 ? "" : "s"}.`);
      return done(false, "cooling-down", { retryAfterSeconds });
    }
  }
  deps.markRun?.(tenant, at);

  // 3 — advance, bounded.
  for (let i = 0; i < MAX_TICKS; i++) {
    let r: TickResult;
    try {
      r = await deps.tick(tenant);
    } catch (e) {
      transcript.push(`The tick failed: ${e instanceof Error ? e.message : "unknown error"}`);
      return done(false, "error");
    }
    ticks.push(r);
    transcript.push(line(r));

    // Terminal or human-gated states end the run immediately. "paused" is the floor, not a hiccup.
    if (r.acted === "no-loop") return done(false, "no-loop");
    if (r.acted === "paused") return done(true, "needs-human");
    if (r.acted === "finished") return done(true, "finished");
    // Work is running elsewhere (an org-run is mid-flight). More ticks now would not help.
    if (r.acted === "waiting") return done(true, "waiting");
  }

  transcript.push(`Advanced ${MAX_TICKS} steps. Run again for more, or the nightly tick will continue on its own.`);
  return done(true, "tick-cap");
}
