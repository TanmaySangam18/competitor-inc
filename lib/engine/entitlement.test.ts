import { describe, it, expect } from "vitest";
import { entitlementFromEvent, isEntitled, entitlementNotice } from "./entitlement";

const future = new Date(Date.now() + 30 * 864e5).toISOString();
const past = new Date(Date.now() - 30 * 864e5).toISOString();
const ev = (event: string, attrs: Record<string, unknown>) => entitlementFromEvent(event, { user_email: "Buyer@Example.com", ...attrs });

describe("entitlementFromEvent — full LemonSqueezy lifecycle", () => {
  it("created/renewed → active", () => {
    expect(ev("subscription_created", { status: "active", renews_at: future })).toMatchObject({ email: "buyer@example.com", status: "active", periodEnd: future });
    expect(ev("subscription_payment_success", { status: "active", renews_at: future })?.status).toBe("active");
  });
  it("trial → on_trial", () => {
    expect(ev("subscription_created", { status: "on_trial", renews_at: future })?.status).toBe("on_trial");
  });
  it("payment failed → past_due (grace, not cut off)", () => {
    expect(ev("subscription_payment_failed", { status: "past_due" })?.status).toBe("past_due");
  });
  it("cancelled keeps ends_at as the period end", () => {
    expect(ev("subscription_cancelled", { status: "cancelled", ends_at: future })).toMatchObject({ status: "cancelled", periodEnd: future });
  });
  it("paused / expired map through", () => {
    expect(ev("subscription_paused", { status: "paused" })?.status).toBe("paused");
    expect(ev("subscription_expired", { status: "expired" })?.status).toBe("expired");
  });
  it("trusts the status field over the event name (upgrade/downgrade via subscription_updated)", () => {
    expect(ev("subscription_updated", { status: "active", product_name: "Operator", renews_at: future })).toMatchObject({ status: "active", plan: "Operator" });
  });
  it("falls back to the event name when status is missing/garbage", () => {
    expect(ev("subscription_cancelled", {})?.status).toBe("cancelled");
    expect(ev("subscription_created", { status: "weird" })?.status).toBe("active");
  });
  it("no email → null (nothing to write)", () => {
    expect(entitlementFromEvent("subscription_created", { status: "active" })).toBeNull();
  });
});

describe("isEntitled — access derivation", () => {
  it("active / on_trial / past_due all grant access", () => {
    expect(isEntitled("active", future)).toBe(true);
    expect(isEntitled("on_trial", future)).toBe(true);
    expect(isEntitled("past_due", null)).toBe(true); // grace — don't cut off a paying customer mid-cycle
  });
  it("cancelled grants access only until the period end", () => {
    expect(isEntitled("cancelled", future)).toBe(true);
    expect(isEntitled("cancelled", past)).toBe(false);
    expect(isEntitled("cancelled", null)).toBe(false);
  });
  it("paused / unpaid / expired / none / missing → no access", () => {
    for (const s of ["paused", "unpaid", "expired", "none", "", null, undefined]) {
      expect(isEntitled(s as string, future)).toBe(false);
    }
  });
});

describe("entitlementNotice — honest UI nudge", () => {
  it("nudges on past_due and explains cancelled grace; clean states are silent", () => {
    expect(entitlementNotice("past_due", null)).toMatch(/payment/i);
    expect(entitlementNotice("cancelled", future)).toMatch(/keep access until/i);
    expect(entitlementNotice("active", future)).toBeNull();
  });
});
