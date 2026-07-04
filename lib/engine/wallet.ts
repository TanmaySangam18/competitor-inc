// The Business Wallet — funded, permissioned spending by AI agents on the user's behalf.
//
// Pure + deterministic (no I/O) so it's unit-testable and behaves identically in the API, the cron,
// and tests. It is the FUNDED, user-configurable layer that sits IN FRONT of the policy engine
// (lib/engine/policy.ts): a spend must clear the wallet (funded balance, per-transaction cap, monthly
// cap, per-category budget, not paused/revoked) AND then policy.decide() gives the AUTO/QUEUE/BLOCK
// verdict. The wallet answers "is this money the user authorized to be spent this way?"; policy
// answers "is this action safe/compliant/reversible?". Both must pass.
//
// Money is stored in CENTS (integers) end-to-end — never floats — so audit totals are exact.
// Every transaction is attributable to a specific agent + task, and nothing spends while paused or
// revoked. The user can pause or revoke at any time; refunds are tracked and restore spendable funds.

import type { AgentRole } from "./types";

/* ── categories the crew may spend on (nothing else is a valid business expense) ── */
export type SpendCategory =
  | "domain"
  | "hosting"
  | "cloud"
  | "ads"
  | "saas"
  | "api"
  | "ai_service"
  | "marketing"
  | "tool"
  | "other";

export const SPEND_CATEGORIES: SpendCategory[] = [
  "domain", "hosting", "cloud", "ads", "saas", "api", "ai_service", "marketing", "tool", "other",
];

/* ── config (user-controlled) ─────────────────────────────────────────────── */
export interface WalletConfig {
  fundedCents: number; // total the user has funded (gross); spendable = funded − net spent
  perTransactionCapCents: number; // hard ceiling on a single spend
  monthlyCapCents: number; // hard ceiling on spend per calendar month
  autoApproveUnderCents: number; // spends strictly under this auto-approve; at/above → queue for the user
  categoryBudgetsCents: Partial<Record<SpendCategory, number>>; // optional per-category monthly caps
  paused: boolean; // user hit pause — no new spend clears
  revoked: boolean; // user revoked agent spending entirely — terminal until re-enabled
}

export const DEFAULT_WALLET: WalletConfig = {
  fundedCents: 0,
  perTransactionCapCents: 5000, // $50 — mirrors the policy per-transaction floor
  monthlyCapCents: 200000, // $2,000
  autoApproveUnderCents: 2000, // under $20 auto; $20+ asks the user
  categoryBudgetsCents: {},
  paused: false,
  revoked: false,
};

/* ── transactions (the audit log) ─────────────────────────────────────────── */
export type TxnStatus = "pending" | "approved" | "executed" | "blocked" | "refunded";

export interface WalletTxn {
  id: string;
  agent: AgentRole;
  task: string; // what the spend was for — human-readable, attributable
  category: SpendCategory;
  amountCents: number;
  vendor?: string; // e.g. "Namecheap", "Vercel", "Meta Ads"
  description?: string;
  status: TxnStatus;
  refundCents?: number; // set when (partially) refunded
  createdAt: number;
  month: string; // "YYYY-MM" for fast monthly aggregation
}

export interface SpendRequest {
  agent: AgentRole;
  task: string;
  category: SpendCategory;
  amountCents: number;
  vendor?: string;
  description?: string;
}

/* ── verdict ──────────────────────────────────────────────────────────────── */
export type WalletVerdict = "auto" | "approve" | "block";
export interface WalletDecision {
  verdict: WalletVerdict;
  reason: string;
}

const monthKey = (ts: number): string => new Date(ts).toISOString().slice(0, 7);

/** Net money already committed (executed/approved/pending, minus refunds). */
export function committedCents(txns: WalletTxn[]): number {
  let sum = 0;
  for (const t of txns) {
    if (t.status === "blocked") continue;
    sum += t.amountCents - (t.refundCents ?? 0);
  }
  return sum;
}

/** Spendable balance = funded − net committed. */
export function balanceCents(wallet: WalletConfig, txns: WalletTxn[]): number {
  return wallet.fundedCents - committedCents(txns);
}

/** Net spend in a given month (default: current). */
export function spentThisMonthCents(txns: WalletTxn[], now: number = Date.now()): number {
  const m = monthKey(now);
  let sum = 0;
  for (const t of txns) {
    if (t.status === "blocked" || t.month !== m) continue;
    sum += t.amountCents - (t.refundCents ?? 0);
  }
  return sum;
}

/** Net spend by category this month. */
export function spentByCategoryCents(txns: WalletTxn[], now: number = Date.now()): Partial<Record<SpendCategory, number>> {
  const m = monthKey(now);
  const out: Partial<Record<SpendCategory, number>> = {};
  for (const t of txns) {
    if (t.status === "blocked" || t.month !== m) continue;
    out[t.category] = (out[t.category] ?? 0) + t.amountCents - (t.refundCents ?? 0);
  }
  return out;
}

/**
 * The wallet's authorization decision for a proposed spend. Runs BEFORE policy.decide().
 * BLOCK is terminal (hard limit / no funds / paused / revoked). APPROVE means "queue for the user".
 * AUTO means "the wallet permits it unattended" (policy still gets the final say downstream).
 */
