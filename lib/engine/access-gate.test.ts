import { describe, it, expect } from "vitest";
import { continueLocked, previewedCount, waitlistGateOn } from "./access-gate";

const base = { gateOn: true, founder: false, paid: false, previewedCount: 1 };

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
});
