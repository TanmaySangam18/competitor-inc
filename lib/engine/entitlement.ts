// Subscription lifecycle — pure, dependency-free, shared by the Polar billing webhook (server, via
// entitlementFromPolar in polar.ts) and the Build gate (client). We store the provider's REAL
// subscription status (not a collapsed active/inactive) so every lifecycle event — created, renewed,
// cancelled, paused, payment-failed, expired — is represented faithfully, and ACCESS is derived from
// status + period end. (The LemonSqueezy normalizer that used to live here was deleted with the
// LS webhook route when billing moved to Polar — one provider, one writer to `entitlements`.)

export type SubStatus =
  | "active"
  | "on_trial"
  | "past_due"
  | "paused"
  | "unpaid"
  | "cancelled"
  | "expired"
  | "none";

export interface EntitlementRecord {
  email: string;
  status: SubStatus;
  plan: string;
  periodEnd: string | null; // ISO; renews_at while active, ends_at once cancelled
}

// The single source of truth for "can this user build?". Entitled while active / on trial, through the
// past_due grace window (don't cut a paying customer off mid-cycle on a failed charge — we nudge instead),
// and through a cancelled-but-not-yet-expired period (LS keeps access until ends_at). paused / unpaid /
// expired / none → no access (unless a paid period is somehow still in the future).
export function isEntitled(status: string | null | undefined, periodEnd: string | null, now: number = Date.now()): boolean {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "on_trial" || s === "past_due") return true;
  if (s === "cancelled" && periodEnd) return new Date(periodEnd).getTime() > now;
  return false;
}

// For the UI: a short, honest hint about a non-clean state (so we can nudge "update payment" etc.).
export function entitlementNotice(status: string | null | undefined, periodEnd: string | null): string | null {
  const s = (status || "").toLowerCase();
  if (s === "past_due") return "Your last payment didn't go through — update your card to keep building.";
  if (s === "cancelled" && periodEnd && new Date(periodEnd).getTime() > Date.now()) {
    return `Subscription cancelled — you keep access until ${new Date(periodEnd).toLocaleDateString()}.`;
  }
  if (s === "paused") return "Your subscription is paused. Resume it to keep building.";
  if (s === "expired" || s === "unpaid") return "Your subscription has ended. Renew to keep building.";
  return null;
}

// ── Tier model (Slice A.2) ─────────────────────────────────────────────────
// The founder ladder (docs/PLAN-10K-60DAY.md): free → builder → operator → founder(Concierge). The stored
// `plan` string comes from Polar (metadata.plan or product name, lowercased — see polar.ts pickPlan), so we
// map by substring. FAIL-OPEN: a paid-but-unrecognized plan resolves to `operator`, never below what a
// paying customer likely bought — the founder sets metadata.plan on each Polar product to be exact.
export type Tier = "free" | "builder" | "operator" | "founder";

const TIER_RANK: Record<Tier, number> = { free: 0, builder: 1, operator: 2, founder: 3 };

export function tierOf(plan: string | null | undefined): Tier {
  const p = (plan || "").toLowerCase();
  if (!p) return "free";
  if (/concierge|founder|done.?with.?you/.test(p)) return "founder";
  if (/operator|operate/.test(p)) return "operator";
  if (/builder/.test(p)) return "builder";
  return "operator"; // recognized as paid but unmatched → fail-open (never downgrade a payer)
}

export function tierAtLeast(tier: Tier, min: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[min];
}

// Operator and up unlock the autonomous operating loop (the crew RUNS the company). Builder is build-only.
export function tierUnlocksOperate(tier: Tier): boolean {
  return tierAtLeast(tier, "operator");
}

// List-price MRR contribution of a tier, in whole USD (matches the /join TIERS). Used to compute MRR on the
// KPI board from active entitlements. Display estimate off list price — real settled revenue lives in
// revenue_events; this never inflates PPU (which needs a verified paid+receipted outcome).
export function tierMonthlyUsd(tier: Tier): number {
  return { free: 0, builder: 49, operator: 199, founder: 499 }[tier];
}
