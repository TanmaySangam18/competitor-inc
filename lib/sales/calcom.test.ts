import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyCalSignature, parseBookingEvent } from "./calcom";

const secret = "cal_test_secret";
const sig = (raw: string) => crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");

describe("verifyCalSignature", () => {
  const raw = JSON.stringify({ triggerEvent: "BOOKING_CREATED" });

  it("accepts a correctly-signed payload", () => {
    expect(verifyCalSignature(raw, sig(raw), secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyCalSignature(raw + "x", sig(raw), secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyCalSignature(raw, sig(raw), "other")).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyCalSignature(raw, null, secret)).toBe(false);
  });
});

describe("parseBookingEvent", () => {
  it("captures a new booking with the first attendee", () => {
    const b = parseBookingEvent({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "bk_1", title: "Demo call", startTime: "2026-07-20T15:00:00Z", attendees: [{ name: "Dana", email: "dana@agency.co", timeZone: "UTC" }] },
    });
    expect(b).toEqual({ externalId: "bk_1", name: "Dana", email: "dana@agency.co", startTime: "2026-07-20T15:00:00Z", eventType: "Demo call" });
  });

  it("ignores non-create events (cancellations, reschedules)", () => {
    expect(parseBookingEvent({ triggerEvent: "BOOKING_CANCELLED", payload: { uid: "bk_2" } })).toBeNull();
    expect(parseBookingEvent({ triggerEvent: "BOOKING_RESCHEDULED", payload: { uid: "bk_3" } })).toBeNull();
  });

  it("ignores a create event with no id", () => {
    expect(parseBookingEvent({ triggerEvent: "BOOKING_CREATED", payload: { attendees: [] } })).toBeNull();
  });
});
