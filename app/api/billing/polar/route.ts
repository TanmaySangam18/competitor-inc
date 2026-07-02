import { createClient } from "@supabase/supabase-js";
import { verifyPolarSignature, entitlementFromPolar, revenueFromPolar } from "@/lib/engine/polar";

export const runtime = "nodejs";

// Polar (Merchant of Record) webhook → entitlements. Verifies the Standard Webhooks signature, then
// records the buyer's REAL subscription/purchase status via the service role. Access is derived from
// status + period end (lib/engine/entitlement.ts isEntitled), shared with the Build gate. Mirrors the
// LemonSqueezy route's posture:
//   - No POLAR_WEBHOOK_SECRET → 503 (fail-closed — never ack an unverified event).
//   - Bad signature → 401.   - No Supabase → ack.   - Unhandled event / no email → ack, no write.   Never throws.
export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret) return new Response("billing not configured", { status: 503 });

  const okSig = verifyPolarSignature(raw, {
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signature: req.headers.get("webhook-signature"),
  }, secret);
  if (!okSig) return new Response("invalid signature", { status: 401 });

  let evt: { type?: string; data?: Record<string, unknown> };
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Two INDEPENDENT extractions from the same verified event: entitlement (access) and revenue
  // (amount). A renewal order returns null for entitlement (subscription.* events own access) but
  // MUST still be captured as revenue — MRR is made of renewals.
  const rec = entitlementFromPolar(evt?.type || "", evt?.data ?? {});
  const rev = revenueFromPolar(evt?.type || "", evt?.data ?? {});
  if (!rec && !rev) return Response.json({ ok: true, note: `ignored ${evt?.type || "event"}` });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: true, note: "no db configured" });
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });

    if (rec) {
      const { error } = await sb.from("entitlements").upsert(
        { email: rec.email, plan: rec.plan, status: rec.status, current_period_end: rec.periodEnd, updated_at: new Date().toISOString() },
        { onConflict: "email" },
      );
      if (error) console.error("[billing/polar] entitlement upsert failed:", error.message);
    }

    if (rev) {
      // Fail-soft + retry-safe: external_id is unique, so Polar redeliveries dedup to a no-op.
      const { error } = await sb.from("revenue_events").upsert(
        { external_id: rev.externalId, email: rev.email, amount_cents: rev.amountCents, currency: rev.currency, product: rev.product, slug: rev.slug },
        { onConflict: "external_id", ignoreDuplicates: true },
      );
      if (error) console.error("[billing/polar] revenue insert failed:", error.message);
    }

    return Response.json({ ok: true, status: rec?.status ?? "revenue-only" });
  } catch (e) {
    console.error("[billing/polar] webhook threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 200 });
  }
}
