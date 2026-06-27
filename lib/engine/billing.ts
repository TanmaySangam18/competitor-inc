import { getBrowserSupabase } from "@/lib/supabase/client";

// Pay-to-build billing (client side). Validating is free; Build/run requires an active Operator
// subscription via LemonSqueezy (Merchant-of-Record — handles tax). The paywall is only ENFORCED when
// a checkout URL is configured; until then Build stays open so the demo works (gated, fail-soft).
export const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL || "";

export const billingLive = (): boolean => !!CHECKOUT_URL;

// Reads the signed-in user's OWN entitlement row (RLS restricts to their email). Active subscription → true.
export async function checkEntitled(email: string | undefined): Promise<boolean> {
  const sb = getBrowserSupabase();
  if (!sb || !email) return false;
  try {
    const { data } = await sb.from("entitlements").select("status").eq("email", email).maybeSingle();
    return data?.status === "active";
  } catch {
    return false;
  }
}

// LemonSqueezy checkout, with the buyer's email prefilled so the webhook can match them on return.
export function checkoutUrlFor(email: string): string {
  if (!CHECKOUT_URL) return "";
  const sep = CHECKOUT_URL.includes("?") ? "&" : "?";
  return `${CHECKOUT_URL}${sep}checkout[email]=${encodeURIComponent(email)}`;
}
