import { describe, it, expect } from "vitest";
import { houseTrialVerdict, houseTrialCap, nextUtcMidnight, trialDayKey } from "./house-trial";

const NOW = Date.UTC(2026, 6, 15, 18, 30); // 2026-07-15 18:30 UTC
const on = { HOUSE_TRIAL_BUILDS_PER_DAY: "3" };

describe("house-keys trial — bounded generosity, honest copy", () => {
  it("OFF by default (no env) — BYOK stays the model until the founder flips it", () => {
    expect(houseTrialCap({})).toBe(0);
    const v = houseTrialVerdict(0, NOW, {});
    expect(v.enabled).toBe(false);
    expect(v.allowed).toBe(false);
    expect(v.reason).toContain("connect your own keys");
  });

  it("under the cap → allowed, says whose keys and what remains", () => {
    const v = houseTrialVerdict(1, NOW, on);
    expect(v).toMatchObject({ enabled: true, allowed: true, remaining: 1, cap: 3 });
    expect(v.reason).toContain("competitor.inc's keys");
    expect(v.reason).toContain("1 of 3");
  });

  it("at the cap → hard stop with the reset + BYOK path (no dark pattern)", () => {
    const v = houseTrialVerdict(3, NOW, on);
    expect(v.allowed).toBe(false);
    expect(v.remaining).toBe(0);
    expect(v.reason).toContain("reset daily");
    expect(v.reason).toContain("connect your own keys");
  });

  it("garbage env values mean OFF, never NaN generosity", () => {
    expect(houseTrialCap({ HOUSE_TRIAL_BUILDS_PER_DAY: "lots" })).toBe(0);
    expect(houseTrialCap({ HOUSE_TRIAL_BUILDS_PER_DAY: "-5" })).toBe(0);
  });

  it("the day bucket + reset are UTC-stable", () => {
    expect(trialDayKey(NOW)).toBe("2026-07-15");
    expect(nextUtcMidnight(NOW)).toBe(Date.UTC(2026, 6, 16));
    expect(houseTrialVerdict(0, NOW, on).resetsAt).toBe(Date.UTC(2026, 6, 16));
  });
});
