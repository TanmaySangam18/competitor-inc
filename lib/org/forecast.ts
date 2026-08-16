// ─────────────────────────────────────────────────────────────────────────────
// lib/org/forecast.ts — THE FORECAST RITUAL (weekly, Mondays). A 13-week cash forecast plus a raw
// pipeline rollup, rendered as a founder-digest section.
//
// RAILS THIS MODULE HONORS:
//   · HONESTY FLOOR (crack-audit standing rule): never a fabricated number. Only COMMITTED inflows
//     count toward the survival line (ending cash / runway). "likely" and "speculative" receipts are
//     shown separately and NEVER summed into ending cash. Pipeline totals are raw sums per stage —
//     no invented probability weighting. Empty inputs render honest empty lines, not zero-padded hope.
//   · Conservative outflow: department envelopes (lib/core/treasury.ts) count at their FULL monthly
//     cap — the spend the human already authorized — so runway never reads longer than the standing
//     authorization allows.
//   · Founder-facing prose contains no em-dashes (style rule): periods, commas, colons only.
//   · Pure functions, no I/O, deterministic — the loop tick reads real sources and hands them in,
//     exactly like lib/loop/finance-report.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Envelope } from "@/lib/core/treasury";

// ── Cash forecast ─────────────────────────────────────────────────────────────

export type ReceiptConfidence = "committed" | "likely" | "speculative";

export interface ExpectedReceipt {
  label: string;
  amountUsd: number;
  /** 0-based week offset from the forecast start (0 = the current week). Receipts outside 0..12 are out of window and excluded. */
  weekIndex: number;
  confidence: ReceiptConfidence;
}

export interface ForecastInputs {
  cashOnHandUsd: number;
  /** Recurring monthly burn (infra, subscriptions) — prorated to weeks at 12/52. */
  monthlyBurnUsd: number;
  /** Department envelopes; each counts at its FULL monthlyCapUsd (the authorized worst case). */
  envelopes: Envelope[];
  expectedReceipts: ExpectedReceipt[];
}

export interface ForecastWeekRow {
  /** 0-based week offset from the forecast start. */
  weekIndex: number;
  inflowCommittedUsd: number;
  /** Context only — never included in endingCashUsd. */
  inflowLikelyUsd: number;
  /** Context only — never included in endingCashUsd. */
  inflowSpeculativeUsd: number;
  outflowUsd: number;
  /** The survival line: cash on hand + committed inflows − outflow, cumulative. */
  endingCashUsd: number;
}

export interface CashForecast {
  rows: ForecastWeekRow[]; // always exactly 13
  /**
   * Index of the first week whose ending cash is negative — i.e. the number of COMPLETE weeks the
   * company survives on committed inflows alone (0 = cash goes negative within the first week).
   * null = cash-positive through all 13 weeks.
   */
  runwayWeeks: number | null;
  weeklyOutflowUsd: number;
  totalCommittedUsd: number;
  totalLikelyUsd: number;
  totalSpeculativeUsd: number;
  // echoed inputs so the renderer can state where the outflow comes from
  cashOnHandUsd: number;
  monthlyBurnUsd: number;
  envelopeCapsUsd: number;
}

const WEEKS = 13;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const pos = (n: number | null | undefined): number => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0);
const usd = (n: number): string => `$${n.toFixed(2)}`;

/**
 * The 13-week cash forecast. Pure and deterministic. Ending cash counts ONLY committed inflows;
 * likely/speculative are carried in their own columns for context and never touch the survival line.
 */
