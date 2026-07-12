import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyStripeSignature, revenueFromStripeEvent } from "./stripe-connect";

const secret = "whsec_test_secret";
function sign(raw: string, ts = Math.floor(Date.now() / 1000)): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  const raw = JSON.stringify({ type: "checkout.session.completed" });

  it("accepts a correctly-signed, fresh payload", () => {
    expect(verifyStripeSignature(raw, sign(raw), secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyStripeSignature(raw + "x", sign(raw), secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyStripeSignature(raw, sign(raw), "whsec_other")).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const old = Math.floor(Date.now() / 1000) - 4000;
    expect(verifyStripeSignature(raw, sign(raw, old), secret)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyStripeSignature(raw, null, secret)).toBe(false);
    expect(verifyStripeSignature(raw, "garbage", secret)).toBe(false);
  });
});

describe("revenueFromStripeEvent", () => {
  it("captures a paid checkout session with metadata", () => {
    const rev = revenueFromStripeEvent("checkout.session.completed", {
      object: { id: "cs_1", payment_status: "paid", amount_total: 4900, currency: "usd", customer_details: { email: "a@b.com" }, metadata: { product: "mealory", slug: "mealory" } },
    });
    expect(rev).toEqual({ externalId: "cs_1", email: "a@b.com", amountCents: 4900, currency: "usd", product: "mealory", slug: "mealory" });
  });

  it("ignores an unpaid checkout session (no fake revenue)", () => {
    expect(revenueFromStripeEvent("checkout.session.completed", { object: { id: "cs_2", payment_status: "unpaid", amount_total: 4900 } })).toBeNull();
  });

  it("captures a succeeded payment intent", () => {
    const rev = revenueFromStripeEvent("payment_intent.succeeded", { object: { id: "pi_1", amount_received: 1500, currency: "usd", receipt_email: "c@d.com" } });
    expect(rev?.externalId).toBe("pi_1");
    expect(rev?.amountCents).toBe(1500);
  });

  it("ignores unrelated events and zero amounts", () => {
    expect(revenueFromStripeEvent("account.updated", { object: { id: "acct_1" } })).toBeNull();
    expect(revenueFromStripeEvent("payment_intent.succeeded", { object: { id: "pi_0", amount: 0 } })).toBeNull();
  });
});
