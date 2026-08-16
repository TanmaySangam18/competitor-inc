import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getProvider, slugify, companyNameFrom } from "./provider";
import type { Company } from "@/lib/core/types";

// Property-based / fuzz layer (QuickCheck lineage). Each property runs hundreds of
// generated inputs — thousands of "cycles" across the suite — to find edge cases that
// hand-written examples miss. Pure engine logic only (deterministic, no network).
const p = getProvider();

const companyArb = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string(),
  slug: fc.string(),
  idea: fc.string(),
  createdAt: fc.integer(),
  status: fc.constant("operating" as const),
  night: fc.nat({ max: 200 }),
  ledger: fc.record({
    spent: fc.float({ min: 0, max: 1e6, noNaN: true }),
    credited: fc.float({ min: 0, max: 1e6, noNaN: true }),
    tasksDone: fc.nat(),
    tasksFailed: fc.nat(),
  }),
}) as fc.Arbitrary<Company>;

describe("engine — property/fuzz", () => {
  it("validate(): any string yields a coherent result", () => {
    fc.assert(
      fc.property(fc.string(), (idea) => {
        const v = p.validate(idea);
        expect(["strong", "weak", "mixed"]).toContain(v.verdict);
        expect(v.waitlist).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(v.ctr)).toBe(true);
        expect(v.costPerSignup).toBeGreaterThan(0);
        expect(v.steps.length).toBeGreaterThan(0);
        expect(typeof v.recommendation).toBe("string");
        expect(v.experiments).toHaveLength(4);
        expect(v.confidence).toBeGreaterThanOrEqual(0);
        expect(v.confidence).toBeLessThanOrEqual(100);
      }),
      { numRuns: 500 }
    );
  });

  it("validate(): is deterministic for the same idea", () => {
    fc.assert(
      fc.property(fc.string(), (idea) => {
        expect(p.validate(idea)).toEqual(p.validate(idea));
      }),
      { numRuns: 300 }
    );
  });

  it("slugify(): always non-empty and url-safe", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const slug = slugify(s);
        expect(slug.length).toBeGreaterThan(0);
        expect(/^[a-z0-9-]+$/.test(slug)).toBe(true);
      }),
      { numRuns: 500 }
    );
  });

  it("companyNameFrom(): never empty, never throws", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const n = companyNameFrom(s);
        expect(typeof n).toBe("string");
        expect(n.length).toBeGreaterThan(0);
      }),
      { numRuns: 500 }
    );
  });

  it("shift(): any operating company yields valid, safe activity", () => {
    fc.assert(
      fc.property(companyArb, (c) => {
        const { activities, approvals } = p.shift(c);
        expect(Array.isArray(activities)).toBe(true);
        expect(Array.isArray(approvals)).toBe(true);
        for (const a of activities) {
          expect(a.night).toBe(c.night + 1); // never re-runs a past night
          expect(a.cost).toBeGreaterThanOrEqual(0); // never negative spend
          expect(a.id).toBeTruthy();
        }
        // consequential actions NEVER auto-execute — they must wait for approval
        for (const ap of approvals) expect(ap.resolved).toBeUndefined();
      }),
      { numRuns: 400 }
    );
  });
});
