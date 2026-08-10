// lib/loop/rituals.ts — THE RUN-THE-COMPANY RITUALS ON THE CLOCK (ADR-0028, wiring slice).
//
// ADR-0028 built ten modules that run a company across TIME (forecast, close, retention, drills,
// evidence, agent review). This is the single seam that fires them on cadence from the nightly tick:
// weekly on Monday, monthly on the 1st, quarterly on the first Monday of Jan/Apr/Jul/Oct.
//
// THREE RULES, inherited from the ADR and enforced here:
//   1. HONEST GAPS, NEVER FABRICATED LEGS. Some inputs are not connected yet (no bank readout, no Polar
//      settlement export, no deals table). Where a leg is missing this reports the gap in words instead
//      of inventing a number or "reconciling" against an empty set and calling it clean.
//   2. FAIL SOFT, ALWAYS. Every ritual is individually try/caught. A ritual failure never breaks the
//      heartbeat — the shift matters more than the report.
//   3. RECOMMENDATIONS ONLY. Retire/retune verdicts and churn saves come back as decision-queue items
//      for the founder. Nothing here applies a personnel action or moves money.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnqueueInput } from "@/lib/org/decision-queue";
import { thirteenWeekCashForecast, pipelineForecast, renderForecastSection, isForecastDay } from "@/lib/org/forecast";
import { reconcile, closeArtifact, signedClose, isCloseDay, type MoneyRow } from "@/lib/org/monthly-close";
import { retentionTick, type RetentionCustomer } from "@/lib/org/retention-desk";
import { dueDrills, drillReport, DRILLS, type DrillResult } from "@/lib/org/drills";
import { collectEvidence, evidenceSnapshot } from "@/lib/org/evidence";
import { reviewAgents, reviewCycleArtifact, escalations, isReviewDay, type ReviewInput } from "@/lib/org/agent-review";
import { successRateByAgent } from "@/lib/engine/agent-performance";
import type { Activity } from "@/lib/engine/types";

export interface RitualResult {
  fired: string[]; // ritual ids that produced a section this tick
  sections: string[]; // founder-facing text blocks, ready for the digest
  escalations: EnqueueInput[]; // decision-queue items (founder decides; nothing auto-applies)
  gaps: string[]; // connections that would make a ritual complete, named plainly
}

// High-stakes roles never get an automatic model downgrade suggestion, however cheap they look.
const HIGH_STAKES = ["chief-of-staff", "auditor", "risk-scoring-officer", "security-engineer", "qa-lead", "incident-commander", "legal-compliance-analyst", "finance-controller"];

