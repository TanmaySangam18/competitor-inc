import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// LemonSqueezy subscription webhook → entitlements. Verifies the HMAC signature, then upserts the
// buyer's entitlement (active/inactive) via the service role. Gated + fail-soft:
//  - No LEMONSQUEEZY_WEBHOOK_SECRET → acks without doing anything (billing not configured).
//  - No Supabase service role → acks (nothing to write).
//  - Bad signature → 401. Never throws.
const ACTIVE_EVENTS = ["subscription_created", "subscription_updated", "subscription_resumed", "subscription_unpaused", "subscription_payment_success"];
const ACTIVE_STATUSES = ["active", "on_trial", "past_due"];

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret) return Response.json({ ok: true, note: "billing not configured" });

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
  const name = evt?.meta?.event_name;
  const attrs = evt?.data?.attributes ?? {};
  const email = String(attrs.user_email || (attrs as Record<string, string>).email || "").toLowerCase();
  if (!email) return Response.json({ ok: true, note: "no email on event" });

  const active = ACTIVE_EVENTS.includes(name || "") && ACTIVE_STATUSES.includes(String(attrs.status));
  const status = active ? "active" : "inactive";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: true, note: "no db configured" });
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.from("entitlements").upsert(
      { email, plan: "operator", status, current_period_end: (attrs.renews_at as string) ?? null, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) {
      console.error("[billing] upsert failed:", error.message);
      return Response.json({ ok: false }, { status: 200 });
    }
    return Response.json({ ok: true, status });
  } catch (e) {
    console.error("[billing] webhook threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 200 });
  }
}
