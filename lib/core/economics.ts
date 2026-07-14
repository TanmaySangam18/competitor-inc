// lib/core/economics.ts — PER-CUSTOMER UNIT ECONOMICS (REQUIREMENTS §2 + North Star, Tier B1).
//
// "Per-customer unit economics visible BEFORE scale." Cost is already captured per action in the A1 audit
// ledger (costUsd), attributed by customer + agent + action — so unit economics is a rollup over that same
// source of truth, not a second ledger to keep in sync. Margin needs revenue (from the Stripe-Connect
// revenue events / the honest ledger); the alarm fires when a customer is margin-negative or thin.
//
// HONEST scope: the numbers are only as real as what's recorded. With the in-memory sink this is per-process
// (zeros at rest); attribution becomes durable when the audit sink + provider spend feeds wire at connect.
// Caps are enforced at the source by the tier scorer (spend ≥ threshold = T3) — this module MEASURES.

import type { AuditEntry } from "./audit";

export interface CostRollup {
  totalUsd: number;
  perCustomer: Record<string, number>;
  perAgent: Record<string, number>;
  perAction: Record<string, number>;
}

// Roll up every recorded cost by customer, agent, and action.
export function rollupCosts(entries: AuditEntry[]): CostRollup {
  const roll: CostRollup = { totalUsd: 0, perCustomer: {}, perAgent: {}, perAction: {} };
  for (const e of entries) {
    const c = e.costUsd ?? 0;
    if (c <= 0) continue;
    roll.totalUsd += c;
    if (e.customer) roll.perCustomer[e.customer] = (roll.perCustomer[e.customer] ?? 0) + c;
    roll.perAgent[e.actor] = (roll.perAgent[e.actor] ?? 0) + c;
    roll.perAction[e.action] = (roll.perAction[e.action] ?? 0) + c;
  }
  return roll;
}

export interface Margin {
  customer: string;
  costUsd: number;
  revenueUsd: number;
  marginUsd: number;
  marginPct: number; // margin / revenue (0 when no revenue)
  alarm: boolean; // margin-negative, or below the minimum
}

// Margin for one customer: their attributed cost vs their revenue. Alarms when negative or below minMarginPct.
export function marginFor(
  customer: string,
  revenueUsd: number,
  entries: AuditEntry[],
  opts: { minMarginPct?: number } = {},
): Margin {
  const costUsd = rollupCosts(entries).perCustomer[customer] ?? 0;
  const marginUsd = revenueUsd - costUsd;
  const marginPct = revenueUsd > 0 ? marginUsd / revenueUsd : 0;
  const min = opts.minMarginPct ?? 0;
  const alarm = marginUsd < 0 || (revenueUsd > 0 && marginPct < min);
  return { customer, costUsd, revenueUsd, marginUsd, marginPct, alarm };
}

export interface SpendAnomaly {
  detected: boolean;
  recentUsd: number;
  baselineUsd: number; // mean of the preceding periods
  factor: number; // sensitivity threshold used
}

// A simple spike detector over a chronological series of per-period spend totals: the latest period is an
// anomaly if it exceeds `factor` × the mean of the preceding periods (and is non-trivial). Real-time
// provider-fed anomaly detection wires at connect; this is the honest, testable v0 telemetry.
export function spendAnomaly(perPeriodUsd: number[], factor = 3): SpendAnomaly {
  if (perPeriodUsd.length < 2) return { detected: false, recentUsd: perPeriodUsd[0] ?? 0, baselineUsd: 0, factor };
  const recentUsd = perPeriodUsd[perPeriodUsd.length - 1];
  const prior = perPeriodUsd.slice(0, -1);
  const baselineUsd = prior.reduce((s, n) => s + n, 0) / prior.length;
  const detected = recentUsd > 0 && recentUsd > factor * baselineUsd;
  return { detected, recentUsd, baselineUsd, factor };
}
