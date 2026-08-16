// The Revenue Loop core (Block R4) — pure, deterministic, unit-testable. No I/O in this file.
//
// Every shift: close experiments whose window elapsed (measured against the funnel), extract the
// learning, diagnose the funnel's binding constraint, and propose the next experiment(s) aimed at it.
// Success is judged ONLY on outcome metrics (views → signups → paying → revenue) — never tasks done.
//
// THE HONESTY INVARIANT (property-tested): a closed experiment's result_basis is "real" only when the
// funnel stage it measured is backed by real captured data. Estimates close as estimates and say so
// in the learning. Missing data closes as "inconclusive" — we never invent a number.

import type { Activity, Company, GrowthGoal } from "@/lib/core/types";
import { diagnoseBottleneck } from "./gtm";

/* ── types ──────────────────────────────────────────────────── */

export type StageBasis = "real" | "estimate" | "missing";

export type GrowthMetric = "views" | "signups" | "signup_rate" | "paying_customers" | "revenue_cents";

export interface FunnelSnapshot {
  views: number | null;
  signups: number | null;
  payingCustomers: number | null;
  revenueCents: number | null;
  basis: { views: StageBasis; signups: StageBasis; paying: StageBasis; revenue: StageBasis };
}

export interface GrowthExperiment {
  id: string;
  hypothesis: string;
  metric: GrowthMetric;
  baseline: number | null;
  target: number;
  startedNight: number;
  windowNights: number;
  status: "running" | "won" | "lost" | "inconclusive";
  resultValue?: number;
  resultBasis?: "real" | "estimate";
  learning?: string;
  activityIds: string[];
  closedAt?: number;
}

export interface MissingSignal {
  stage: "views" | "paying" | "revenue";
  why: string;
  connectCta: string;
}

export interface FunnelDiagnosis {
  constraint: "traffic" | "conversion" | "monetization" | "unknown";
  signal: string;
  recommendation: string;
  principle: string;
  missingSignals: MissingSignal[];
}

/* ── metric helpers ─────────────────────────────────────────── */

const METRIC_LABEL: Record<GrowthMetric, string> = {
  views: "page views",
  signups: "signups",
  signup_rate: "view→signup rate (%)",
  paying_customers: "paying customers",
  revenue_cents: "revenue (¢)",
};

// Read a metric's value + basis from the funnel. signup_rate derives from two stages, so its basis
// is the WEAKER of the two (real only when both are real).
export function readMetric(metric: GrowthMetric, f: FunnelSnapshot): { value: number | null; basis: StageBasis } {
  switch (metric) {
    case "views":
      return { value: f.views, basis: f.basis.views };
    case "signups":
      return { value: f.signups, basis: f.basis.signups };
    case "signup_rate": {
      if (f.views == null || f.signups == null || f.views === 0) {
        return { value: null, basis: "missing" };
      }
      const weaker = (a: StageBasis, b: StageBasis): StageBasis =>
        a === "missing" || b === "missing" ? "missing" : a === "estimate" || b === "estimate" ? "estimate" : "real";
      return { value: Math.round((f.signups / f.views) * 1000) / 10, basis: weaker(f.basis.views, f.basis.signups) };
    }
    case "paying_customers":
      return { value: f.payingCustomers, basis: f.basis.paying };
    case "revenue_cents":
      return { value: f.revenueCents, basis: f.basis.revenue };
  }
}

/* ── close ──────────────────────────────────────────────────── */

export function closeDueExperiments(
  experiments: GrowthExperiment[],
  funnel: FunnelSnapshot,
  night: number,
  now: number = Date.now()
): { closed: GrowthExperiment[]; stillOpen: GrowthExperiment[] } {
  const closed: GrowthExperiment[] = [];
  const stillOpen: GrowthExperiment[] = [];

  for (const x of experiments) {
    if (x.status !== "running") continue; // already closed — caller keeps history elsewhere
    if (night < x.startedNight + x.windowNights) {
      stillOpen.push(x);
      continue;
    }

    const { value, basis } = readMetric(x.metric, funnel);
    const label = METRIC_LABEL[x.metric];

    if (basis === "missing" || value == null) {
      closed.push({
        ...x,
        status: "inconclusive",
        resultValue: undefined,
        resultBasis: undefined,
        learning: `Window elapsed but ${label} isn't being measured yet — no verdict without data. Connect the signal (see Growth tab) and rerun; we don't invent numbers.`,
        closedAt: now,
      });
      continue;
    }

    // Verdict: won at/above target; lost when clearly no better than baseline (or under half the
    // target when no baseline exists); the honest middle stays inconclusive.
    const beatTarget = value >= x.target;
    const noProgress = x.baseline != null ? value <= x.baseline : value < x.target * 0.5;
    const status: GrowthExperiment["status"] = beatTarget ? "won" : noProgress ? "lost" : "inconclusive";
    const basisNote = basis === "real" ? "measured" : "AI estimate — treat as directional";

    closed.push({
      ...x,
      status,
      resultValue: value,
      resultBasis: basis,
      learning:
        status === "won"
          ? `WON: ${label} hit ${value} vs target ${x.target} (${basisNote}). Keep doing this — double down next shift.`
          : status === "lost"
            ? `LOST: ${label} at ${value}${x.baseline != null ? ` vs baseline ${x.baseline}` : ""} (${basisNote}). The hypothesis didn't hold — stop this line, try a different lever.`
            : `INCONCLUSIVE: ${label} at ${value} — moved but missed target ${x.target} (${basisNote}). Worth one more iteration with a sharper version.`,
      closedAt: now,
    });
  }

  return { closed, stillOpen };
}

