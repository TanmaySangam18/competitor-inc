// lib/core/trial.ts — ZERO CONNECTIONS TO LOOK, ONE TO OWN.
//
// A1 took the required connections from four to one. This takes the required connections to look at the
// thing from one to ZERO, by lending the visitor the platform's own free-tier model key for a strictly
// capped number of calls.
//
// WHY THIS DOES NOT BREAK BYOK. The standing rule is that we never HOLD a customer's keys. Lending our
// own, under a cap we control, is the opposite of that: nothing of theirs is stored, and the moment they
// want to own the output they bring a key and the trial ends. Cofounder calls this graduation; the shape
// is the same and the direction of trust is the honest one.
//
// THE BLAST RADIUS IS THE POINT. A trial that could deploy, publish, email or spend would be an abuse
// surface with our name on the outbound. So the trial can do exactly ONE capability: think. It can plan,
// research, draft and decide, and it can do nothing that leaves the building. That is simultaneously the
// honest scope of a free look, the containment boundary, and the reason to connect something.
//
// FAIL-CLOSED, unlike the request rate limiter. lib/engine/ratelimit.ts deliberately fails OPEN because
// it protects cost, not money, and availability wins there. This is a shared budget on someone else's
// dime, so an unknown state must refuse. Cheap to be wrong in the refusing direction; expensive the other
// way.

import { killSwitch } from "./killswitch";
import type { CapabilityId } from "./capabilities";

/** The only capability a trial visitor may exercise. Everything else needs their own connection. */
export const TRIAL_CAPABILITIES: readonly CapabilityId[] = ["think"] as const;

export interface TrialPolicy {
  /** Ceiling across every visitor, per UTC day. The real protection on a shared free tier. */
  dailyPlatformCap: number;
  /** Ceiling for one visitor, per UTC day. Stops one person eating the whole allowance. */
  perVisitorDailyCap: number;
  /** Token ceiling per call, so a single prompt cannot drain the budget. */
  maxTokensPerCall: number;
}

export const TRIAL_POLICY: TrialPolicy = {
  dailyPlatformCap: 500,
  perVisitorDailyCap: 5,
  maxTokensPerCall: 1200,
};

/** Counters the caller persists. Kept as plain data so the store can be memory, KV or Postgres. */
export interface TrialUsage {
  /** UTC day key, e.g. "2026-08-16". Counters reset when this rolls over. */
  day: string;
  platformCalls: number;
  perVisitor: Record<string, number>;
}

export interface TrialDecision {
  allowed: boolean;
  reason: string;
  /** What this visitor has left today. Zero when refused for any reason. */
  remainingForVisitor: number;
  /** Shown verbatim wherever trial output appears. Never omitted, never softened. */
  notice: string;
  maxTokens: number;
}

export const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);

export const TRIAL_NOTICE =
  "Running on competitor.inc's own capped model key, so you can see it work before connecting anything. It can think, plan and draft. It cannot deploy, publish, email or spend until you connect your own key.";

/** Fresh counters for a day. */
export const emptyUsage = (now: number = Date.now()): TrialUsage => ({ day: dayKey(now), platformCalls: 0, perVisitor: {} });

/** Roll counters over at the UTC day boundary rather than letting yesterday's total block today. */
export function rolled(usage: TrialUsage, now: number): TrialUsage {
  const today = dayKey(now);
  return usage.day === today ? usage : emptyUsage(now);
}

/**
 * May this visitor make a trial call? Every refusal names its reason, because a silent "no" on a free
 * trial reads as a broken product.
 */
export function trialDecision(
  usage: TrialUsage,
  visitorId: string,
  capability: CapabilityId,
  opts: { now?: number; policy?: TrialPolicy; platformKeyPresent?: boolean } = {},
): TrialDecision {
  const now = opts.now ?? Date.now();
  const policy = opts.policy ?? TRIAL_POLICY;
  const u = rolled(usage, now);
  const used = u.perVisitor[visitorId] ?? 0;
  const remaining = Math.max(0, policy.perVisitorDailyCap - used);
  const deny = (reason: string): TrialDecision => ({
    allowed: false,
    reason,
    remainingForVisitor: 0,
    notice: TRIAL_NOTICE,
    maxTokens: policy.maxTokensPerCall,
  });

  // The kill switch sits above the trial exactly as it sits above everything else.
  const halt = killSwitch.haltReason({});
  if (halt) return deny(halt);

  // Fail closed: no platform key means no trial, rather than a confusing half-working demo.
  if (opts.platformKeyPresent === false) {
    return deny("the trial key is not configured on this deployment");
  }

  if (!visitorId.trim()) return deny("no visitor identity, so the per-visitor cap cannot be enforced");

  if (!TRIAL_CAPABILITIES.includes(capability)) {
    return deny(`the trial can only think. ${capability} needs your own connection, which is the point at which you own the output.`);
  }

  if (u.platformCalls >= policy.dailyPlatformCap) {
    return deny("the shared trial allowance for today is used up. Connect one model key and there is no cap at all.");
  }

  if (used >= policy.perVisitorDailyCap) {
    return deny(`you have used today's ${policy.perVisitorDailyCap} free runs. Connect one model key to keep going.`);
  }

  return {
    allowed: true,
    reason: `trial run ${used + 1} of ${policy.perVisitorDailyCap}`,
    remainingForVisitor: remaining - 1,
    notice: TRIAL_NOTICE,
    maxTokens: policy.maxTokensPerCall,
  };
}

/** Record a consumed call. Pure: returns the next counters rather than mutating shared state. */
export function consume(usage: TrialUsage, visitorId: string, now: number = Date.now()): TrialUsage {
  const u = rolled(usage, now);
  return {
    day: u.day,
    platformCalls: u.platformCalls + 1,
    perVisitor: { ...u.perVisitor, [visitorId]: (u.perVisitor[visitorId] ?? 0) + 1 },
  };
}

/** The honest line for the front door, so the offer is never overstated. */
export function trialOffer(policy: TrialPolicy = TRIAL_POLICY): string {
  return `${policy.perVisitorDailyCap} free runs a day on our key, no signup. Connect one model key when you want it to keep going, and to own what it makes.`;
}
