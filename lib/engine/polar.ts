import crypto from "node:crypto";
import type { EntitlementRecord, SubStatus } from "./entitlement";

// Polar (polar.sh) billing — Merchant of Record. Polar signs webhooks with the **Standard Webhooks**
// spec, so we verify it ourselves (no SDK dependency): headers webhook-id / webhook-timestamp /
// webhook-signature, where the signature is base64( HMAC-SHA256( `${id}.${ts}.${body}`, key ) ) and the
// key is the base64-decoded secret (Polar shows it `whsec_`-prefixed). Shares the entitlements table +
// isEntitled logic with the LemonSqueezy path — only the parsing differs.

export interface PolarSigHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null; // space-delimited "v1,<base64sig>" tokens (Standard Webhooks)
}

// Constant-time verify of a Standard Webhooks signature. Returns false on anything missing/mismatched —
// never throws. Optional timestamp tolerance (default 5 min) guards against replay.
export function verifyPolarSignature(
  rawBody: string,
  h: PolarSigHeaders,
  secret: string | undefined,
  toleranceSec = 300,
  now: number = Date.now(),
): boolean {
  if (!secret || !h.id || !h.timestamp || !h.signature) return false;
  // Replay guard: reject a timestamp too far from now (skip if unparseable).
  const ts = Number(h.timestamp);
  if (Number.isFinite(ts) && Math.abs(now / 1000 - ts) > toleranceSec) return false;

  // Standard Webhooks: strip an optional `whsec_` prefix, then base64-decode to the raw key bytes.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${rawBody}`).digest("base64");
  const exp = Buffer.from(expected);

  // The header is a space-delimited list of "version,signature" tokens — pass if ANY matches.
  return h.signature.split(" ").some((tok) => {
    const sig = tok.includes(",") ? tok.slice(tok.indexOf(",") + 1) : tok;
    const got = Buffer.from(sig);
    return got.length === exp.length && crypto.timingSafeEqual(got, exp);
  });
}

// Map Polar's subscription status vocabulary onto ours. Polar spells it "canceled" (one L); we store
// "cancelled" and keep access until the period end (handled by isEntitled).
function mapStatus(polar: string): SubStatus {
  switch ((polar || "").toLowerCase()) {
    case "active": return "active";
    case "trialing": return "on_trial";
    case "past_due": return "past_due";
    case "unpaid": return "unpaid";
    case "canceled": case "cancelled": return "cancelled";
    case "incomplete_expired": return "expired";
    default: return "none";
  }
}

function pickEmail(d: Record<string, unknown>): string {
  const customer = (d.customer as Record<string, unknown> | undefined) ?? undefined;
  const user = (d.user as Record<string, unknown> | undefined) ?? undefined;
  return String(
    customer?.email || d.customer_email || user?.email || d.user_email || d.email || "",
  ).trim().toLowerCase();
}

function pickPlan(d: Record<string, unknown>): string {
  const meta = (d.metadata as Record<string, unknown> | undefined) ?? undefined;
  const product = (d.product as Record<string, unknown> | undefined) ?? undefined;
  const productMeta = (product?.metadata as Record<string, unknown> | undefined) ?? undefined;
  return String(meta?.plan || productMeta?.plan || product?.name || "operator").slice(0, 60).toLowerCase();
}

// Normalize a Polar webhook event into our entitlement record. Subscription events (Operator) carry a
// status; a one-time order (Founding) grants permanent access. Returns null when there's nothing to write
// (no email, or a subscription's own order event we let the subscription.* event handle instead).
export function entitlementFromPolar(
  eventName: string,
  data: Record<string, unknown>,
): EntitlementRecord | null {
  const email = pickEmail(data);
  if (!email) return null;
  const e = (eventName || "").toLowerCase();

  if (e.startsWith("subscription.")) {
    let status = mapStatus(String(data.status || ""));
    if (status === "none") {
      // Fall back to the event name when status is absent/unrecognized.
      status = /revoked/.test(e) ? "expired"
        : /canceled|cancelled/.test(e) ? "cancelled"
        : /past_due/.test(e) ? "past_due"
        : /(created|active|updated|uncanceled)/.test(e) ? "active"
        : "none";
    }
    const periodEnd = (data.current_period_end as string) || (data.currentPeriodEnd as string) || (data.ends_at as string) || null;
    return { email, status, plan: pickPlan(data), periodEnd };
  }

  if (e.startsWith("order.")) {
    // Only act on a paid, ONE-TIME order. A subscription's own orders carry a subscription id — those
    // are handled by the subscription.* events, so we skip them here to avoid double-writes.
    const isPaid = e === "order.paid" || String(data.status || "").toLowerCase() === "paid" || data.paid === true;
    const subId = data.subscription_id ?? (data.subscription as Record<string, unknown> | undefined)?.id;
    if (!isPaid || subId) return null;
    // One-time purchase (Founding) → permanent access: active, no expiry.
    return { email, status: "active", plan: pickPlan(data), periodEnd: null };
  }

  return null;
}

// ── Revenue Loop (R3): real revenue amounts ────────────────────────────────
// Unlike entitlementFromPolar (which skips subscription orders to avoid double entitlement writes),
// revenue wants EVERY paid order — first purchases AND renewals — because MRR is made of renewals.
// This is the ONLY source of `purchase`/revenue data in the system: the public pixel can't write
// money, so a revenue row always traces back to a signature-verified Polar webhook.
export interface RevenueEvent {
  externalId: string; // Polar order id — webhook retries dedup on this
  email: string;
  amountCents: number;
  currency: string;
  product: string;
  slug: string | null; // company attribution via checkout metadata.slug, when present
}

export function revenueFromPolar(eventName: string, data: Record<string, unknown>): RevenueEvent | null {
  const e = (eventName || "").toLowerCase();
  if (!e.startsWith("order.")) return null;
  const isPaid = e === "order.paid" || String(data.status || "").toLowerCase() === "paid" || data.paid === true;
  if (!isPaid) return null;

  const externalId = String(data.id || "").trim();
  const email = pickEmail(data);
  // Polar amounts are integer cents; prefer the buyer-facing total, fall back defensively.
  const rawAmount = data.total_amount ?? data.amount ?? data.net_amount;
  const amountCents = typeof rawAmount === "number" && Number.isFinite(rawAmount) ? Math.round(rawAmount) : NaN;
  if (!externalId || !email || !Number.isFinite(amountCents) || amountCents <= 0) return null;

  const meta = (data.metadata as Record<string, unknown> | undefined) ?? undefined;
  const slug = typeof meta?.slug === "string" && meta.slug.trim() ? meta.slug.trim().toLowerCase().slice(0, 80) : null;

  return {
    externalId,
    email,
    amountCents,
    currency: String(data.currency || "usd").toLowerCase().slice(0, 8),
    product: pickPlan(data),
    slug,
  };
}
