import { getBrowserSupabase } from "@/lib/supabase/client";
import { isEntitled, entitlementNotice } from "@/lib/engine/entitlement";

// Pay-to-build billing (client side). Validating is free; Build/run requires an active Operator
// subscription via LemonSqueezy (Merchant-of-Record — handles tax). The paywall is only ENFORCED when
// a checkout URL is configured; until then Build stays open so the demo works (gated, fail-soft).
//
// Multi-tier: each paid offer is its own LemonSqueezy product/variant = its own checkout link.
//   operator → $39/mo self-serve · founder → concierge done-with-you recurring · sprint → one-time.
export const CHECKOUT_URLS: Record<string, string> = {
  operator: process.env.NEXT_PUBLIC_CHECKOUT_URL || "",
  founder: process.env.NEXT_PUBLIC_CHECKOUT_URL_FOUNDER || "",
  sprint: process.env.NEXT_PUBLIC_CHECKOUT_URL_SPRINT || "",
};
// Back-compat: the dashboard Build gate keys off the Operator checkout.
export const CHECKOUT_URL = CHECKOUT_URLS.operator;

export const billingLive = (): boolean => !!CHECKOUT_URLS.operator;
// Is a specific tier's checkout configured yet?
export const checkoutLiveFor = (tier: string): boolean => !!CHECKOUT_URLS[tier];

// Reads the signed-in user's OWN entitlement row (RLS restricts to their email) and derives access from
// the real subscription status + period end (see lib/engine/entitlement.ts) — so a customer keeps Build
// through a renewal hiccup (past_due grace) and through a cancelled-but-not-expired period.
export async function checkEntitled(email: string | undefined): Promise<boolean> {
  const sb = getBrowserSupabase();
  if (!sb || !email) return false;
  try {
    const { data } = await sb.from("entitlements").select("status, current_period_end").eq("email", email).maybeSingle();
    return data ? isEntitled(data.status, data.current_period_end) : false;
  } catch {
    return false;
  }
}

// For the UI: the user's subscription state + a short nudge (e.g. "update your card") when it's not clean.
export async function getEntitlement(
  email: string | undefined,
): Promise<{ entitled: boolean; status: string; notice: string | null }> {
  const sb = getBrowserSupabase();
  if (!sb || !email) return { entitled: false, status: "none", notice: null };
  try {
    const { data } = await sb.from("entitlements").select("status, current_period_end").eq("email", email).maybeSingle();
    if (!data) return { entitled: false, status: "none", notice: null };
    return {
      entitled: isEntitled(data.status, data.current_period_end),
      status: String(data.status || "none"),
      notice: entitlementNotice(data.status, data.current_period_end),
    };
  } catch {
    return { entitled: false, status: "none", notice: null };
  }
}

// LemonSqueezy checkout for a given tier (default operator), with the buyer's email prefilled so the
// webhook can match them on return. Empty string if that tier's link isn't configured.
export function checkoutUrlFor(email: string, tier: string = "operator"): string {
  const base = CHECKOUT_URLS[tier] || "";
  if (!base) return "";
  if (!email) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}checkout[email]=${encodeURIComponent(email)}`;
}
