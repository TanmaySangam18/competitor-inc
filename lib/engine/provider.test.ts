import { describe, it, expect } from "vitest";
import { getProvider, slugify, companyNameFrom, scoreIdea } from "./provider";
import type { Company } from "./types";

const provider = getProvider();

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "test-co",
    name: "Testly",
    slug: "testly",
    idea: "an app for testing",
    createdAt: 0,
    status: "operating",
    night: 0,
    ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
    ...overrides,
  };
}

describe("slugify", () => {
  it("lowercases and dashes the first words", () => {
    expect(slugify("My Cool App")).toBe("my-cool-app");
  });
  it("strips punctuation and falls back when empty", () => {
    expect(slugify("!!!")).toBe("venture");
  });
});

describe("companyNameFrom", () => {
  it("is deterministic for the same idea", () => {
    expect(companyNameFrom("a meal planning app")).toBe(companyNameFrom("a meal planning app"));
  });
  it("never returns an empty string", () => {
    expect(companyNameFrom("the a an").length).toBeGreaterThan(0);
  });
});

describe("validate", () => {
  it("is deterministic for the same idea", () => {
    const a = provider.validate("bedtime stories app");
    const b = provider.validate("bedtime stories app");
    expect(a).toEqual(b);
  });
  it("returns a coherent result with four experiments", () => {
    const v = provider.validate("a marketplace for plants");
    expect(["strong", "weak", "mixed"]).toContain(v.verdict);
    expect(Number.isInteger(v.waitlist)).toBe(true);
    expect(v.waitlist).toBeGreaterThanOrEqual(0);
    expect(v.ctr).toBeGreaterThan(0);
    expect(v.steps.length).toBeGreaterThan(0);
    expect(typeof v.recommendation).toBe("string");
    expect(v.experiments).toHaveLength(4);
    for (const e of v.experiments) expect(["positive", "weak", "negative"]).toContain(e.signal);
  });
  it("salt varies the reading for re-tests, but is deterministic per salt", () => {
    const base = provider.validate("a marketplace for plants");
    const reA = provider.validate("a marketplace for plants", "42");
    const reB = provider.validate("a marketplace for plants", "42");
    expect(reA).toEqual(reB); // same idea + salt → reproducible
    // a salted re-test should differ from the unsalted first run on at least one core metric
    const differs = reA.waitlist !== base.waitlist || reA.ctr !== base.ctr || reA.confidence !== base.confidence;
    expect(differs).toBe(true);
  });

  it("verdict matches the confidence band", () => {
    const v = provider.validate("some idea");
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(100);
    if (v.verdict === "strong") expect(v.confidence).toBeGreaterThanOrEqual(65);
    if (v.verdict === "weak") expect(v.confidence).toBeLessThan(40);
  });
});

describe("scoreIdea", () => {
  it("is deterministic for the same core + seed", () => {
    const core = { waitlist: 30, ctr: 3, costPerSignup: 1.2, spend: 20 };
    expect(scoreIdea(core, "seed")).toEqual(scoreIdea(core, "seed"));
  });
  it("landing signal tracks waitlist size", () => {
    const hi = scoreIdea({ waitlist: 60, ctr: 5, costPerSignup: 1, spend: 20 }, "x").experiments.find((e) => e.key === "landing");
    const lo = scoreIdea({ waitlist: 5, ctr: 5, costPerSignup: 1, spend: 20 }, "x").experiments.find((e) => e.key === "landing");
    expect(hi?.signal).toBe("positive");
    expect(lo?.signal).toBe("negative");
  });
  it("produces 4 experiments + a 0-100 confidence + a valid verdict", () => {
    const r = scoreIdea({ waitlist: 25, ctr: 2.5, costPerSignup: 2, spend: 18 }, "y");
    expect(r.experiments).toHaveLength(4);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(100);
    expect(["strong", "weak", "mixed"]).toContain(r.verdict);
  });
  it("uses model-provided extras over the RNG when given", () => {
    const core = { waitlist: 50, ctr: 4, costPerSignup: 1, spend: 20 };
    const r = scoreIdea(core, "z", { conversion: 12.3, clickThrough: 8, searchVolume: 9999, competition: "low" });
    const m = Object.fromEntries(r.experiments.map((e) => [e.key, e.metric]));
    expect(m.landing).toContain("12.3% conversion");
    expect(m.fakedoor).toContain("8% clicked through");
    expect(m.search).toContain("9,999/mo searches · low competition");
  });
  it("falls back to the deterministic RNG for omitted extras", () => {
    const core = { waitlist: 30, ctr: 3, costPerSignup: 1.2, spend: 20 };
    expect(scoreIdea(core, "seed", {})).toEqual(scoreIdea(core, "seed")); // {} === no extras
  });
});

describe("shift", () => {
  it("is deterministic for the same company + night", () => {
    const c = makeCompany();
    const a = provider.shift(c);
    const b = provider.shift(c);
    expect(a.activities.map((x) => x.action)).toEqual(b.activities.map((x) => x.action));
  });
  it("produces tagged activities for the next night with non-negative cost", () => {
    const { activities, approvals } = provider.shift(makeCompany({ night: 2 }));
    expect(Array.isArray(activities)).toBe(true);
    expect(Array.isArray(approvals)).toBe(true);
    for (const a of activities) {
      expect(a.night).toBe(3);
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(a.id).toBeTruthy();
    }
  });
  it("routes consequential approvals as unresolved items, never auto-done", () => {
    // sample several nights; any approvals must start unresolved
    for (let n = 0; n < 8; n++) {
      const { approvals } = provider.shift(makeCompany({ id: "c" + n, night: n }));
      for (const ap of approvals) expect(ap.resolved).toBeUndefined();
    }
  });
});
