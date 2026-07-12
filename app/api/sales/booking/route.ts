import { serviceClient } from "@/lib/engine/service";
import { verifyCalSignature, parseBookingEvent } from "@/lib/sales/calcom";

export const runtime = "nodejs";

// Cal.com / cal.diy booking webhook → the sales pipeline's conversion sensor. A verified BOOKING_CREATED
// records a booked demo in demo_bookings (deduped on external_id). Mirrors the Polar/Stripe posture:
//   - No CAL_WEBHOOK_SECRET → 503 (fail-closed; never trust an unverified booking).
//   - Bad signature → 401.   - No Supabase → ack.   - Non-booking event → ack, no write.   Never throws.
export async function POST(req: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret) return new Response("sales sensor not configured", { status: 503 });

  if (!verifyCalSignature(raw, req.headers.get("x-cal-signature-256"), secret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let evt: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const booking = parseBookingEvent(evt);
  if (!booking) return Response.json({ ok: true, note: `ignored ${evt?.triggerEvent || "event"}` });

  const sb = serviceClient();
  if (!sb) return Response.json({ ok: true, note: "no db configured" });
  try {
    const { error } = await sb.from("demo_bookings").upsert(
      { external_id: booking.externalId, name: booking.name, email: booking.email, start_time: booking.startTime, event_type: booking.eventType },
      { onConflict: "external_id", ignoreDuplicates: true },
    );
    if (error) console.error("[sales/booking] insert failed:", error.message);
    return Response.json({ ok: true, status: "booked" });
  } catch (e) {
    console.error("[sales/booking] webhook threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 200 });
  }
}
