// Subscription lifecycle — pure, dependency-free, shared by the billing webhook (server) and the Build
// gate (client). We store LemonSqueezy's REAL subscription status (not a collapsed active/inactive) so
// every lifecycle event — created, renewed, cancelled, paused, payment-failed, expired — is represented
// faithfully, and ACCESS is derived from status + period end. Swapping placeholder creds for production
// changes nothing here — only env vars.

export type SubStatus =
  | "active"
  | "on_trial"
  | "past_due"
  | "paused"
  | "unpaid"
  | "cancelled"
  | "expired"
  | "none";

const KNOWN: SubStatus[] = ["active", "on_trial", "past_due", "paused", "unpaid", "cancelled", "expired"];

export interface EntitlementRecord {
  email: string;
  status: SubStatus;
  plan: string;
  periodEnd: string | null; // ISO; renews_at while active, ends_at once cancelled
}

// Normalize any LemonSqueezy subscription_* event into our entitlement record. Trusts the subscription's
// own `status` field (LS sends it on every subscription event); falls back to inferring from the event
// name only if status is missing/unknown. Returns null when there's no email (nothing to write).
export function entitlementFromEvent(
  eventName: string,
  attrs: Record<string, unknown>,
): EntitlementRecord | null {
  const email = String(attrs.user_email || (attrs as Record<string, unknown>).email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  let status = String(attrs.status || "").toLowerCase() as SubStatus;
  if (!KNOWN.includes(status)) {
    const e = eventName.toLowerCase();
    status = /expired/.test(e)
      ? "expired"
      : /cancelled/.test(e)
        ? "cancelled"
        : /paused/.test(e)
          ? "paused"
          : /payment_failed/.test(e)
            ? "past_due"
            : /(created|updated|resumed|unpaused|payment_success|payment_recovered)/.test(e)
              ? "active"
              : "none";
  }

  const plan = String((attrs.product_name as string) || (attrs.variant_name as string) || "operator").slice(0, 60);
  const periodEnd = (attrs.ends_at as string) || (attrs.renews_at as string) || null;
  return { email, status, plan, periodEnd };
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
