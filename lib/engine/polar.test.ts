import { describe, it, expect } from "vitest";
import { verifyPolarSignature, entitlementFromPolar } from "./polar";

// The canonical Standard Webhooks test vector (which Polar follows). If our verifier accepts this and
// rejects tampering, the signature scheme is implemented correctly.
const VEC = {
  secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  timestamp: "1614265330",
  payload: '{"test": 2432232314}',
  signature: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};
const AT = Number(VEC.timestamp) * 1000; // pin "now" to the vector so the replay window passes

describe("verifyPolarSignature — Standard Webhooks (matches the official test vector)", () => {
  const h = { id: VEC.id, timestamp: VEC.timestamp, signature: VEC.signature };
  it("accepts a valid signature", () => {
    expect(verifyPolarSignature(VEC.payload, h, VEC.secret, 300, AT)).toBe(true);
  });
  it("accepts when the header carries multiple space-delimited signatures", () => {
    const multi = { ...h, signature: `v1,wrongsig ${VEC.signature}` };
    expect(verifyPolarSignature(VEC.payload, multi, VEC.secret, 300, AT)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyPolarSignature(VEC.payload + " ", h, VEC.secret, 300, AT)).toBe(false);
  });
  it("rejects a wrong secret, missing headers, and missing secret", () => {
    expect(verifyPolarSignature(VEC.payload, h, "whsec_AAAA", 300, AT)).toBe(false);
    expect(verifyPolarSignature(VEC.payload, { ...h, signature: null }, VEC.secret, 300, AT)).toBe(false);
    expect(verifyPolarSignature(VEC.payload, h, undefined, 300, AT)).toBe(false);
  });
  it("rejects a replayed (too-old) timestamp under the tolerance window", () => {
    expect(verifyPolarSignature(VEC.payload, h, VEC.secret, 300, Date.now())).toBe(false); // real now ≫ 2021
  });
});

describe("entitlementFromPolar — maps Polar events to our entitlement record", () => {
  it("maps an active subscription (Operator) with customer email + metadata plan", () => {
    const r = entitlementFromPolar("subscription.created", {
      status: "active",
      current_period_end: "2026-08-01T00:00:00Z",
      customer: { email: "Founder@X.com" },
      metadata: { plan: "operator" },
    });
    expect(r).toEqual({ email: "founder@x.com", status: "active", plan: "operator", periodEnd: "2026-08-01T00:00:00Z" });
  });
  it("maps Polar 'canceled' to our 'cancelled' and keeps the period end", () => {
    const r = entitlementFromPolar("subscription.canceled", { status: "canceled", current_period_end: "2026-09-01T00:00:00Z", customer: { email: "a@b.com" } });
    expect(r?.status).toBe("cancelled");
    expect(r?.periodEnd).toBe("2026-09-01T00:00:00Z");
  });
  it("falls back to the event name when status is absent", () => {
    expect(entitlementFromPolar("subscription.revoked", { customer: { email: "a@b.com" } })?.status).toBe("expired");
  });
  it("grants permanent access for a one-time paid order (Founding)", () => {
    const r = entitlementFromPolar("order.paid", { customer: { email: "a@b.com" }, product: { metadata: { plan: "founding" } } });
    expect(r).toEqual({ email: "a@b.com", status: "active", plan: "founding", periodEnd: null });
  });
  it("ignores a subscription's own order event (handled by subscription.*)", () => {
    expect(entitlementFromPolar("order.paid", { customer: { email: "a@b.com" }, subscription_id: "sub_123" })).toBeNull();
  });
  it("returns null when there's no email", () => {
    expect(entitlementFromPolar("subscription.created", { status: "active" })).toBeNull();
  });
});
