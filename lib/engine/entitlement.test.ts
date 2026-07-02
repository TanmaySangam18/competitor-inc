import { describe, it, expect } from "vitest";
import { isEntitled, entitlementNotice } from "./entitlement";

const future = new Date(Date.now() + 30 * 864e5).toISOString();
const past = new Date(Date.now() - 30 * 864e5).toISOString();

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
