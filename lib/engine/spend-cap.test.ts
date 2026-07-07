import { describe, it, expect, afterEach } from "vitest";
import { hardSpendCapCents, overHardCap } from "./spend-cap";

const orig = process.env.HARD_SPEND_CAP_CENTS;
afterEach(() => { if (orig === undefined) delete process.env.HARD_SPEND_CAP_CENTS; else process.env.HARD_SPEND_CAP_CENTS = orig; });

describe("spend-cap — Gate 2 hard ceiling (below the prompt)", () => {
  it("defaults to 0 → NO real money can move", () => {
    delete process.env.HARD_SPEND_CAP_CENTS;
    expect(hardSpendCapCents()).toBe(0);
    expect(overHardCap(1)).toBe(true);       // even 1 cent is over a $0 cap
    expect(overHardCap(5000)).toBe(true);    // a $50 ad → blocked
    expect(overHardCap(0)).toBe(false);      // $0 is not "over"
  });

  it("honors an explicit ceiling", () => {
    process.env.HARD_SPEND_CAP_CENTS = "10000"; // $100
    expect(hardSpendCapCents()).toBe(10000);
    expect(overHardCap(5000)).toBe(false);   // $50 ≤ $100
    expect(overHardCap(10000)).toBe(false);  // exactly at cap is allowed
    expect(overHardCap(10001)).toBe(true);   // a cent over → blocked
  });

  it("ignores a garbage/negative env value (fails safe to 0)", () => {
    process.env.HARD_SPEND_CAP_CENTS = "not-a-number";
    expect(hardSpendCapCents()).toBe(0);
    process.env.HARD_SPEND_CAP_CENTS = "-500";
    expect(hardSpendCapCents()).toBe(0);
  });
});
