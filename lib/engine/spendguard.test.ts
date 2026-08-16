import { describe, it, expect } from "vitest";
import { spendWouldExceed, recordSpend } from "./spendguard";
import { POLICY } from "@/lib/core/policy";

describe("spendguard — daily/monthly caps", () => {
  it("allows spend within the caps", () => {
    expect(spendWouldExceed("fresh-co", 10)).toBeNull();
  });

  it("ignores non-positive / missing inputs", () => {
    expect(spendWouldExceed("", 50)).toBeNull();
    expect(spendWouldExceed("co", 0)).toBeNull();
  });

  it("flags a daily-cap breach after accumulation", () => {
    const co = "daily-co";
    recordSpend(co, POLICY.spend.dailyCapUsd - 5);
    expect(spendWouldExceed(co, 4)).toBeNull(); // still fits
    expect(spendWouldExceed(co, 10)).toBe("daily"); // would exceed daily
  });

  it("flags a monthly-cap breach (daily made loose so monthly trips first)", () => {
    const loose = { ...POLICY, spend: { ...POLICY.spend, dailyCapUsd: 999999, monthlyCapUsd: 50 } };
    const co = "monthly-co";
    recordSpend(co, 40);
    expect(spendWouldExceed(co, 20, loose)).toBe("monthly");
  });
});
