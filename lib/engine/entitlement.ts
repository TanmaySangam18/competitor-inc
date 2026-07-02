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
