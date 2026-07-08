import { getBrowserSupabase } from "@/lib/supabase/client";
import { isEntitled, entitlementNotice, tierOf, type Tier } from "@/lib/engine/entitlement";

// Pay-to-reveal billing (client side). Validating AND building are free; OPENING the live deployed site
// requires an active Operator subscription via Polar (Merchant-of-Record — handles tax/VAT). The
// paywall is only ENFORCED when a checkout URL is configured; until then everything stays open so the
// pre-launch demo works (gated, fail-soft).
//
// Multi-tier: each paid offer is its own Polar product = its own checkout link.
//   operator → $39/mo self-serve · founder → concierge done-with-you recurring · sprint → one-time.
export const CHECKOUT_URLS: Record<string, string> = {
  builder: process.env.NEXT_PUBLIC_CHECKOUT_URL_BUILDER || "",
  operator: process.env.NEXT_PUBLIC_CHECKOUT_URL || "",
  founder: process.env.NEXT_PUBLIC_CHECKOUT_URL_FOUNDER || "",
  sprint: process.env.NEXT_PUBLIC_CHECKOUT_URL_SPRINT || "",
};

// The founder-tier ladder (decided 2026-07-08, docs/PLAN-10K-60DAY.md). ONE source of truth for the
// /join pricing page. `key` maps to CHECKOUT_URLS (or "free" = no checkout → start the free flow). Prices
// are display-only; the real charge is whatever Polar product the founder wired to each checkout URL.
export interface PricingTier {
  key: string;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  points: string[];
  cta: string;
  recommended?: boolean;
}
export const TIERS: PricingTier[] = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    tagline: "See your crew build it — the aha, no card.",
    points: ["Validate your idea with the crew", "Watch a real build + live preview", "Keep your project — upgrade anytime"],
    cta: "Start free",
  },
  {
    key: "builder",
    name: "Builder",
    price: "$49",
    cadence: "/mo",
    tagline: "Your crew builds; you operate.",
    points: ["Everything in Free", "Real deploys you own", "Bring your own keys (optional)", "Email support"],
    cta: "Start building",
  },
  {
    key: "operator",
    name: "Operator",
    price: "$199",
    cadence: "/mo",
    tagline: "The crew builds AND runs it.",
    points: ["Everything in Builder", "Autonomous operating loop", "GTM drafts → your approval desk", "Weekly founder reports"],
    cta: "Go Operator",
    recommended: true,
  },
  {
    key: "founder",
    name: "Concierge",
    price: "$499",
    cadence: "/mo",
    tagline: "Done-with-you — we run it alongside you.",
    points: ["Everything in Operator", "Weekly working session with the crew", "Direct line + priority", "0% revenue share · own everything"],
    cta: "Apply for a slot",
  },
];
// Back-compat: the dashboard Build gate keys off the Operator checkout.
export const CHECKOUT_URL = CHECKOUT_URLS.operator;

export const billingLive = (): boolean => !!CHECKOUT_URLS.operator;
// Is a specific tier's checkout configured yet?
export const checkoutLiveFor = (tier: string): boolean => !!CHECKOUT_URLS[tier];

// Boolean convenience over getEntitlement — ONE read path for the money gate (these used to be two
// near-identical queries; the richer getEntitlement below is canonical).
export async function checkEntitled(email: string | undefined): Promise<boolean> {
  return (await getEntitlement(email)).entitled;
}

// For the UI: the user's subscription state + a short nudge (e.g. "update your card") when it's not clean.
export async function getEntitlement(
  email: string | undefined,
): Promise<{ entitled: boolean; status: string; notice: string | null; tier: Tier }> {
  const sb = getBrowserSupabase();
  if (!sb || !email) return { entitled: false, status: "none", notice: null, tier: "free" };
  try {
    const { data } = await sb.from("entitlements").select("status, current_period_end, plan").eq("email", email).maybeSingle();
    if (!data) return { entitled: false, status: "none", notice: null, tier: "free" };
    const entitled = isEntitled(data.status, data.current_period_end);
    return {
      entitled,
      status: String(data.status || "none"),
      notice: entitlementNotice(data.status, data.current_period_end),
      // Only credit a tier while the subscription actually grants access; otherwise free.
      tier: entitled ? tierOf(data.plan) : "free",
    };
  } catch {
    return { entitled: false, status: "none", notice: null, tier: "free" };
  }
}

// Polar checkout for a given tier (default operator), with the buyer's email prefilled so the webhook
// can match them on return. Empty string if that tier's link isn't configured. Polar prefills via
// `customer_email` (LemonSqueezy used `checkout[email]` — we migrated to Polar as Merchant-of-Record).
export function checkoutUrlFor(email: string, tier: string = "operator"): string {
  const base = CHECKOUT_URLS[tier] || "";
  if (!base) return "";
  if (!email) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}customer_email=${encodeURIComponent(email)}`;
}
