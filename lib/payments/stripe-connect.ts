import crypto from "node:crypto";

// STRIPE CONNECT (2026-07-12, task #78 — the money-layer moat from the anything.com eval): the rails a
// product our org builds+operates ships WITH, so a customer's app can transact from day one — funds flow
// to the CUSTOMER's connected account, never to us (we orchestrate, we don't hold the money). This is the
// literal version of "verifiable revenue": a real payment → this webhook → revenue_events → the honest
// ledger. Dependency-free on purpose (fetch + crypto), mirroring lib/engine/polar.ts: fail-CLOSED when
// unconfigured, manual signature verification, never throws in the caller. NOTHING here moves our money;
// money-movement (payouts/refunds) stays human-approved per the policy floor.

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Stripe signs webhooks as `Stripe-Signature: t=<ts>,v1=<hex hmac>` where the signed payload is
// `${t}.${rawBody}` HMAC-SHA256'd with the endpoint's whsec_. Constant-time compare; 5-min tolerance.
export function verifyStripeSignature(raw: string, sigHeader: string | null, secret: string, toleranceSec = 300): boolean {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => kv.split("=", 2) as [string, string]),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // Reject stale timestamps (replay protection).
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface StripeRevenue {
  externalId: string;
  email: string | null;
  amountCents: number;
  currency: string;
  product: string | null;
  slug: string | null;
}

// Capture revenue from a verified Connect event. We count money that actually settled on a customer's
// connected account: checkout.session.completed (payment mode) and payment_intent.succeeded. Anything
// else → null (ignored, acked). Honest: only real, settled amounts become revenue.
export function revenueFromStripeEvent(type: string, data: Record<string, unknown>): StripeRevenue | null {
  const obj = (data?.object ?? {}) as Record<string, unknown>;
  const meta = (obj.metadata ?? {}) as Record<string, string>;

  if (type === "checkout.session.completed") {
    if (obj.payment_status !== "paid") return null;
    const amount = Number(obj.amount_total);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const details = (obj.customer_details ?? {}) as Record<string, unknown>;
    return {
      externalId: String(obj.id),
      email: (details.email as string) ?? null,
      amountCents: amount,
      currency: String(obj.currency ?? "usd"),
      product: meta.product ?? null,
      slug: meta.slug ?? null,
    };
  }

  if (type === "payment_intent.succeeded") {
    const amount = Number(obj.amount_received ?? obj.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return {
      externalId: String(obj.id),
      email: (obj.receipt_email as string) ?? null,
      amountCents: amount,
      currency: String(obj.currency ?? "usd"),
      product: meta.product ?? null,
      slug: meta.slug ?? null,
    };
  }

  return null;
}

// ── Provisioning helpers (only invoked when a key is present; callers guard on stripeConfigured) ──────
// These enable a CUSTOMER's product to sell: create their connected account, get them an onboarding link,
// and open Checkout on their account. Funds settle to them; we never take custody. Left thin + typed so
// the governed gate (policy engine) decides WHEN an agent may call them.

async function stripePost(path: string, form: Record<string, string>, connectedAccount?: string): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("stripe not configured");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (connectedAccount) headers["Stripe-Account"] = connectedAccount; // act on the customer's account
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(form).toString(),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`stripe ${path} ${res.status}: ${JSON.stringify(json?.error ?? json)}`);
  return json;
}

// Create a Standard connected account for a customer (they own it; we're the platform).
export async function createConnectedAccount(email: string): Promise<string> {
  const acct = await stripePost("/accounts", { type: "standard", email });
  return String(acct.id);
}

// One-time onboarding link the customer follows to finish Stripe setup on THEIR account.
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
  const link = await stripePost("/account_links", {
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return String(link.url);
}

// Open a Checkout Session ON the customer's connected account (the built product's buyer pays them).
export async function createCheckoutSession(opts: {
  connectedAccount: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: "payment" | "subscription";
  metadata?: Record<string, string>;
}): Promise<string> {
  const form: Record<string, string> = {
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": "1",
    mode: opts.mode ?? "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  };
  for (const [k, v] of Object.entries(opts.metadata ?? {})) form[`metadata[${k}]`] = v;
  const session = await stripePost("/checkout/sessions", form, opts.connectedAccount);
  return String(session.url);
}
