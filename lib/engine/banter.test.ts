import { describe, it, expect } from "vitest";
import { pickExchange } from "./banter";

const LONG_IDEA =
  'Tattva — an AI agent runs on a spare Android phone, watches your Instagram feed for you, and removes explicit, scam, and exploitative content before you ever see it. It delivers a clean, finite daily "Edition" to a sandbox-legal iOS reader app. Judged on-device, fail-closed, no browser extensions.';

describe("banter — short label (never dumps a long idea paragraph)", () => {
  it("uses the company NAME in lines, not the full idea paragraph", () => {
    for (let i = 0; i < 40; i++) {
      const ex = pickExchange({ company: "Tattva", idea: LONG_IDEA, working: true });
      for (const t of ex.turns) {
        expect(t.text).not.toContain("spare Android phone"); // no paragraph leakage
        expect(t.text.length).toBeLessThan(160); // banter lines stay short/readable
      }
    }
  });

  it("falls back to a short clause when there is no usable name", () => {
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const ex = pickExchange({ company: "", idea: LONG_IDEA, working: false });
      for (const t of ex.turns) {
        expect(t.text).not.toContain("fail-closed"); // still no wall of text
        seen.push(t.text);
      }
    }
    // at least some lines interpolate the short label derived from the idea's first clause
    expect(seen.some((s) => /AI agent/i.test(s))).toBe(true);
  });

  it("still works with a normal short idea (unchanged behavior)", () => {
    const ex = pickExchange({ company: "MealPrep", idea: "campus meal-prep service", working: true }, undefined);
    expect(ex.turns.length).toBeGreaterThan(0);
    expect(ex.turns.every((t) => typeof t.text === "string" && t.text.length > 0)).toBe(true);
  });
});
