// lib/core/payments.ts — the money flow, as a governed core capability.
//
// Two moves on top of the Stripe Connect primitives (lib/payments/stripe-connect): (1) onboard a product's
// OWN Stripe account so it can charge, and (2) open a checkout on that account. Funds settle to the
// CUSTOMER's account — we orchestrate, never hold the money; payouts/refunds stay human-approved (the
// floor). Kept a core service (driven by the governed engine / CLI / an authenticated dashboard action),
// NOT an open public route — creating Stripe accounts must never be anonymous. Fail-soft: with no key it
// reports `configured: false` and touches Stripe not at all.

import {
  stripeConfigured,
  createConnectedAccount,
  createAccountLink,
  createCheckoutSession,
} from "@/lib/payments/stripe-connect";

export function paymentsConfigured(): boolean {
  return stripeConfigured();
}

export interface Onboarding {
  configured: boolean;
  accountId?: string;
  url?: string; // the link the customer follows to finish Stripe setup on THEIR account
}

// Provision a customer's connected account + a one-time onboarding link. No key → { configured: false }.
export async function connectProduct(input: {
  email: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<Onboarding> {
  if (!stripeConfigured() || !input.email) return { configured: false };
  const accountId = await createConnectedAccount(input.email);
  const url = await createAccountLink(accountId, input.refreshUrl, input.returnUrl);
  return { configured: true, accountId, url };
}

// Open a checkout session ON the customer's connected account (their buyer pays them). No key → null.
export async function checkoutUrl(opts: {
  connectedAccount: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: "payment" | "subscription";
  metadata?: Record<string, string>;
}): Promise<string | null> {
  if (!stripeConfigured()) return null;
  return createCheckoutSession(opts);
}
