"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, FlaskConical, CheckCircle2, XCircle, CircleDashed, Loader2, Radar, TrendingUp } from "lucide-react";
import type { Company } from "@/lib/engine/types";
import { diagnoseFunnel, readMetric, type FunnelSnapshot, type GrowthExperiment, type StageBasis } from "@/lib/engine/growth";
import PixelSnippet from "@/components/PixelSnippet";

// R5 of the Revenue Loop — the transparency surface. Everything the loop knows, does, and learned,
// visible to founder AND customer: the real funnel (with per-stage basis badges), progress toward
// the north star, the experiment ledger (hypothesis → verdict → learning), and exactly which
// signals are missing (with the connect action for each). No number appears without its basis.

const MISSING: FunnelSnapshot = {
  views: null,
  signups: null,
  payingCustomers: null,
  revenueCents: null,
  basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" },
};

function BasisBadge({ b }: { b: StageBasis }) {
  if (b === "real") return <span className="rounded bg-mint/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-mint">real ✓</span>;
  if (b === "estimate") return <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber">estimate</span>;
  return <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-2">not measured</span>;
}

const STATUS_META = {
  running: { icon: Loader2, cls: "text-violet", label: "RUNNING" },
  won: { icon: CheckCircle2, cls: "text-mint", label: "WON" },
  lost: { icon: XCircle, cls: "text-coral", label: "LOST" },
  inconclusive: { icon: CircleDashed, cls: "text-amber", label: "INCONCLUSIVE" },
} as const;

