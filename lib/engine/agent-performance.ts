// Per-agent performance signals, computed from the real activity log — the honest input to the
// Office Resource Allocator's reweighting. We weight by what we can actually MEASURE today:
// ship-vs-fail rate and spend. We deliberately do NOT claim revenue-ROI per agent: revenue arrives
// via the Polar webhook attributed to a COMPANY (slug), not an agent, so splitting a company's
// revenue across its agents would be a fabricated number. When per-agent revenue attribution exists
// (tagging revenue_events with the driving agent/experiment), feed it in here — the reweighting hook
// (office-budget.reweightByPerformance) already accepts a 0..1 score.

import type { Activity, AgentRole } from "./types";

export interface AgentPerformance {
  agent: AgentRole;
  done: number;
  failed: number;
  spent: number;
  successRate: number; // done / (done + failed), in [0,1]; 0.5 when there's no signal yet
}

function performanceByAgent(activities: Activity[]): Record<string, AgentPerformance> {
  const acc: Record<string, AgentPerformance> = {};
  for (const a of activities) {
    const p = (acc[a.agent] ??= { agent: a.agent, done: 0, failed: 0, spent: 0, successRate: 0.5 });
    if (a.status === "failed-credited") p.failed += 1;
    else if (a.status === "done") p.done += 1;
    if (typeof a.cost === "number" && a.cost > 0) p.spent = Math.round((p.spent + a.cost) * 100) / 100;
  }
  for (const p of Object.values(acc)) {
    const total = p.done + p.failed;
    // No signal yet → neutral 0.5 (reweight leaves the allocation unchanged).
    p.successRate = total > 0 ? p.done / total : 0.5;
  }
  return acc;
}

/** Just the success-rate map (the shape office-budget.reweightByPerformance expects). */
export function successRateByAgent(activities: Activity[]): Record<string, number> {
  const perf = performanceByAgent(activities);
  const out: Record<string, number> = {};
  for (const [agent, p] of Object.entries(perf)) out[agent] = p.successRate;
  return out;
}
