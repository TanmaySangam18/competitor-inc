// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 7 — THE FUNDING-PROOF PACK
//
// The artifact competitor.inc shows an investor: "here is an autonomous software company, and here is the
// VERIFIED evidence it works." Pure assembler — takes already-computed, already-verified inputs and
// composes the pack. It NEVER fabricates: every dollar is settled + receipted, every proof re-verified
// upstream (/api/proof), every autonomy number derived from real logged activities. If there's no
// evidence yet, the pack says so plainly (an empty pack is the honest state pre-revenue).
//
// This is the anti-money-printer thesis made into a document: we only get to claim what we can prove.
// ─────────────────────────────────────────────────────────────────────────────

import { DEPARTMENTS, ROLES, orgSize } from "./organization";
import { FOUNDER_GATED_KINDS } from "./autopilot";

// ── Inputs (all computed elsewhere, all real) ────────────────────────────────

export interface AutonomyStats {
  ranAutonomously: number; // activities the autopilot resolved itself (standing authorization)
  neededFounder: number; // actions that queued for the human (the gated exceptions)
  killSwitchEngagements: number; // times the founder hit the hard stop
}

export interface VerifiedRevenue {
  collectedUsd: number; // SETTLED money received (never invoiced/pledged/MRR-on-paper)
  paidCustomers: number; // distinct customers with a verified receipt
  windowDays: number; // the trailing window the collected figure covers
  repeatablePct?: number; // % of collected revenue that recurs next period (Charter's ≥60% test)
}

export interface ProofSummary {
  totalReceipts: number; // receipted real outcomes on the proof ledger
  liveReceipts: number; // of those, re-verified live at load (dead links don't count)
}

export interface FundingPackInput {
  companyName: string;
  goalUsd: number; // the Charter target ($10,000)
  autonomy: AutonomyStats;
  revenue: VerifiedRevenue;
  proof: ProofSummary;
}

// ── Output ───────────────────────────────────────────────────────────────────

export type ClaimStatus = "proven" | "in-progress" | "not-yet";

export interface PackClaim {
  label: string;
  value: string;
  status: ClaimStatus;
  basis: string; // WHERE the number comes from — so a reader can audit it, not trust it
}

export interface FundingPack {
  headline: string;
  org: { departments: number; positions: number; gatedActionClasses: number };
  claims: PackClaim[];
  autonomyRatePct: number; // ranAutonomously / (ran + needed) — the "how autonomous, really" number
  goalProgressPct: number; // collectedUsd / goalUsd, capped at 100
  honestyNote: string;
  generatedAt: string;
}

const pct = (num: number, den: number): number => (den > 0 ? Math.round((num / den) * 100) : 0);
const money = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

// The single autonomy metric that survives scrutiny: of the consequential actions taken, how many ran
// without a human — honestly bounded to [0,100], and 0 when nothing has run yet (never a flattering NaN).
export function autonomyRate(a: AutonomyStats): number {
  return pct(a.ranAutonomously, a.ranAutonomously + a.neededFounder);
}

export function buildFundingPack(input: FundingPackInput): FundingPack {
  const { companyName, goalUsd, autonomy, revenue, proof } = input;
  const rate = autonomyRate(autonomy);
  const goalProgress = Math.min(100, pct(revenue.collectedUsd, goalUsd));

  // Every claim declares its own status + basis. "proven" requires real, verified evidence; anything
  // unproven is labeled in-progress/not-yet — we never dress a zero as a win.
  const claims: PackClaim[] = [
    {
      label: "Collected revenue (verified)",
      value: money(revenue.collectedUsd),
      status: revenue.collectedUsd > 0 ? "proven" : "not-yet",
      basis: `settled payments with receipts over the trailing ${revenue.windowDays} days — not invoiced, not MRR-on-paper`,
    },
    {
      label: "Paying customers",
      value: String(revenue.paidCustomers),
      status: revenue.paidCustomers > 0 ? "proven" : "not-yet",
      basis: "distinct customers with a verified payment receipt",
    },
    {
      label: "Goal progress",
      value: `${goalProgress}% of ${money(goalUsd)}`,
      status: goalProgress >= 100 ? "proven" : revenue.collectedUsd > 0 ? "in-progress" : "not-yet",
      basis: "collected ÷ Charter target (trailing 30-day window)",
    },
    {
      label: "Repeatable revenue",
      value: revenue.repeatablePct != null ? `${revenue.repeatablePct}%` : "—",
      status: (revenue.repeatablePct ?? 0) >= 60 ? "proven" : revenue.repeatablePct != null ? "in-progress" : "not-yet",
      basis: "share of collected revenue that recurs next period (Charter bar: ≥60%)",
    },
    {
      label: "Actions run autonomously",
      value: `${autonomy.ranAutonomously} (${rate}%)`,
      status: autonomy.ranAutonomously > 0 ? "proven" : "not-yet",
      basis: "activities the autopilot resolved under standing authorization, from the logged Glass Box",
    },
    {
      label: "Human sign-offs required",
      value: String(autonomy.neededFounder),
      status: "proven",
      basis: `only the ${FOUNDER_GATED_KINDS.size} high-consequence classes (money, contracts, pricing, deletion, prod launches)`,
    },
    {
      label: "Live receipts on the proof ledger",
      value: `${proof.liveReceipts} / ${proof.totalReceipts}`,
      status: proof.liveReceipts > 0 ? "proven" : "not-yet",
      basis: "real outcomes re-verified live at load — dead links excluded",
    },
  ];

  const proven = claims.filter((c) => c.status === "proven").length;
  const headline =
    revenue.collectedUsd > 0
      ? `${companyName}: an autonomous software company that has collected ${money(revenue.collectedUsd)} — every dollar receipted.`
      : `${companyName}: an autonomous software company, wired and governed — revenue proof accrues here as it's collected (nothing fabricated).`;

  return {
    headline,
    org: { departments: DEPARTMENTS.length, positions: orgSize(), gatedActionClasses: FOUNDER_GATED_KINDS.size },
    claims,
    autonomyRatePct: rate,
    goalProgressPct: goalProgress,
    honestyNote:
      `${proven} of ${claims.length} claims are backed by verified evidence right now. ` +
      "This pack shows only what can be proven: settled revenue with receipts, live-checked proof links, and " +
      "autonomy counts from the real activity log. Unproven lines are labeled honestly, never inflated.",
    generatedAt: new Date().toISOString(),
  };
}

// Roster snapshot for the pack's "the company" section — titles only (the JD lives on /company).
export function orgRosterSummary(): Array<{ department: string; roles: string[] }> {
  return DEPARTMENTS.map((d) => ({
    department: d.name,
    roles: ROLES.filter((r) => r.department === d.id).map((r) => r.title),
  }));
}
