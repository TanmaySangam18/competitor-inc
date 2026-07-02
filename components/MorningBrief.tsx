"use client";

import { Sunrise, Inbox, Lightbulb, Target, ArrowRight } from "lucide-react";
import type { Activity, ApprovalItem, Company } from "@/lib/engine/types";
import { AGENTS } from "@/lib/engine/types";
import type { GrowthExperiment } from "@/lib/engine/growth";

// The Morning Brief — the first thing a returning founder reads. One glance answers the only three
// morning questions: what happened while I slept, what's waiting on ME, and what did we learn.
// Every number comes straight from the store (real activity/approval/experiment rows) — the brief
// never estimates and never fills silence with invented progress.

export default function MorningBrief({
  company,
  activities,
  pendingApprovals,
  experiments,
  onReviewDecisions,
  onSeeFunnel,
}: {
  company: Company;
  activities: Activity[];
  pendingApprovals: ApprovalItem[];
  experiments: GrowthExperiment[];
  onReviewDecisions: () => void;
  onSeeFunnel: () => void;
}) {
  const night = company.night;
  const lastNight = activities.filter((a) => a.night === night && !a.undone);
  const done = lastNight.filter((a) => a.status === "done");
  const credited = lastNight.filter((a) => a.status === "failed-credited");
  const crew = [...new Set(lastNight.map((a) => AGENTS[a.agent]?.name ?? a.agent))];
  const top = done[0] ?? lastNight[0];
  const learning = [...experiments]
    .filter((x) => x.status !== "running" && x.learning)
    .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))[0];
  const goal = company.growthGoal;

  return (
    <div className="mt-6 rounded-2xl border border-violet/20 bg-violet/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sunrise size={16} className="text-amber" />
        Morning brief
        <span className="text-muted-2">· night {night}</span>
        {goal && (
          <button onClick={onSeeFunnel} className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-violet transition hover:brightness-125">
            <Target size={12} /> Goal: {goal.target} {goal.northStar === "revenue" ? "dollars" : goal.northStar.replace("_", " ")} <ArrowRight size={11} />
          </button>
        )}
      </div>

      {night === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No shifts yet. Run tonight&apos;s shift — tomorrow this brief tells you what your crew did, what&apos;s waiting on you, and what they learned.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {/* what happened */}
          <div className="rounded-xl border border-border bg-bg/40 p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">While you slept</div>
            <p className="mt-1.5 text-sm text-text">
              {lastNight.length === 0 ? (
                "Nothing ran last night."
              ) : (
                <>
                  {done.length} task{done.length === 1 ? "" : "s"} shipped
                  {credited.length > 0 && <> · {credited.length} failed &amp; credited back</>}
                  {crew.length > 0 && <span className="text-muted"> — {crew.join(", ")}</span>}
                </>
              )}
            </p>
            {top && <p className="mt-1.5 truncate text-xs text-muted-2" title={top.action}>Top: {top.action}</p>}
          </div>

          {/* waiting on you */}
          <div className={`rounded-xl border p-3.5 ${pendingApprovals.length > 0 ? "border-coral/30 bg-coral/[0.05]" : "border-border bg-bg/40"}`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">Waiting on you</div>
            {pendingApprovals.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted">Inbox clear — the crew has everything it needs.</p>
            ) : (
              <>
                <p className="mt-1.5 truncate text-sm text-text" title={pendingApprovals[0].title}>
                  {pendingApprovals[0].title}
                </p>
                <button onClick={onReviewDecisions} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-coral transition hover:brightness-110">
                  <Inbox size={13} /> Review {pendingApprovals.length} decision{pendingApprovals.length === 1 ? "" : "s"} <ArrowRight size={11} />
                </button>
              </>
            )}
          </div>

          {/* what we learned */}
          <div className="rounded-xl border border-border bg-bg/40 p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">Latest learning</div>
            {learning ? (
              <p className="mt-1.5 text-xs text-muted" title={learning.hypothesis}>
                <Lightbulb size={12} className="mr-1 inline text-amber" />
                {learning.learning}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-2">No closed experiments yet — the loop records its first learning when one resolves.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
