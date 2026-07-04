// Office · Resource Allocator + Policy Enforcer (the budget half of the two-layer model).
// Pure + deterministic — no I/O — so it's unit-testable and behaves identically in cron and tests.
//
// The Allocator splits the company's real monthly spend cap (lib/engine/policy.ts → monthlyCapUsd)
// across the agents on the floor by role weight, normalized over whoever is actually present (a crew
// without a manufacturing agent doesn't reserve its share). The Enforcer then compares each agent's
// spend to its allocation and flags breaches — the signal the cron turns into an Approval-Inbox note
// (veto recommendation) and a real-time cap_breach alert. This makes "Governed" a runtime fact, not a
// claim: budget is allocated, spend is measured against it, and overspend is surfaced before a human
// approves the next consequential move.
//
// NOTE ON ROI: weights are role-importance today (not measured ROI). True ROI reweighting needs
// per-agent revenue attribution, which we don't have honestly yet — see reweightByPerformance() for
// the deterministic hook that turns success-rate into an adjustment once that data exists. We never
// pretend a number we can't measure.

import type { Activity, AgentRole } from "./types";

// Base role weights (importance of the function to a company's spend). Normalized over present roles.
const ROLE_WEIGHT: Record<AgentRole, number> = {
  engineering: 0.3,
  manufacturing: 0.2,
  ceo: 0.15,
  marketing: 0.15,
  growth: 0.15,
  support: 0.05,
};

export interface AgentBudget {
  agent: AgentRole;
  allocatedUsd: number;
  spentUsd: number;
  remainingUsd: number;
  overUsd: number; // >0 when the agent is over its allocation
}

/** Allocate the monthly cap across the given roles, weights normalized over the roles present. */
export function allocateMonthlyBudget(monthlyCapUsd: number, roles: AgentRole[]): Record<string, number> {
  const present = Array.from(new Set(roles));
  const totalWeight = present.reduce((sum, r) => sum + (ROLE_WEIGHT[r] ?? 0.1), 0) || 1;
  const out: Record<string, number> = {};
  for (const r of present) {
    out[r] = Math.round(((ROLE_WEIGHT[r] ?? 0.1) / totalWeight) * monthlyCapUsd * 100) / 100;
  }
  return out;
}

/** Sum spend by agent across activities (real costs only — nulls/negatives coerced to 0). */
export function spendByAgent(activities: Activity[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of activities) {
    const c = typeof a.cost === "number" && a.cost > 0 ? a.cost : 0;
    out[a.agent] = Math.round(((out[a.agent] ?? 0) + c) * 100) / 100;
  }
  return out;
}

/** The Enforcer's read: allocation vs spend per agent, with any overage made explicit. */
export function budgetStatus(
  monthlyCapUsd: number,
  roles: AgentRole[],
  activities: Activity[]
): AgentBudget[] {
  const alloc = allocateMonthlyBudget(monthlyCapUsd, roles);
  const spent = spendByAgent(activities);
  return Object.keys(alloc).map((agent) => {
    const allocatedUsd = alloc[agent];
    const spentUsd = spent[agent] ?? 0;
    const remainingUsd = Math.round((allocatedUsd - spentUsd) * 100) / 100;
    return {
      agent: agent as AgentRole,
      allocatedUsd,
      spentUsd,
      remainingUsd,
      overUsd: remainingUsd < 0 ? Math.round(-remainingUsd * 100) / 100 : 0,
    };
  });
}

/** Just the breaches — agents over budget — for alerting/annotation. */
export function budgetBreaches(monthlyCapUsd: number, roles: AgentRole[], activities: Activity[]): AgentBudget[] {
  return budgetStatus(monthlyCapUsd, roles, activities).filter((b) => b.overUsd > 0);
}

/**
 * Would this additional spend by `agent` push it over its allocation? (Enforcer veto check for a
 * proposed consequential action, BEFORE it's approved.) Returns the projected overage in USD, or 0.
 */
export function wouldExceedAllocation(
  agent: AgentRole,
  addUsd: number,
  monthlyCapUsd: number,
  roles: AgentRole[],
  priorActivities: Activity[]
): number {
  const alloc = allocateMonthlyBudget(monthlyCapUsd, roles)[agent] ?? 0;
  const already = spendByAgent(priorActivities)[agent] ?? 0;
  const projected = already + Math.max(0, addUsd);
  return projected > alloc ? Math.round((projected - alloc) * 100) / 100 : 0;
}

/**
 * Deterministic ROI hook (kept honest): once per-agent success data exists, nudge weights toward
 * agents that convert spend into shipped/verified work. successRate in [0,1]; adjustment is bounded
 * to ±25% so one good/bad night never starves or floods an agent. Not wired to revenue yet.
 */
export function reweightByPerformance(
  base: Record<string, number>,
  successRateByAgent: Record<string, number>
): Record<string, number> {
  const adjusted: Record<string, number> = {};
  let total = 0;
  for (const [agent, amt] of Object.entries(base)) {
    const sr = successRateByAgent[agent];
    const factor = sr == null ? 1 : 0.75 + 0.5 * Math.max(0, Math.min(1, sr)); // 0.75..1.25
    adjusted[agent] = amt * factor;
    total += adjusted[agent];
  }
  // Renormalize back to the original total so the cap is preserved.
  const baseTotal = Object.values(base).reduce((s, v) => s + v, 0);
  const scale = total > 0 ? baseTotal / total : 1;
  for (const k of Object.keys(adjusted)) adjusted[k] = Math.round(adjusted[k] * scale * 100) / 100;
  return adjusted;
}
