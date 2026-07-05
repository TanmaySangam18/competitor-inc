import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { compressContext, compressToolOutput, packContext } from "./context-compression";

describe("context-compression", () => {
  it("leaves short text essentially intact (ratio 1, no marker)", () => {
    const r = compressContext("hello world\nsecond line");
    expect(r.text).toContain("hello world");
    expect(r.text).not.toContain("compressed");
    expect(r.savedChars).toBe(0);
    expect(r.ratio).toBe(1);
  });

  it("dedupes exact-repeat lines (common in tool output / recall)", () => {
    const r = compressContext("same\nsame\nsame\ndifferent");
    expect(r.text).toBe("same\ndifferent");
    expect(r.savedChars).toBeGreaterThan(0);
  });

  it("collapses runs of blank lines", () => {
    const r = compressContext("a\n\n\n\n\nb");
    expect(r.text).toBe("a\n\nb");
  });

  it("elides the middle with an honest marker when over budget", () => {
    const big = Array.from({ length: 500 }, (_, i) => `line number ${i} with some content`).join("\n");
    const r = compressContext(big, { maxChars: 400 });
    expect(r.compressedChars).toBeLessThanOrEqual(400);
    expect(r.text).toMatch(/compressed \d+ chars/);
    expect(r.text.startsWith("line number 0")).toBe(true); // head preserved
    expect(r.savedChars).toBeGreaterThan(0);
  });

  it("packContext joins, dedupes across fragments, and budgets", () => {
    const r = packContext(["alpha", null, "alpha", "beta", undefined, "gamma"], 1000);
    // "alpha" appears once (cross-fragment dedupe)
    expect(r.text.match(/alpha/g)?.length).toBe(1);
    expect(r.text).toContain("beta");
    expect(r.text).toContain("gamma");
  });

  it("compressToolOutput respects a tight budget", () => {
    const s = "x".repeat(5000);
    expect(compressToolOutput(s, 500).length).toBeLessThanOrEqual(500);
  });

  // ── Property tests: never throws, never exceeds the (floored) budget, savings never negative. ──
  it("property: output never exceeds max(maxChars, 80) and never throws", () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 20000 }), (text, maxChars) => {
        const r = compressContext(text, { maxChars });
        expect(r.text.length).toBeLessThanOrEqual(Math.max(80, Math.floor(maxChars)));
        expect(r.savedChars).toBeGreaterThanOrEqual(0);
        expect(r.ratio).toBeGreaterThanOrEqual(0);
        expect(r.ratio).toBeLessThanOrEqual(1);
      }),
    );
  });

  it("property: compressing an already-compressed blob stays within budget (idempotent-safe)", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 4000 }), fc.integer({ min: 100, max: 3000 }), (text, maxChars) => {
        const once = compressContext(text, { maxChars });
        const twice = compressContext(once.text, { maxChars });
        expect(twice.text.length).toBeLessThanOrEqual(Math.max(80, maxChars));
      }),
    );
  });
});
