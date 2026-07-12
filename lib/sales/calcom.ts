import crypto from "node:crypto";

// CAL.COM BOOKING SENSOR (2026-07-12, task #74 — the sales stack's FIRST brick: the conversion sensor
// must exist before any outreach, so a booked demo is captured the instant it happens). Works with either
// Cal.com's hosted free tier or a self-hosted cal.diy (MIT) — the webhook contract is the same. Dependency-
// free (crypto), mirrors lib/payments/stripe-connect.ts + lib/engine/polar.ts: fail-CLOSED when
// unconfigured, manual HMAC verification, honest parsing (only real BOOKING_CREATED events count).

export function calcomConfigured(): boolean {
  return !!process.env.CAL_WEBHOOK_SECRET;
}

// Cal.com signs webhooks as `X-Cal-Signature-256: <hex>` = HMAC-SHA256(rawBody, secret). Constant-time.
export function verifyCalSignature(raw: string, sigHeader: string | null, secret: string): boolean {
  if (!sigHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sigHeader.trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface DemoBooking {
  externalId: string;
  name: string | null;
  email: string | null;
  startTime: string | null;
  eventType: string | null;
}

// Capture a booked demo from a verified BOOKING_CREATED event. Anything else (cancellations, reschedules,
// pings) → null (ignored, acked). Honest: only a real, newly-created booking becomes a lead.
export function parseBookingEvent(evt: { triggerEvent?: string; payload?: Record<string, unknown> }): DemoBooking | null {
  if (evt?.triggerEvent !== "BOOKING_CREATED") return null;
  const p = (evt.payload ?? {}) as Record<string, unknown>;
  const uid = p.uid ?? p.bookingId ?? p.id;
  if (!uid) return null;
  const attendees = Array.isArray(p.attendees) ? (p.attendees as Record<string, unknown>[]) : [];
  const first = attendees[0] ?? {};
  const eventTypeObj = (p.eventType ?? {}) as Record<string, unknown>;
  return {
    externalId: String(uid),
    name: (first.name as string) ?? null,
    email: (first.email as string) ?? null,
    startTime: (p.startTime as string) ?? null,
    eventType: (p.title as string) ?? (eventTypeObj.title as string) ?? null,
  };
}
