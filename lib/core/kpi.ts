// lib/core/kpi.ts — ANTI-GOODHART LAYER (Tier D · REQUIREMENTS §13).
//
// "KPIs are measurement, not motivation." KPI targets never appear in an agent's prompt (agents are
// prompted on mission; KPIs are computed HERE, externally, for the human + the Auditor). Every KPI is
// paired with a counter-metric and the two are ALWAYS reported together, so you can't game one without the
// pair exposing it. The pairs come straight from ORG_56_ROLES.md's KPI ↔ counter-metric definitions.

// KPI → its paired counter-metric (the thing that goes bad if you game the KPI).
export const COUNTER_METRIC: Record<string, string> = {
  "resolution rate": "reopen rate",
  "defects found": "escaped defects",
  "velocity": "rework rate",
  "pipeline generated": "pipeline converted",
  "on-time milestone rate": "schedule padding",
  "close rate": "post-sale expectation mismatch",
  "shipped-feature adoption": "roadmap churn",
  "escalations answered by precedent": "misapplied-precedent incidents",
  "qualified opportunities": "unsubscribe/complaint rate",
  "engagement quality": "incident-adjacent posting errors",
};

export function pairedMetric(kpi: string): string | null {
  return COUNTER_METRIC[kpi.toLowerCase().trim()] ?? null;
}

export interface KpiReport {
  kpi: string;
  value: number;
  counter: string | null; // the paired counter-metric name
  counterValue: number | null;
  bothReported: boolean; // §13: a KPI reported without its counter is incomplete
}

// Report a KPI — ALWAYS with its counter-metric. A KPI with a known pair but no counterValue is flagged
// incomplete (bothReported=false) rather than shown alone.
export function reportKpi(kpi: string, value: number, counterValue?: number): KpiReport {
  const counter = pairedMetric(kpi);
  const hasCounter = counter !== null && counterValue !== undefined;
  return { kpi, value, counter, counterValue: counterValue ?? null, bothReported: hasCounter || counter === null };
}

// The Auditor's gaming hunt: a KPI that improved while its counter-metric worsened is a red flag (the number
// looks good but the real outcome behind it got worse). Deltas are period-over-period.
export function suspectGaming(kpiDelta: number, counterDelta: number): boolean {
  return kpiDelta > 0 && counterDelta > 0; // counter-metrics are "bad when up" (reopen, escaped, rework, ...)
}