export function thirteenWeekCashForecast(inputs: ForecastInputs): CashForecast {
  const monthlyBurnUsd = pos(inputs.monthlyBurnUsd);
  const envelopeCapsUsd = round2(inputs.envelopes.reduce((sum, e) => sum + pos(e.monthlyCapUsd), 0));
  const weeklyOutflowUsd = round2(((monthlyBurnUsd + envelopeCapsUsd) * 12) / 52);
  const cashOnHandUsd = typeof inputs.cashOnHandUsd === "number" && Number.isFinite(inputs.cashOnHandUsd) ? round2(inputs.cashOnHandUsd) : 0;

  // Bucket receipts per week. Only real positive amounts inside the 13-week window count; anything
  // else is out of scope for this view (a later receipt belongs to next quarter's forecast, not this one).
  const byWeek: Record<ReceiptConfidence, number[]> = {
    committed: new Array<number>(WEEKS).fill(0),
    likely: new Array<number>(WEEKS).fill(0),
    speculative: new Array<number>(WEEKS).fill(0),
  };
  for (const r of inputs.expectedReceipts) {
    if (!Number.isInteger(r.weekIndex) || r.weekIndex < 0 || r.weekIndex >= WEEKS) continue;
    const amt = pos(r.amountUsd);
    if (amt <= 0) continue;
    byWeek[r.confidence][r.weekIndex] += amt;
  }

  const rows: ForecastWeekRow[] = [];
  let running = cashOnHandUsd;
  for (let w = 0; w < WEEKS; w++) {
    const committed = round2(byWeek.committed[w]);
    running = round2(running + committed - weeklyOutflowUsd);
    rows.push({
      weekIndex: w,
      inflowCommittedUsd: committed,
      inflowLikelyUsd: round2(byWeek.likely[w]),
      inflowSpeculativeUsd: round2(byWeek.speculative[w]),
      outflowUsd: weeklyOutflowUsd,
      endingCashUsd: running,
    });
  }

  const firstNegative = rows.findIndex((r) => r.endingCashUsd < 0);
  const sum = (k: ReceiptConfidence): number => round2(byWeek[k].reduce((a, b) => a + b, 0));

  return {
    rows,
    runwayWeeks: firstNegative === -1 ? null : firstNegative,
    weeklyOutflowUsd,
    totalCommittedUsd: sum("committed"),
    totalLikelyUsd: sum("likely"),
    totalSpeculativeUsd: sum("speculative"),
    cashOnHandUsd,
    monthlyBurnUsd: round2(monthlyBurnUsd),
    envelopeCapsUsd,
  };
}

// ── Pipeline rollup ───────────────────────────────────────────────────────────

export type PipelineStage = "lead" | "qualified" | "proposal" | "verbal" | "closed";

const PIPELINE_STAGES: readonly PipelineStage[] = ["lead", "qualified", "proposal", "verbal", "closed"];

export interface PipelineEntry {
  name: string;
  stage: PipelineStage;
  amountUsd: number;
}

export interface StageRollup {
  stage: PipelineStage;
  count: number;
  totalUsd: number;
}

export interface PipelineRollup {
  /** All five stages, canonical order, zero-count stages included. Raw sums only — no weighting. */
  stages: StageRollup[];
  /** Everything not yet closed. */
  openCount: number;
  openTotalUsd: number;
  closedCount: number;
  closedTotalUsd: number;
}

/**
 * Raw per-stage rollup. Deliberately NO probability weighting: a weighted pipeline is an invented
 * number, and the honesty floor forbids invented numbers. Counts and raw dollar sums only.
 * Entries with a non-finite or negative amount count as a deal with $0 known value.
 */
export function pipelineForecast(entries: PipelineEntry[]): PipelineRollup {
  const stages: StageRollup[] = PIPELINE_STAGES.map((stage) => {
    const mine = entries.filter((e) => e.stage === stage);
    return { stage, count: mine.length, totalUsd: round2(mine.reduce((sum, e) => sum + pos(e.amountUsd), 0)) };
  });
  const open = stages.filter((s) => s.stage !== "closed");
  const closed = stages.find((s) => s.stage === "closed")!;
  return {
    stages,
    openCount: open.reduce((n, s) => n + s.count, 0),
    openTotalUsd: round2(open.reduce((n, s) => n + s.totalUsd, 0)),
    closedCount: closed.count,
    closedTotalUsd: closed.totalUsd,
  };
}

