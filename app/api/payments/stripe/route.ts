import { serviceClient } from "@/lib/engine/service";
import { verifyStripeSignature, revenueFromStripeEvent } from "@/lib/payments/stripe-connect";

export const runtime = "nodejs";

// Stripe Connect webhook → verifiable revenue. A payment that settles on a CUSTOMER's connected account
// lands here, is signature-verified, and recorded in revenue_events (the same honest ledger Polar feeds).
// Mirrors the Polar route's posture exactly:
//   - No STRIPE_WEBHOOK_SECRET → 503 (fail-closed; never ack an unverified event).
//   - Bad signature → 401.   - No Supabase → ack.   - Non-payment event → ack, no write.   Never throws.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret) return new Response("payments not configured", { status: 503 });

  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let evt: { type?: string; data?: Record<string, unknown> };
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const rev = revenueFromStripeEvent(evt?.type || "", evt?.data ?? {});
  if (!rev) return Response.json({ ok: true, note: `ignored ${evt?.type || "event"}` });

  const sb = serviceClient();
  if (!sb) return Response.json({ ok: true, note: "no db configured" });
  try {
    // Retry-safe: external_id is unique, so Stripe redeliveries dedup to a no-op.
    const { error } = await sb.from("revenue_events").upsert(
      { external_id: rev.externalId, email: rev.email, amount_cents: rev.amountCents, currency: rev.currency, product: rev.product, slug: rev.slug },
      { onConflict: "external_id", ignoreDuplicates: true },
    );
    if (error) console.error("[payments/stripe] revenue insert failed:", error.message);
    return Response.json({ ok: true, status: "revenue" });
  } catch (e) {
    console.error("[payments/stripe] webhook threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 200 });
  }
}