export default function GrowthPanel({ company, experiments }: { company: Company; experiments: GrowthExperiment[] }) {
  const [funnel, setFunnel] = useState<FunnelSnapshot>(MISSING);

  useEffect(() => {
    let on = true;
    fetch(`/api/growth?slug=${encodeURIComponent(company.slug)}`)
      .then((r) => r.json())
      .then((d) => { if (on && d?.funnel) setFunnel(d.funnel as FunnelSnapshot); })
      .catch(() => {});
    return () => { on = false; };
  }, [company.slug, company.night]);

  const diagnosis = useMemo(() => diagnoseFunnel(funnel, company, []), [funnel, company]);
  const goal = company.growthGoal;

  // North-star progress from the funnel, honestly: null when the goal's stage isn't measured.
  const progress = useMemo(() => {
    if (!goal) return null;
    const metric = goal.northStar === "revenue" ? ("revenue_cents" as const) : goal.northStar === "paying_customers" ? ("paying_customers" as const) : ("signups" as const);
    const { value, basis } = readMetric(metric, funnel);
    const target = goal.northStar === "revenue" ? goal.target * 100 : goal.target; // goal.target is dollars
    return { value, basis, target, pct: value != null && target > 0 ? Math.min(100, (value / target) * 100) : 0 };
  }, [goal, funnel]);

  const stages: { label: string; value: number | null; basis: StageBasis }[] = [
    { label: "Views", value: funnel.views, basis: funnel.basis.views },
    { label: "Signups", value: funnel.signups, basis: funnel.basis.signups },
    { label: "Paying", value: funnel.payingCustomers, basis: funnel.basis.paying },
    { label: "Revenue", value: funnel.revenueCents != null ? funnel.revenueCents / 100 : null, basis: funnel.basis.revenue },
  ];
  const maxStage = Math.max(1, ...stages.map((s) => s.value ?? 0));
  const ordered = [...experiments].sort((a, b) => (b.startedNight - a.startedNight) || a.id.localeCompare(b.id));

  return (
    <div className="space-y-6">
      {/* north star */}
      <div className="rounded-2xl glass-panel p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Target size={15} className="text-violet" /> North star
          {goal && progress ? <BasisBadge b={progress.basis} /> : null}
        </div>
        {goal && progress ? (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">
                {progress.value != null ? (goal.northStar === "revenue" ? `$${(progress.value / 100).toFixed(2)}` : progress.value) : "—"}
              </span>
              <span className="text-sm text-muted-2">
                / {goal.northStar === "revenue" ? `$${goal.target}` : goal.target} {goal.northStar.replace("_", " ")}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            {progress.value == null && (
              <p className="mt-2 text-[11px] text-muted-2">This metric isn&apos;t measured yet — connect the signal below and the loop takes it from there.</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No goal set. Pick the ONE number that matters (top of this page) — every nightly shift gets judged against it.</p>
        )}
      </div>

      {/* funnel */}
      <div className="rounded-2xl glass-panel p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp size={15} className="text-mint" /> The funnel — measured, not imagined
        </div>
        <div className="mt-4 space-y-2.5">
          {stages.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-muted">{s.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-border/50">
                <div
                  className={`h-full rounded-md ${s.basis === "real" ? "bg-mint/60" : "bg-surface-2"}`}
                  style={{ width: s.value != null ? `${Math.max(2, (s.value / maxStage) * 100)}%` : "2%" }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs">
                {s.value != null ? (s.label === "Revenue" ? `$${s.value.toFixed(2)}` : s.value) : "—"}
              </span>
              <span className="w-24 shrink-0 text-right"><BasisBadge b={s.basis} /></span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-violet/25 bg-violet/[0.04] p-3 text-xs">
          <span className="font-semibold text-violet">Constraint: {diagnosis.constraint}.</span>{" "}
          <span className="text-muted">{diagnosis.recommendation}</span>
          <div className="mt-1 text-[10px] italic text-muted-2">{diagnosis.principle}</div>
        </div>
      </div>

      {/* experiment ledger */}
      <div className="rounded-2xl glass-panel p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical size={15} className="text-coral" /> Experiment ledger
          <span className="ml-auto text-[11px] text-muted-2">{ordered.length} total</span>
        </div>
        {ordered.length === 0 ? (
          <p className="mt-3 text-sm text-muted-2">
            No experiments yet — run a shift and the loop proposes the first one, aimed at the current constraint.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {ordered.map((x) => {
              const m = STATUS_META[x.status];
              const I = m.icon;
              return (
                <div key={x.id} className="rounded-xl border border-border bg-bg/40 p-3.5">
                  <div className="flex items-center gap-2">
                    <I size={14} className={`shrink-0 ${m.cls} ${x.status === "running" ? "animate-spin" : ""}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${m.cls}`}>{m.label}</span>
                    <span className="ml-auto text-[10px] text-muted-2">
                      night {x.startedNight} · window {x.windowNights}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-text">{x.hypothesis}</p>
                  <div className="mt-1 text-[11px] text-muted-2">
                    metric: {x.metric.replace("_", " ")} · target {x.target}
                    {x.baseline != null ? ` · baseline ${x.baseline}` : ""}
                    {x.resultValue != null ? ` · result ${x.resultValue} (${x.resultBasis})` : ""}
                  </div>
                  {x.learning && <p className="mt-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-muted">{x.learning}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* missing signals */}
      {diagnosis.missingSignals.length > 0 && (
        <div className="rounded-2xl glass-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radar size={15} className="text-amber" /> Missing signals — what the loop can&apos;t see yet
          </div>
          <ul className="mt-3 space-y-2">
            {diagnosis.missingSignals.map((m) => (
              <li key={m.stage} className="rounded-xl border border-amber/25 bg-amber/[0.04] p-3 text-xs">
                <span className="font-semibold capitalize text-amber">{m.stage}:</span>{" "}
                <span className="text-muted">{m.why}</span>
                <div className="mt-0.5 text-[11px] text-muted-2">→ {m.connectCta}</div>
              </li>
            ))}
          </ul>
          {diagnosis.missingSignals.some((m) => m.stage === "views") && (
            <div className="mt-3">
              <PixelSnippet slug={company.slug} />
            </div>
          )}
          <p className="mt-3 text-[10px] text-muted-2">Meta Pixel + ads performance — Phase 2 (needs your connected ad account).</p>
        </div>
      )}
    </div>
  );
}