// ── Rendering (founder digest section) ────────────────────────────────────────

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

function runwayLine(runwayWeeks: number | null): string {
  if (runwayWeeks === null) return "Runway: cash stays positive through all 13 weeks on committed inflows alone.";
  if (runwayWeeks === 0) return "Runway: cash goes negative within the first week. Outflow exceeds cash on hand plus committed inflows now.";
  return `Runway: ${plural(runwayWeeks, "full week")}. Cash goes negative in week ${runwayWeeks + 1} on committed inflows alone.`;
}

/**
 * The founder-digest forecast section: plain prose plus simple aligned lines. Honest empties, no
 * em-dashes, no invented numbers. Pure string.
 */
export function renderForecastSection(cash: CashForecast, pipeline: PipelineRollup): string {
  const lines: string[] = [
    "## Forecast ritual: 13 week cash view",
    "",
    `Cash on hand: ${usd(cash.cashOnHandUsd)}`,
    `Weekly outflow: ${usd(cash.weeklyOutflowUsd)} (monthly burn ${usd(cash.monthlyBurnUsd)} plus envelope caps ${usd(cash.envelopeCapsUsd)}, prorated to weeks)`,
    runwayLine(cash.runwayWeeks),
    "",
  ];

  if (cash.totalCommittedUsd > 0) {
    lines.push(`Committed inflows: ${usd(cash.totalCommittedUsd)}. Only these count toward the survival line.`);
  } else {
    lines.push("No committed inflows in the next 13 weeks.");
  }
  if (cash.totalLikelyUsd > 0) {
    lines.push(`Likely inflows: ${usd(cash.totalLikelyUsd)}. Shown for context, never counted in ending cash.`);
  }
  if (cash.totalSpeculativeUsd > 0) {
    lines.push(`Speculative inflows: ${usd(cash.totalSpeculativeUsd)}. Shown for context, never counted in ending cash.`);
  }

  // The weekly table: fixed-width columns so it reads aligned in monospace digests.
  const col = (s: string, w: number): string => s.padStart(w);
  lines.push(
    "",
    `  wk${col("committed", 12)}${col("likely", 12)}${col("speculative", 13)}${col("outflow", 12)}${col("ending", 13)}`,
  );
  for (const r of cash.rows) {
    lines.push(
      `  ${String(r.weekIndex + 1).padStart(2, "0")}` +
        `${col(usd(r.inflowCommittedUsd), 12)}` +
        `${col(usd(r.inflowLikelyUsd), 12)}` +
        `${col(usd(r.inflowSpeculativeUsd), 13)}` +
        `${col(usd(r.outflowUsd), 12)}` +
        `${col(usd(r.endingCashUsd), 13)}`,
    );
  }

  lines.push("", "## Pipeline (raw totals per stage, no probability weighting)", "");
  if (pipeline.openCount === 0) {
    lines.push("Pipeline: no open deals.");
  } else {
    for (const s of pipeline.stages) {
      if (s.stage === "closed" || s.count === 0) continue;
      lines.push(`  ${s.stage.padEnd(10)}${col(plural(s.count, "deal"), 9)}${col(usd(s.totalUsd), 13)}`);
    }
    lines.push(`Open pipeline total: ${usd(pipeline.openTotalUsd)} across ${plural(pipeline.openCount, "deal")}. A raw sum, not a prediction.`);
  }
  if (pipeline.closedCount > 0) {
    lines.push(`Closed: ${plural(pipeline.closedCount, "deal")} totaling ${usd(pipeline.closedTotalUsd)}. Already won, excluded from the open total.`);
  }

  return lines.join("\n");
}

// ── Cadence ───────────────────────────────────────────────────────────────────

/** The forecast ritual runs weekly: true on Mondays (UTC — the same clock the month roll uses). */
export function isForecastDay(d: Date): boolean {
  return d.getUTCDay() === 1;
}