/* ── diagnose ───────────────────────────────────────────────── */

export function diagnoseFunnel(funnel: FunnelSnapshot, company: Company, activities: Activity[]): FunnelDiagnosis {
  const missingSignals: MissingSignal[] = [];
  if (funnel.basis.views === "missing") {
    missingSignals.push({
      stage: "views",
      why: "No traffic measurement — the loop can't see how many people reach the page.",
      connectCta: "Install the pixel (one script tag) on the product site.",
    });
  }
  if (funnel.basis.paying === "missing") {
    missingSignals.push({
      stage: "paying",
      why: "No paying-customer signal for this company yet.",
      connectCta: "Route checkout through the connected billing (attribution via checkout metadata).",
    });
  }
  if (funnel.basis.revenue === "missing") {
    missingSignals.push({
      stage: "revenue",
      why: "No revenue amounts attributed to this company.",
      connectCta: "Pass the company slug in checkout metadata so payments attribute here.",
    });
  }

  // No funnel data at all → degrade honestly to the two-stage activity-log diagnosis (Blond).
  if (funnel.views == null && funnel.signups == null) {
    const base = diagnoseBottleneck(company, activities);
    return {
      constraint: base.bottleneck === "demand" ? "traffic" : "conversion",
      signal: `${base.signal} (no funnel instrumentation yet — diagnosis from the activity log.)`,
      recommendation: base.recommendation,
      principle: base.principle,
      missingSignals,
    };
  }

  const views = funnel.views ?? 0;
  const signups = funnel.signups ?? 0;
  const paying = funnel.payingCustomers ?? 0;
  const rate = views > 0 ? (signups / views) * 100 : 0;

  if (views < 30) {
    return {
      constraint: "traffic",
      signal: `Only ${views} measured page views — nothing downstream can be judged on this little traffic.`,
      recommendation: "Create demand before optimizing anything: warm intros first, then one honest community post, then trigger-based outreach.",
      principle: "Demand is the bottleneck, not conversion — focus on demand until you have too much. (Sam Blond)",
      missingSignals,
    };
  }
  if (signups === 0 || rate < 2) {
    return {
      constraint: "conversion",
      signal: `${views} views but a ${rate.toFixed(1)}% signup rate — people arrive and don't act.`,
      recommendation: "Narrow the page to ONE buyer and ONE job; make the call-to-action a specific outcome, not a feature list.",
      principle: "Vague positioning is the #1 reason first sales stall. (April Dunford, Obviously Awesome)",
      missingSignals,
    };
  }
  if (paying === 0) {
    return {
      constraint: "monetization",
      signal: `${signups} signups but zero paying customers — interest isn't converting to commitment.`,
      recommendation: "Add a costly ask: a pre-order, deposit, or founding-member offer. Commitment is the only validation that counts.",
      principle: "Talk is cheap; the commitment ladder ends in money. (The Mom Test, Rob Fitzpatrick)",
      missingSignals,
    };
  }
  return {
    constraint: "monetization",
    signal: `Funnel is flowing (${views} views → ${signups} signups → ${paying} paying). The lever now is revenue per customer and retention.`,
    recommendation: "Obsess over the first 30 days of each paying customer — implementation quality predicts retention and referrals.",
    principle: "Obsess over implementation — the first 30 days determine LTV. (Sam Blond, '9 Easy Sales Concepts')",
    missingSignals,
  };
}

/* ── propose ────────────────────────────────────────────────── */

const MAX_OPEN = 2;

