// ─────────────────────────────────────────────────────────────────────────────
// THE TREASURY — the "bank for the 56" (ADR-0020). Per-department budget ENVELOPES so routine,
// in-budget spend runs SILENTLY (no Slack ping) and only the two things that legally need a human
// escalate: (1) spend OVER the envelope the human set, and (2) any real WITHDRAWAL / transfer of funds.
//
// This is standing authorization, NOT removal of the floor. The human sets each envelope ONCE (a cap);
// agents debit within it autonomously. It composes with the existing spend caps + autopilot — the
// per-transaction / daily / monthly policy caps still apply ON TOP (the envelope can't exceed them, and
// a single txn over the policy cap still escalates regardless of envelope room).
//
// HARD FLOOR (unchanged, enforced here too): agents NEVER move money OUT. A withdrawal/transfer is a
// T3 human-only act — the treasury records the request and escalates; it does not execute it. Envelopes
// track spend against the customer's OWN connected account; competitor.inc never holds or moves funds.
// ─────────────────────────────────────────────────────────────────────────────

import { POLICY, type Policy } from "@/lib/core/policy";

export type TreasuryKind = "debit" | "withdraw"; // debit = in-budget spend · withdraw = move funds OUT (human-only)

export interface Envelope {
  department: string; // Department.id
  monthlyCapUsd: number; // the human-set budget for this department (the standing authorization)
  spentThisMonthUsd: number; // running debits this month
}

export interface TreasuryRequest {
  department: string;
  kind: TreasuryKind;
  amountUsd: number;
  memo: string;
}

export type TreasuryVerdict =
  | { decision: "auto"; reason: string; remainingUsd: number } // silent — in-budget debit, runs, no human
  | { decision: "escalate"; reason: string; remainingUsd: number } // over-envelope or over-policy-cap → human
  | { decision: "block"; reason: string }; // withdrawals + invalid input — the hard floor / bad request

/**
 * Rule the request against the department's envelope AND the policy caps. Pure + deterministic.
 * - withdraw → always BLOCK here (routes to the human money floor; the treasury never moves funds out).
 * - debit within the envelope AND within the per-transaction policy cap → AUTO (silent).
 * - debit that would exceed the envelope OR the per-transaction cap → ESCALATE (never silently overspend).
 */
export function ruleSpend(env: Envelope, req: TreasuryRequest, policy: Policy = POLICY): TreasuryVerdict {
  if (req.kind === "withdraw") {
    return { decision: "block", reason: "withdrawals/transfers move funds OUT — a human-only act; the treasury never executes them" };
  }
  const amt = req.amountUsd;
  if (!Number.isFinite(amt) || amt <= 0) return { decision: "block", reason: "invalid amount" };
  if (req.department !== env.department) return { decision: "block", reason: "envelope/department mismatch" };

  const spent = Math.max(0, env.spentThisMonthUsd);
  const remainingBefore = Math.max(0, env.monthlyCapUsd - spent);

  // A single txn above the platform per-transaction cap always escalates, regardless of envelope room.
  if (amt > policy.spend.perTransactionCapUsd) {
    return { decision: "escalate", reason: `$${amt} exceeds the per-transaction cap ($${policy.spend.perTransactionCapUsd}) — human sign-off`, remainingUsd: remainingBefore };
  }
  // Would it blow the department's monthly envelope?
  if (spent + amt > env.monthlyCapUsd) {
    return { decision: "escalate", reason: `$${amt} would exceed ${env.department}'s $${env.monthlyCapUsd}/mo budget ($${remainingBefore.toFixed(2)} left) — human sign-off`, remainingUsd: remainingBefore };
  }
  return { decision: "auto", reason: `in-budget: $${amt} of ${env.department}'s $${env.monthlyCapUsd}/mo — runs silently`, remainingUsd: remainingBefore - amt };
}

/** Apply an approved debit (pure — returns the next envelope; callers persist it). AUTO debits apply
 *  immediately; an escalated debit applies only after the human signs (same function, post-approval). */
export function applyDebit(env: Envelope, amountUsd: number): Envelope {
  return { ...env, spentThisMonthUsd: Math.max(0, env.spentThisMonthUsd) + Math.max(0, amountUsd) };
}

/** Reset at month roll-over (the driver calls this on a new UTC month). */
export function rollMonth(env: Envelope): Envelope {
  return { ...env, spentThisMonthUsd: 0 };
}

/** The departments that can spend at all (matrix cell ≠ NEVER) — the envelope panel offers exactly
 *  these, so the bank UI can never invent a spender the policy forbids. */
export function spendDepartments(policy: Policy = POLICY): string[] {
  return (Object.keys(policy.matrix) as Array<keyof Policy["matrix"]>).filter((d) => policy.matrix[d]?.spend !== "NEVER");
}

/** A department's envelope health, for the Stream/Slack digest (never a surprise at month-end). */
export function envelopeStatus(env: Envelope): { remainingUsd: number; pctUsed: number; low: boolean } {
  const spent = Math.max(0, env.spentThisMonthUsd);
  const remainingUsd = Math.max(0, env.monthlyCapUsd - spent);
  const pctUsed = env.monthlyCapUsd > 0 ? Math.min(100, Math.round((spent / env.monthlyCapUsd) * 100)) : 0;
  return { remainingUsd, pctUsed, low: pctUsed >= 80 };
}
