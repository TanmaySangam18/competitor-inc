// ─────────────────────────────────────────────────────────────────────────────
// THE FINANCE LOOP's REPORT (Connect-First Reset §4) — "read Stripe/Mercury, render the report, deliver."
//
// THE HONESTY CONTRACT (crack-audit standing rule — no fabricated numbers, ever):
//   · This module NEVER produces a number. It renders numbers HANDED to it — the caller reads them from
//     the real sources (settled revenue from the billing webhook ledger, cost from the audit-ledger rollup
//     in lib/core/economics.ts rollupCosts/marginFor — the finance agents' ground truth).
//   · A metric the caller doesn't have is undefined/null and renders as "not connected" — NEVER a
//     zero-padded $0.00 that would read as "we earned nothing" when the truth is "we can't see it yet".
//   · Margin is computed ONLY when both of its terms are real. Half-known arithmetic is fiction.
//
// PDF rendering is explicitly DEFERRED: the spec's "finance PDF" needs a renderer dependency (or a
// headless print pipeline) that isn't in the stack yet — shipping markdown now is honest; a PDF wrapper
// can wrap renderFinanceReport() later without changing any number. (Deferred, not forgotten.)
//
// Pure rendering + injectable delivery (the office) — unit-tested fully offline, keyless-safe.
// ─────────────────────────────────────────────────────────────────────────────

import { postToDept, type OfficeDelivery, type OfficeDeps } from "./office";

export interface FinanceInputs {
  periodLabel: string; // e.g. "2026-07" or "week of 2026-07-13"
  /** Collected/SETTLED revenue (the charter's north star) — from the billing ledger. undefined/null = not connected. */
  settledRevenueUsd?: number | null;
  /** Charged-but-not-yet-settled revenue, when the billing source distinguishes it. */
  pendingRevenueUsd?: number | null;
  /** Attributed cost — from the audit ledger rollup (lib/core/economics.ts). undefined/null = not connected. */
  costUsd?: number | null;
  /** Optional per-category spend breakdown (only REAL recorded categories — the caller's ledger, verbatim). */
  spendByCategoryUsd?: Record<string, number>;
  /** Where each number came from ("polar webhook ledger", "audit ledger rollup", …). Empty = say so. */
  sources?: string[];
  notes?: string[];
}

const known = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);
const usd = (n: number): string => `$${n.toFixed(2)}`;

/** One metric line: the real number, or the honest "not connected" — never a fabricated zero. */
export function metricLine(label: string, value: number | null | undefined, whenAbsent: string): string {
  return known(value) ? `- ${label}: ${usd(value)}` : `- ${label}: not connected (${whenAbsent})`;
}

/** Render the honest markdown finance report from REAL inputs only. Pure — no I/O, no invention. */
export function renderFinanceReport(inputs: FinanceInputs): string {
  const lines: string[] = [
    `# Finance report — ${inputs.periodLabel}`,
    "",
    "## Revenue",
    metricLine("Settled revenue", inputs.settledRevenueUsd, "connect billing — Polar/Stripe webhook ledger"),
    metricLine("Pending (charged, not settled)", inputs.pendingRevenueUsd, "connect billing"),
    "",
    "## Cost",
    metricLine("Attributed cost", inputs.costUsd, "audit-ledger cost rollup"),
  ];

  const cats = Object.entries(inputs.spendByCategoryUsd ?? {});
  if (cats.length) {
    lines.push("", "### Spend by category");
    for (const [cat, amt] of cats) lines.push(`- ${cat}: ${usd(amt)}`);
  }

  lines.push("", "## Margin");
  if (known(inputs.settledRevenueUsd) && known(inputs.costUsd)) {
    const margin = inputs.settledRevenueUsd - inputs.costUsd;
    const pct = inputs.settledRevenueUsd > 0 ? ` (${((margin / inputs.settledRevenueUsd) * 100).toFixed(1)}% of settled)` : "";
    lines.push(`- Margin: ${usd(margin)}${pct}`);
  } else {
    lines.push("- Margin: not computable — needs BOTH settled revenue and attributed cost connected");
  }

  lines.push("", "## Sources");
  if (inputs.sources?.length) {
    for (const s of inputs.sources) lines.push(`- ${s}`);
  } else {
    lines.push("- none recorded — treat every number above as unsourced until its feed is connected");
  }

  if (inputs.notes?.length) {
    lines.push("", "## Notes");
    for (const n of inputs.notes) lines.push(`- ${n}`);
  }

  return lines.join("\n");
}

/** The one-glance #finance summary line. Same honesty rules as the full report. */
export function financeSummary(inputs: FinanceInputs): string {
  const rev = known(inputs.settledRevenueUsd) ? usd(inputs.settledRevenueUsd) : "not connected";
  const cost = known(inputs.costUsd) ? usd(inputs.costUsd) : "not connected";
  const margin =
    known(inputs.settledRevenueUsd) && known(inputs.costUsd)
      ? usd(inputs.settledRevenueUsd - inputs.costUsd)
      : "not computable";
  return `Finance — ${inputs.periodLabel} · settled ${rev} · cost ${cost} · margin ${margin}`;
}

export interface FinanceDelivery {
  report: string; // the full markdown (the feed/Stream artifact)
  summary: string; // what went to #finance
  posted: OfficeDelivery;
}

/** Render + deliver: the summary posts to #finance through the governed office path. Keyless-honest. */
export async function deliverFinanceReport(inputs: FinanceInputs, deps: OfficeDeps = {}): Promise<FinanceDelivery> {
  const report = renderFinanceReport(inputs);
  const summary = financeSummary(inputs);
  const posted = await postToDept("finance", `${summary}\n\n${report}`, deps);
  return { report, summary, posted };
}
