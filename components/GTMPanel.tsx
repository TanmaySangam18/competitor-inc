"use client";

import { useMemo } from "react";
import { Target, TrendingUp, Users, AlertCircle, ArrowUpRight } from "lucide-react";
import type { Activity, Company } from "@/lib/engine/types";
import { buildGTMPlan } from "@/lib/engine/gtm";

// P1 of the GTM-strategist agent (docs/BLOND-GTM-AGENT.md). Renders the encoded, SOURCED plan for an
// operating company: the demand/conversion bottleneck call, the concentric-circles ICP, and the
// source-quality channel ranking. It proposes — every send/spend still flows through the Approval Inbox.
export default function GTMPanel({ company, activities }: { company: Company; activities: Activity[] }) {
  const plan = useMemo(() => buildGTMPlan(company, activities), [company, activities]);
  const isDemand = plan.bottleneck.bottleneck === "demand";

  return (
    <div className="rounded-2xl border border-violet/25 bg-violet/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Target size={15} className="text-violet" /> GTM plan
        <span className="ml-auto rounded-md bg-violet/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet">
          encoded playbook
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-2">
        North star: <span className="font-medium text-text">{plan.northStar}</span>. The crew proposes — nothing sends without your yes.
      </p>

      {/* Bottleneck diagnosis — the headline call */}
      <div className={`mt-4 rounded-xl border p-3.5 ${isDemand ? "border-coral/30 bg-coral/[0.05]" : "border-mint/30 bg-mint/[0.05]"}`}>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDemand ? "text-coral" : "text-mint"}`}>
          <AlertCircle size={13} /> Bottleneck: {isDemand ? "Demand" : "Conversion"}
        </div>
        <p className="mt-1 text-xs text-muted">{plan.bottleneck.signal}</p>
        <p className="mt-1.5 text-sm text-text">{plan.bottleneck.recommendation}</p>
        <p className="mt-1.5 text-[11px] italic text-muted-2">
          “{plan.bottleneck.principle}” — <span className="not-italic">{plan.bottleneck.source}</span>
        </p>
      </div>

      {/* ICP — concentric circles */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Users size={13} /> Who to target, in order (start inside your trust graph)
        </div>
        <ol className="mt-2 space-y-2">
          {plan.icp.map((t) => (
            <li key={t.tier} className="flex gap-2.5 rounded-lg border border-border bg-bg/40 p-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/15 text-[10px] font-bold text-violet">{t.priority}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-text">{t.tier}</div>
                <div className="text-[11px] text-muted">{t.who}</div>
                <div className="mt-0.5 text-[11px] text-muted-2"><span className="text-muted">Trigger:</span> {t.trigger}</div>
                <div className="text-[11px] italic text-muted-2">{t.why}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Channel ranking — source quality */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <TrendingUp size={13} /> Channels by conversion quality
        </div>
        <ul className="mt-2 space-y-1.5">
          {plan.channels.map((c) => (
            <li key={c.channel} className="flex items-start gap-2 text-[11px]">
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                {c.weight.toFixed(1)}x
              </span>
              <div>
                <span className="font-medium text-text">{c.channel}</span>
                <span className="text-muted-2"> — {c.note}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-2">
          <ArrowUpRight size={11} /> Drafts for the top channels are queued in your Approval Inbox.
        </p>
      </div>
    </div>
  );
}