// Deterministic experiment templates keyed off the diagnosed constraint, targets derived from the
// measured baseline (never a fantasy number). ids are caller-supplied-style UUIDs so the client and
// DB agree (same client-authoritative pattern as activities).
export function proposeExperiments(
  company: Company,
  diagnosis: FunnelDiagnosis,
  funnel: FunnelSnapshot,
  openCount: number,
  night: number,
  makeId: () => string = () => crypto.randomUUID()
): GrowthExperiment[] {
  if (openCount >= MAX_OPEN) return [];
  const goal: GrowthGoal | undefined = company.growthGoal;
  const out: GrowthExperiment[] = [];

  const push = (p: Omit<GrowthExperiment, "id" | "startedNight" | "windowNights" | "status" | "activityIds">) => {
    if (out.length + openCount >= MAX_OPEN) return;
    out.push({ ...p, id: makeId(), startedNight: night, windowNights: 3, status: "running", activityIds: [] });
  };

  switch (diagnosis.constraint) {
    case "traffic": {
      const baseViews = funnel.views ?? null;
      push({
        hypothesis: `One honest founder story in a niche community will put ${company.name} in front of real prospects.`,
        metric: "views",
        baseline: baseViews,
        target: Math.max(30, Math.ceil((baseViews ?? 0) * 1.5)),
        learning: undefined,
      });
      break;
    }
    case "conversion": {
      const { value: baseRate } = readMetric("signup_rate", funnel);
      push({
        hypothesis: `Narrowing the headline to ONE buyer and ONE job will lift the signup rate.`,
        metric: "signup_rate",
        baseline: baseRate,
        target: Math.max(3, Math.round(((baseRate ?? 0) * 1.5) * 10) / 10),
        learning: undefined,
      });
      break;
    }
    case "monetization": {
      const basePaying = funnel.payingCustomers ?? 0;
      if (goal?.northStar === "revenue") {
        push({
          hypothesis: `A costly-commitment offer (pre-order / founding tier) will produce the first attributed revenue.`,
          metric: "revenue_cents",
          baseline: funnel.revenueCents ?? null,
          target: Math.max(100, (funnel.revenueCents ?? 0) + 100), // at least one real dollar more
          learning: undefined,
        });
      } else {
        push({
          hypothesis: `A direct, personal ask to the warmest signups will convert the first paying customer${basePaying > 0 ? "s" : ""}.`,
          metric: "paying_customers",
          baseline: basePaying,
          target: basePaying + 1,
          learning: undefined,
        });
      }
      break;
    }
    default:
      break;
  }
  return out;
}

/* ── the whole step (shared by cron + client shift) ─────────── */

export interface GrowthStepResult {
  closed: GrowthExperiment[];
  stillOpen: GrowthExperiment[];
  proposed: GrowthExperiment[];
  diagnosis: FunnelDiagnosis;
  // Glass-Box transparency: one activity per closed verdict + per proposal.
  activities: Activity[];
  // Learnings for agent memory / next-shift context.
  memoryNotes: string[];
}

export function runGrowthStep(
  company: Company,
  experiments: GrowthExperiment[],
  funnel: FunnelSnapshot,
  activities: Activity[],
  night: number,
  makeId: () => string = () => crypto.randomUUID(),
  now: number = Date.now()
): GrowthStepResult {
  const { closed, stillOpen } = closeDueExperiments(experiments, funnel, night, now);
  const diagnosis = diagnoseFunnel(funnel, company, activities);
  const proposed = proposeExperiments(company, diagnosis, funnel, stillOpen.length, night, makeId);

  const log: Activity[] = [];
  for (const x of closed) {
    log.push({
      id: makeId(),
      night,
      agent: "ceo",
      action: `Closed experiment: ${x.hypothesis}`,
      meta: `${x.status.toUpperCase()}${x.resultValue != null ? ` · ${METRIC_LABEL[x.metric]}: ${x.resultValue}` : ""} · ${x.resultBasis === "real" ? "measured ✓" : x.resultBasis === "estimate" ? "estimate" : "no data"}`,
      cost: 0,
      status: "done",
      proof: x.resultValue != null ? { kind: "metric", value: `${METRIC_LABEL[x.metric]} = ${x.resultValue} (${x.resultBasis})` } : undefined,
      rationale: { why: x.learning ?? "window elapsed", principle: "Every experiment closes with a measured verdict and a learning — never silently." },
    });
  }
  for (const x of proposed) {
    log.push({
      id: makeId(),
      night,
      agent: "ceo",
      action: `Proposed experiment: ${x.hypothesis}`,
      meta: `metric: ${METRIC_LABEL[x.metric]} · target ${x.target} · window ${x.windowNights} shifts`,
      cost: 0,
      status: "done",
      rationale: { why: diagnosis.signal, principle: diagnosis.principle },
    });
  }

  const memoryNotes = closed.map((x) => `Experiment ${x.status}: ${x.hypothesis} — ${x.learning ?? ""}`);
  return { closed, stillOpen, proposed, diagnosis, activities: log, memoryNotes };
}
