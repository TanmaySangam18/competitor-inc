import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { closeDueExperiments, diagnoseFunnel, proposeExperiments, runGrowthStep, readMetric } from "./growth";
import type { FunnelSnapshot, GrowthExperiment, StageBasis } from "./growth";
import type { Company } from "./types";

const co = (over: Partial<Company> = {}): Company => ({
  id: "c1",
  name: "Mealory",
  slug: "mealory",
  idea: "meal prep for nurses",
  createdAt: 0,
  status: "operating",
  night: 5,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
  ...over,
});

const funnel = (over: Partial<FunnelSnapshot> = {}): FunnelSnapshot => ({
  views: 100,
  signups: 10,
  payingCustomers: 0,
  revenueCents: 0,
  basis: { views: "real", signups: "real", paying: "real", revenue: "real" },
  ...over,
});

const exp = (over: Partial<GrowthExperiment> = {}): GrowthExperiment => ({
  id: "x1",
  hypothesis: "h",
  metric: "signups",
  baseline: 5,
  target: 20,
  startedNight: 1,
  windowNights: 3,
  status: "running",
  activityIds: [],
  ...over,
});

let n = 0;
const mkId = () => `id-${++n}`;

describe("closeDueExperiments — honest verdicts", () => {
  it("keeps an experiment open inside its window", () => {
    const r = closeDueExperiments([exp()], funnel(), 2);
    expect(r.stillOpen).toHaveLength(1);
    expect(r.closed).toHaveLength(0);
  });

  it("closes WON when the measured value beats the target", () => {
    const r = closeDueExperiments([exp({ target: 8 })], funnel({ signups: 10 }), 4);
    expect(r.closed[0].status).toBe("won");
    expect(r.closed[0].resultValue).toBe(10);
    expect(r.closed[0].resultBasis).toBe("real");
  });

  it("closes LOST when no better than baseline", () => {
    const r = closeDueExperiments([exp({ baseline: 12, target: 25 })], funnel({ signups: 10 }), 4);
    expect(r.closed[0].status).toBe("lost");
    expect(r.closed[0].learning).toMatch(/didn't hold/);
  });

  it("closes INCONCLUSIVE with NO fabricated value when the stage is missing", () => {
    const f = funnel({ views: null, signups: null, basis: { views: "missing", signups: "missing", paying: "real", revenue: "real" } });
    const r = closeDueExperiments([exp()], f, 4);
    expect(r.closed[0].status).toBe("inconclusive");
    expect(r.closed[0].resultValue).toBeUndefined();
    expect(r.closed[0].resultBasis).toBeUndefined();
    expect(r.closed[0].learning).toMatch(/don't invent numbers/);
  });

  it("stamps estimate basis and says so in the learning", () => {
    const f = funnel({ basis: { views: "real", signups: "estimate", paying: "real", revenue: "real" } });
    const r = closeDueExperiments([exp({ target: 8 })], f, 4);
    expect(r.closed[0].resultBasis).toBe("estimate");
    expect(r.closed[0].learning).toMatch(/estimate/i);
  });

  it("PROPERTY: result_basis is never 'real' unless the measured stage is real", () => {
    const basisArb = fc.constantFrom<StageBasis>("real", "estimate", "missing");
    fc.assert(
      fc.property(
        fc.record({
          views: fc.option(fc.nat({ max: 10000 }), { nil: null }),
          signups: fc.option(fc.nat({ max: 10000 }), { nil: null }),
          vb: basisArb,
          sb: basisArb,
        }),
        (r) => {
          const f = funnel({
            views: r.vb === "missing" ? null : r.views,
            signups: r.sb === "missing" ? null : r.signups,
            basis: { views: r.vb, signups: r.sb, paying: "missing", revenue: "missing" },
          });
          for (const metric of ["views", "signups", "signup_rate"] as const) {
            const { closed } = closeDueExperiments([exp({ metric })], f, 99);
            const c = closed[0];
            if (c.resultBasis === "real") {
              const stage = readMetric(metric, f);
              expect(stage.basis).toBe("real");
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe("diagnoseFunnel — constraint per stage + missing signals", () => {
  it("calls traffic when views are tiny", () => {
    const d = diagnoseFunnel(funnel({ views: 5, signups: 0 }), co(), []);
    expect(d.constraint).toBe("traffic");
  });
  it("calls conversion when traffic flows but signups don't", () => {
    const d = diagnoseFunnel(funnel({ views: 500, signups: 2 }), co(), []);
    expect(d.constraint).toBe("conversion");
  });
  it("calls monetization when signups flow but nobody pays", () => {
    const d = diagnoseFunnel(funnel({ views: 500, signups: 40, payingCustomers: 0 }), co(), []);
    expect(d.constraint).toBe("monetization");
  });
  it("lists missing signals with connect CTAs", () => {
    const f = funnel({ basis: { views: "missing", signups: "real", paying: "missing", revenue: "missing" } });
    const d = diagnoseFunnel(f, co(), []);
    expect(d.missingSignals.map((m) => m.stage)).toEqual(["views", "paying", "revenue"]);
    expect(d.missingSignals[0].connectCta).toMatch(/pixel/i);
  });
  it("degrades honestly to the activity-log diagnosis with zero instrumentation", () => {
    const f = funnel({ views: null, signups: null, basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" } });
    const d = diagnoseFunnel(f, co({ night: 1 }), []);
    expect(d.signal).toMatch(/no funnel instrumentation/);
    expect(["traffic", "conversion"]).toContain(d.constraint);
  });
});

describe("proposeExperiments — capped, targeted, baseline-derived", () => {
  it("never exceeds two open experiments", () => {
    const d = diagnoseFunnel(funnel({ views: 5 }), co(), []);
    expect(proposeExperiments(co(), d, funnel({ views: 5 }), 2, 5, mkId)).toHaveLength(0);
  });
  it("targets views for a traffic constraint, derived from baseline", () => {
    const f = funnel({ views: 40, signups: 0 });
    const d = { ...diagnoseFunnel(f, co(), []), constraint: "traffic" as const };
    const p = proposeExperiments(co(), d, f, 0, 5, mkId);
    expect(p[0].metric).toBe("views");
    expect(p[0].target).toBe(60); // 1.5x baseline
  });
  it("targets first revenue when the goal's north star is revenue", () => {
    const f = funnel({ views: 500, signups: 40 });
    const d = diagnoseFunnel(f, co(), []);
    const p = proposeExperiments(co({ growthGoal: { northStar: "revenue", target: 1000, setAt: 0 } }), d, f, 0, 5, mkId);
    expect(p[0].metric).toBe("revenue_cents");
  });
});

describe("runGrowthStep — the whole loop step with transparency", () => {
  it("closes, diagnoses, proposes, and logs one activity per close + proposal", () => {
    const r = runGrowthStep(co(), [exp({ target: 8 })], funnel(), [], 5, mkId);
    expect(r.closed).toHaveLength(1);
    expect(r.proposed.length).toBeGreaterThan(0);
    expect(r.activities.length).toBe(r.closed.length + r.proposed.length);
    expect(r.activities[0].action).toMatch(/Closed experiment/);
    expect(r.memoryNotes[0]).toMatch(/Experiment won/i);
  });
});
