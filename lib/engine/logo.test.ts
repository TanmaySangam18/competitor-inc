import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { initialsOf, monogram } from "./logo";

describe("company logo (monogram)", () => {
  it("derives sensible initials", () => {
    expect(initialsOf("Acme")).toBe("AC");
    expect(initialsOf("Voice Notes")).toBe("VN");
    expect(initialsOf("a b c")).toBe("AC"); // first + last word
    expect(initialsOf("   ")).toBe("?");
  });

  it("is deterministic — same name → same mark", () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const a = monogram(name);
        const b = monogram(name);
        expect(a).toEqual(b);
      }),
    );
  });

  it("always yields in-range hues and non-empty initials", () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const m = monogram(name);
        expect(m.hue).toBeGreaterThanOrEqual(0);
        expect(m.hue).toBeLessThan(360);
        expect(m.hue2).toBeGreaterThanOrEqual(0);
        expect(m.hue2).toBeLessThan(360);
        expect(m.initials.length).toBeGreaterThanOrEqual(1);
      }),
    );
  });
});
