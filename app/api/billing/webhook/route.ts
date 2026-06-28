import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { entitlementFromEvent } from "@/lib/engine/entitlement";

export const runtime = "nodejs";

// LemonSqueezy subscription webhook → entitlements. Verifies the HMAC signature, then records the buyer's
// REAL subscription status via the service role (access is derived from status + period end — see
// lib/engine/entitlement.ts). Handles the full lifecycle uniformly: created, updated (upgrade/downgrade),
// renewed (payment_success), payment_failed (past_due grace), cancelled, paused/unpaused, expired.
// Gated + fail-closed:
//  - No LEMONSQUEEZY_WEBHOOK_SECRET → 503 (fail-closed — never ack an unverified event).
//  - No Supabase → acks.   - Bad signature → 401.   - Non-subscription events → ack, no write.   Never throws.
export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret) return new Response("billing not configured", { status: 503 });

  // Verify X-Signature = hex HMAC-SHA256(rawBody, secret), constant-time.
  const sig = req.headers.get("x-signature") || "";
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(sig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return new Response("invalid signature", { status: 401 });
  }

  let evt: { meta?: { event_name?: string }; data?: { attributes?: Record<string, unknown> } };
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const name = evt?.meta?.event_name || "";
  if (!name.startsWith("subscription")) return Response.json({ ok: true, note: `ignored ${name || "event"}` });

  const rec = entitlementFromEvent(name, evt?.data?.attributes ?? {});
  if (!rec) return Response.json({ ok: true, note: "no email on event" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: true, note: "no db configured" });
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.from("entitlements").upsert(
      { email: rec.email, plan: rec.plan, status: rec.status, current_period_end: rec.periodEnd, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) {
      console.error("[billing] upsert failed:", error.message);
      return Response.json({ ok: false }, { status: 200 });
    }
    return Response.json({ ok: true, status: rec.status });
  } catch (e) {
    console.error("[billing] webhook threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 200 });
  }
}
