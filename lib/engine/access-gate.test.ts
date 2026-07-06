import { describe, it, expect } from "vitest";
import { continueLocked, previewedCount, waitlistGateOn, trialActive, trialDaysLeft, premiumUnlocked, companyCreateLocked, TRIAL_DAYS } from "./access-gate";

const base = { gateOn: true, founder: false, paid: false, previewedCount: 1 };
const NOW = 1_000_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe("access-gate — post-preview continue lock", () => {
  it("never locks when the gate is off (current pre-launch behavior)", () => {
    expect(continueLocked({ ...base, gateOn: false })).toBe(false);
  });

  it("never locks a founder or a paying user", () => {
    expect(continueLocked({ ...base, founder: true })).toBe(false);
    expect(continueLocked({ ...base, paid: true })).toBe(false);
  });

  it("does NOT lock before the free preview is consumed", () => {
    expect(continueLocked({ ...base, previewedCount: 0 })).toBe(false);
  });

  it("locks a non-founder, non-paid user who has used their free preview", () => {
    expect(continueLocked({ ...base, previewedCount: 1 })).toBe(true);
  });

  it("respects a custom free-preview allowance", () => {
    expect(continueLocked({ ...base, previewedCount: 1, freePreviews: 2 })).toBe(false);
    expect(continueLocked({ ...base, previewedCount: 2, freePreviews: 2 })).toBe(true);
  });

  it("counts a product as previewed only after the aha (live URL / a night run / operating)", () => {
    const cos = [
      { status: "validating" }, // not yet
      { product: { url: "https://x.github.io/a/" } }, // built + live
      { night: 3, status: "operating" }, // has run
      { status: "validated", night: 0 }, // validated only — not yet
    ];
    expect(previewedCount(cos)).toBe(2);
  });

  it("reads the flag", () => {
    expect(waitlistGateOn("1")).toBe(true);
    expect(waitlistGateOn("true")).toBe(true);
    expect(waitlistGateOn(undefined)).toBe(false);
    expect(waitlistGateOn("0")).toBe(false);
  });

  it("does NOT lock during an active reverse trial", () => {
    const started = NOW - 3 * DAY; // 3 days into a 14-day trial
    expect(continueLocked({ ...base, previewedCount: 1, trialStartedAt: started, now: NOW })).toBe(false);
  });

  it("locks again once the trial has expired", () => {
    const started = NOW - (TRIAL_DAYS + 1) * DAY;
    expect(continueLocked({ ...base, previewedCount: 1, trialStartedAt: started, now: NOW })).toBe(true);
  });
});

describe("reverse trial", () => {
  it("trialActive true within the window, false after / when unset", () => {
    expect(trialActive(NOW - 5 * DAY, NOW)).toBe(true);
    expect(trialActive(NOW - (TRIAL_DAYS + 1) * DAY, NOW)).toBe(false);
    expect(trialActive(null, NOW)).toBe(false);
  });

  it("trialDaysLeft counts down and floors at 0", () => {
    expect(trialDaysLeft(NOW - 4 * DAY, NOW)).toBe(TRIAL_DAYS - 4);
    expect(trialDaysLeft(NOW - 100 * DAY, NOW)).toBe(0);
    expect(trialDaysLeft(null, NOW)).toBe(TRIAL_DAYS);
  });

  it("premiumUnlocked: founder / paid / active-trial each unlock; nothing = locked", () => {
    expect(premiumUnlocked({ founder: true, paid: false, trialStartedAt: null, now: NOW })).toBe(true);
    expect(premiumUnlocked({ founder: false, paid: true, trialStartedAt: null, now: NOW })).toBe(true);
    expect(premiumUnlocked({ founder: false, paid: false, trialStartedAt: NOW - DAY, now: NOW })).toBe(true);
    expect(premiumUnlocked({ founder: false, paid: false, trialStartedAt: NOW - 99 * DAY, now: NOW })).toBe(false);
    expect(premiumUnlocked({ founder: false, paid: false, trialStartedAt: null, now: NOW })).toBe(false);
  });
});

describe("company-create cap (1 free company)", () => {
  const c = { gateOn: true, founder: false, paid: false };
  it("allows the first company, locks the second", () => {
    expect(companyCreateLocked({ ...c, currentCount: 0 })).toBe(false);
    expect(companyCreateLocked({ ...c, currentCount: 1 })).toBe(true);
  });
  it("never locks a founder or paid user, or when the gate is off", () => {
    expect(companyCreateLocked({ ...c, currentCount: 5, founder: true })).toBe(false);
    expect(companyCreateLocked({ ...c, currentCount: 5, paid: true })).toBe(false);
    expect(companyCreateLocked({ ...c, currentCount: 5, gateOn: false })).toBe(false);
  });
});