const monthKey = (d: Date): string => d.toISOString().slice(0, 7);
const prevMonthKey = (d: Date): string => {
  const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  return monthKey(p);
};
const quarterLabel = (d: Date): string => `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;

/** Envelope caps are the authorized burn. Read-only; a failure yields an empty set, never a guess. */
async function readEnvelopes(sb: SupabaseClient): Promise<{ department: string; monthlyCapUsd: number; spentThisMonthUsd: number; monthKey: string }[]> {
  const { data } = await sb.from("treasury_envelopes").select("department, monthly_cap_usd, spent_this_month_usd, month_key");
  return (data ?? []).map((r) => ({
    department: String(r.department),
    monthlyCapUsd: Number(r.monthly_cap_usd) || 0,
    spentThisMonthUsd: Number(r.spent_this_month_usd) || 0,
    monthKey: String(r.month_key ?? ""),
  }));
}

/** revenue_events → MoneyRow. This is our OWN record of settled money (the webhook wrote it). */
async function readRecordedRevenue(sb: SupabaseClient, month: string): Promise<MoneyRow[]> {
  const { data } = await sb.from("revenue_events").select("external_id, amount_cents, created_at, product");
  return (data ?? [])
    .map((r) => ({
      id: String(r.external_id),
      amountUsd: (Number(r.amount_cents) || 0) / 100,
      occurredAt: String(r.created_at),
      kind: r.product ? String(r.product) : undefined,
    }))
    .filter((r) => r.occurredAt.slice(0, 7) === month);
}

// ── the rituals ──────────────────────────────────────────────────────────────

/**
 * Weekly (Mondays): the forecast. Pipeline and cash are separate legs with separate honesty.
 * Cash-on-hand has no programmatic source (the banking connection is READ-ONLY and not wired), so the
 * runway line is only computed when the founder has published a figure via TREASURY_CASH_ON_HAND_USD.
 * Absent that, the section says so rather than printing a runway from a fictional balance.
 */
async function forecastRitual(sb: SupabaseClient): Promise<{ section: string; gaps: string[] }> {
  const gaps: string[] = [];
  const envelopes = await readEnvelopes(sb);
  const cashRaw = process.env.TREASURY_CASH_ON_HAND_USD;
  const cashKnown = typeof cashRaw === "string" && cashRaw.trim() !== "" && Number.isFinite(Number(cashRaw));
  const burnRaw = Number(process.env.MONTHLY_BURN_USD);
  const monthlyBurnUsd = Number.isFinite(burnRaw) ? burnRaw : 0;

  // No deals table exists yet (the selling pipeline is task #74), so the pipeline leg is genuinely empty.
  // pipelineForecast renders "no open deals" for an empty set, which is the truth today.
  const pipeline = pipelineForecast([]);
  gaps.push("Pipeline stages are not persisted yet, so the pipeline roll-up reads empty. It fills when the selling pipeline lands.");

  if (!cashKnown) {
    gaps.push("Cash on hand is not connected (no bank readout). Set TREASURY_CASH_ON_HAND_USD to compute the runway line.");
    const capsUsd = envelopes.reduce((s, e) => s + e.monthlyCapUsd, 0);
    const section = [
      "FORECAST (weekly)",
      "",
      "Cash forecast: not computed. Cash on hand is not connected, and a runway line drawn from a balance we cannot read would be fiction.",
      `Authorized monthly burn from treasury envelopes: $${capsUsd.toFixed(2)} across ${envelopes.length} envelope${envelopes.length === 1 ? "" : "s"}.`,
      "",
      renderForecastSection(thirteenWeekCashForecast({ cashOnHandUsd: 0, monthlyBurnUsd, envelopes, expectedReceipts: [] }), pipeline)
        .split("\n")
        .filter((l) => !/^Cash on hand/i.test(l))
        .join("\n"),
    ].join("\n");
    return { section, gaps };
  }

  const cash = thirteenWeekCashForecast({
    cashOnHandUsd: Number(cashRaw),
    monthlyBurnUsd,
    envelopes,
    expectedReceipts: [], // committed inflows only; none exist until the checkout is armed
  });
  return { section: `FORECAST (weekly)\n\n${renderForecastSection(cash, pipeline)}`, gaps };
}

/**
 * Monthly (the 1st): the close. Reconciles LAST month. The Polar settlement export is not connected,
 * so the settled leg is absent — and an absent leg is reported as absent. Running reconcile() against an
 * empty settled set would report every recorded row as a discrepancy, which would be noise, not truth.
 */
async function closeRitual(sb: SupabaseClient, now: Date): Promise<{ section: string; gaps: string[] }> {
  const month = prevMonthKey(now);
  const recorded = await readRecordedRevenue(sb, month);
  const recordedTotal = recorded.reduce((s, r) => s + r.amountUsd, 0);

  // Both other legs are unconnected today. Be explicit about which match we can and cannot make.
  const gaps = [
    "Polar settlement export is not connected, so the settled-vs-recorded leg of the close cannot be matched.",
    "Bank readout is not connected, so the treasury leg of the close cannot be matched.",
  ];

  if (recorded.length === 0) {
    return {
      section: [
        `MONTHLY CLOSE for ${month}`,
        "",
        "No settled revenue recorded for this month. Zero is the real number, stated plainly.",
        "The books cannot be closed three ways yet: the payment-processor export and the bank readout are both unconnected. When they are, this section publishes a signed close receipt.",
      ].join("\n"),
      gaps,
    };
  }

  // One leg we CAN state honestly: our own recorded revenue, reconciled against itself for integrity
  // (duplicate ids, bad amounts), which is a real check even without the other two legs.
  const recon = reconcile({ month, polarEvents: recorded, revenueEvents: recorded, treasuryLedger: [] });
  const signed = signedClose(recon, process.env.RECEIPT_SIGNING_SECRET ?? "");
  const section = [
    `MONTHLY CLOSE for ${month}`,
    "",
    `Recorded revenue: $${recordedTotal.toFixed(2)} across ${recorded.length} event${recorded.length === 1 ? "" : "s"}.`,
    "Scope note: this is our own recorded ledger checked for internal integrity. It is NOT a three-way match, because the processor export and the bank readout are not connected.",
    "",
    closeArtifact(recon),
    signed ? `\nSigned close receipt: ${signed.signature.slice(0, 16)}… (verify at /verify)` : "\nClose receipt unsigned: RECEIPT_SIGNING_SECRET is not set, so signing fails closed.",
  ].join("\n");
  return { section, gaps };
}

/**
 * Daily: the retention desk. There are no customers yet, so this reports the armed state rather than
 * inventing a cohort. When customers exist, signals come from their real activity.
 */
function retentionRitual(now: Date): { section: string | null; escalations: EnqueueInput[] } {
  const customers: RetentionCustomer[] = []; // no paying customers yet — never synthesize one
  const tick = retentionTick(customers, { now: now.getTime() });
  if (customers.length === 0) return { section: null, escalations: [] }; // silent until there is someone to retain
  return {
    section: `RETENTION DESK\n\n${tick.note}\n${tick.reviews.map((r) => r.text).join("\n\n")}`,
    escalations: tick.escalations,
  };
}

/** Daily nag + monthly report: the drill program. No drill has ever run, and it says exactly that. */
async function drillRitual(sb: SupabaseClient, now: Date, monthly: boolean): Promise<{ section: string | null; escalations: EnqueueInput[] }> {
  const results: DrillResult[] = []; // no persistence table yet; a never-run drill reports as never-run
  const due = dueDrills(results, { now });
  if (!monthly) {
    if (due.length === 0) return { section: null, escalations: [] };
    // Daily: one line, and one founder task for the most overdue drill. Drills are human-run; the
    // agent's job is to nag, not to claim.
    const top = due[0];
    const def = DRILLS[top.id];
    return {
      section: null,
      escalations: [{
        kind: "other",
        title: `Run the ${def.name} drill`,
        summary: `Operational drill due: ${def.name} (${top.lastRunLabel})`,
        artifact: [
          def.purpose,
          "",
          `Status: ${top.lastRunLabel}. Cadence: every ${def.cadenceDays} days.`,
          "",
          "Steps:",
          ...def.steps.map((s, i) => `${i + 1}. ${s}`),
          "",
          `This is a human-run drill and needs your Supabase or Vercel access. Recording a result turns it into audit evidence for ${def.evidenceOf}. The backup-restore runbook is docs/runbooks/backup-restore-drill.md.`,
        ].join("\n"),
        preparedBy: "sre-monitoring",
      }],
    };
  }
  const report = drillReport(results, { now });
  return { section: `DRILL PROGRAM\n\n${report.headline}\n${report.drills.map((d) => d.statusLine).join("\n")}`, escalations: [] };
}

/** Monthly: the SOC 2 evidence log. Certification-honest by construction (the header says so). */
async function evidenceRitual(sb: SupabaseClient, now: Date): Promise<{ section: string; gaps: string[] }> {
  // Only categories with real artifacts are passed. Missing categories produce NO records, and the
  // snapshot names each uncovered family as a gap.
  const records = collectEvidence({ drillResults: [], ciRuns: [], adrPaths: [], keyRotations: [] }, { now });
  const snap = evidenceSnapshot(records, { monthLabel: monthKey(now) });
  return {
    section: `SOC 2 EVIDENCE LOG\n\n${snap.text}`,
    gaps: ["Evidence collection has no durable audit/CI feed wired yet, so this month's log is empty by design rather than padded."],
  };
}

/** Quarterly (first Monday of Jan/Apr/Jul/Oct): calibrate, retune, retire. Founder decides all three. */
async function agentReviewRitual(sb: SupabaseClient, now: Date): Promise<{ section: string; escalations: EnqueueInput[] }> {
  const { data } = await sb.from("activities").select("action, agent, status, cost").limit(5000);
  const acts = (data ?? []) as unknown as Activity[];
  const rates = successRateByAgent(acts);
  const counts = new Map<string, { n: number; spend: number }>();
  for (const a of acts) {
    const id = String((a as { agent?: string }).agent ?? "");
    if (!id) continue;
    const cur = counts.get(id) ?? { n: 0, spend: 0 };
    cur.n += 1;
    cur.spend += Number((a as { cost?: number }).cost) || 0;
    counts.set(id, cur);
  }
  const inputs: ReviewInput[] = [...counts.entries()].map(([agentId, c]) => ({
    agentId,
    role: agentId,
    successRate: typeof rates[agentId] === "number" ? rates[agentId] : null,
    activityCount: c.n,
    spendUsd: Math.round(c.spend * 100) / 100,
  }));
  const verdicts = reviewAgents(inputs, { highStakesRoles: HIGH_STAKES });
  return {
    section: `AGENT REVIEW CYCLE for ${quarterLabel(now)}\n\n${reviewCycleArtifact(verdicts, quarterLabel(now))}`,
    escalations: escalations(verdicts),
  };
}

// ── the seam the cron calls ──────────────────────────────────────────────────

/**
 * Fire every ritual whose cadence is due. One call, fully fail-soft: a thrown ritual is logged and
 * skipped, never propagated. Returns text blocks for the digest plus decision-queue items for the human.
 */
export async function runRituals(sb: SupabaseClient, opts: { now?: Date } = {}): Promise<RitualResult> {
  const now = opts.now ?? new Date();
  const out: RitualResult = { fired: [], sections: [], escalations: [], gaps: [] };
  const weekly = isForecastDay(now);
  const monthly = isCloseDay(now);
  const quarterly = isReviewDay(now);

  const step = async (id: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
    } catch (e) {
      console.error(`[rituals] ${id} failed:`, e instanceof Error ? e.message : "unknown");
    }
  };

  if (weekly) {
    await step("forecast", async () => {
      const r = await forecastRitual(sb);
      out.sections.push(r.section);
      out.gaps.push(...r.gaps);
      out.fired.push("forecast");
    });
  }
  if (monthly) {
    await step("close", async () => {
      const r = await closeRitual(sb, now);
      out.sections.push(r.section);
      out.gaps.push(...r.gaps);
      out.fired.push("close");
    });
    await step("evidence", async () => {
      const r = await evidenceRitual(sb, now);
      out.sections.push(r.section);
      out.gaps.push(...r.gaps);
      out.fired.push("evidence");
    });
  }
  if (quarterly) {
    await step("agent-review", async () => {
      const r = await agentReviewRitual(sb, now);
      out.sections.push(r.section);
      out.escalations.push(...r.escalations);
      out.fired.push("agent-review");
    });
  }
  await step("drills", async () => {
    const r = await drillRitual(sb, now, monthly);
    if (r.section) {
      out.sections.push(r.section);
      out.fired.push("drills");
    }
    out.escalations.push(...r.escalations);
  });
  await step("retention", () => {
    const r = retentionRitual(now);
    if (r.section) {
      out.sections.push(r.section);
      out.fired.push("retention");
    }
    out.escalations.push(...r.escalations);
  });

  return out;
}