export function decideSpend(
  wallet: WalletConfig,
  req: SpendRequest,
  txns: WalletTxn[],
  now: number = Date.now()
): WalletDecision {
  if (wallet.revoked) return { verdict: "block", reason: "Agent spending is revoked — re-enable it in the wallet to allow spend." };
  if (wallet.paused) return { verdict: "block", reason: "Spending is paused — resume it in the wallet to allow spend." };
  if (req.amountCents <= 0) return { verdict: "block", reason: "Spend amount must be positive." };

  const balance = balanceCents(wallet, txns);
  if (req.amountCents > balance) {
    return { verdict: "block", reason: `Insufficient funds: needs $${(req.amountCents / 100).toFixed(2)}, balance is $${(balance / 100).toFixed(2)}. Fund the wallet to proceed.` };
  }
  if (req.amountCents > wallet.perTransactionCapCents) {
    return { verdict: "block", reason: `Over the per-transaction cap ($${(wallet.perTransactionCapCents / 100).toFixed(2)}). Raise the cap in the wallet or split the spend.` };
  }
  if (spentThisMonthCents(txns, now) + req.amountCents > wallet.monthlyCapCents) {
    return { verdict: "block", reason: `Would exceed this month's cap ($${(wallet.monthlyCapCents / 100).toFixed(2)}).` };
  }
  const catBudget = wallet.categoryBudgetsCents[req.category];
  if (catBudget != null) {
    const catSpent = spentByCategoryCents(txns, now)[req.category] ?? 0;
    if (catSpent + req.amountCents > catBudget) {
      return { verdict: "block", reason: `Would exceed the ${req.category} budget ($${(catBudget / 100).toFixed(2)}).` };
    }
  }
  // Within all limits — small enough to run unattended, or big enough to ask the user.
  if (req.amountCents >= wallet.autoApproveUnderCents) {
    return { verdict: "approve", reason: `$${(req.amountCents / 100).toFixed(2)} is at or above your auto-approve threshold — queued for your yes.` };
  }
  return { verdict: "auto", reason: "Within your wallet limits and under the auto-approve threshold." };
}

/* ── budget monitoring / notifications ────────────────────────────────────── */
export interface BudgetAlert {
  scope: "monthly" | SpendCategory;
  usedCents: number;
  capCents: number;
  pct: number; // 0..100+
  level: "warning" | "critical"; // 80% warn, 100%+ critical
}

/** Alerts when monthly or a category budget crosses 80% (warning) / 100% (critical). */
export function budgetAlerts(wallet: WalletConfig, txns: WalletTxn[], now: number = Date.now()): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const push = (scope: BudgetAlert["scope"], used: number, cap: number) => {
    if (cap <= 0) return;
    const pct = Math.round((used / cap) * 100);
    if (pct >= 100) alerts.push({ scope, usedCents: used, capCents: cap, pct, level: "critical" });
    else if (pct >= 80) alerts.push({ scope, usedCents: used, capCents: cap, pct, level: "warning" });
  };
  push("monthly", spentThisMonthCents(txns, now), wallet.monthlyCapCents);
  const byCat = spentByCategoryCents(txns, now);
  for (const [cat, cap] of Object.entries(wallet.categoryBudgetsCents)) {
    if (cap != null) push(cat as SpendCategory, byCat[cat as SpendCategory] ?? 0, cap);
  }
  return alerts;
}

/* ── mutations (pure — return new records; the DB layer persists) ─────────── */

export function newTxn(req: SpendRequest, status: TxnStatus, makeId: () => string = () => crypto.randomUUID(), now: number = Date.now()): WalletTxn {
  return {
    id: makeId(),
    agent: req.agent,
    task: req.task,
    category: req.category,
    amountCents: req.amountCents,
    vendor: req.vendor,
    description: req.description,
    status,
    createdAt: now,
    month: monthKey(now),
  };
}

/** Record a refund against a transaction (bounded to the original amount). */
export function applyRefund(txn: WalletTxn, refundCents: number): WalletTxn {
  const capped = Math.max(0, Math.min(refundCents, txn.amountCents));
  return { ...txn, refundCents: capped, status: "refunded" };
}

/* ── spend lifecycle: request → approve → execute (the "approve option") ──────
   NON-CUSTODIAL: the wallet is a budget + policy + audit layer, never a holder of the user's cash.
   "Executed" means the spend cleared the caps + a human yes and fired on the user's OWN connected
   rail (their vendor account / payment method). competitor.inc doesn't move the money, so it isn't a
   money transmitter. requestSpend classifies; approveSpend/rejectSpend are the founder's one-tap yes/no. */

// Classify a proposed spend AND produce the transaction in the right initial state:
//   auto    → executed straight away (within caps, under the auto-approve threshold)
//   approve → pending (parked for the human's one-tap approve)
//   block   → blocked (recorded so the audit log shows the refusal + why)
export function requestSpend(
  wallet: WalletConfig,
  req: SpendRequest,
  txns: WalletTxn[],
  makeId: () => string = () => crypto.randomUUID(),
  now: number = Date.now()
): { decision: WalletDecision; txn: WalletTxn } {
  const decision = decideSpend(wallet, req, txns, now);
  const status: TxnStatus = decision.verdict === "auto" ? "executed" : decision.verdict === "approve" ? "pending" : "blocked";
  return { decision, txn: newTxn(req, status, makeId, now) };
}

// The human's one-tap yes on a pending spend → executed. No-op unless pending.
export function approveSpend(txn: WalletTxn): WalletTxn {
  return txn.status === "pending" ? { ...txn, status: "executed" } : txn;
}

// The human's no → blocked (never spent). No-op unless pending.
export function rejectSpend(txn: WalletTxn): WalletTxn {
  return txn.status === "pending" ? { ...txn, status: "blocked" } : txn;
}

export const pause = (w: WalletConfig): WalletConfig => ({ ...w, paused: true });
export const resume = (w: WalletConfig): WalletConfig => ({ ...w, paused: false });
export const revoke = (w: WalletConfig): WalletConfig => ({ ...w, revoked: true, paused: true });
export const reinstate = (w: WalletConfig): WalletConfig => ({ ...w, revoked: false, paused: false });
