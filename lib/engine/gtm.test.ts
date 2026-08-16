import { describe, it, expect } from "vitest";
import { buildICP, rankChannels, diagnoseBottleneck, buildGTMPlan } from "./gtm";
import type { Activity, Company } from "@/lib/core/types";

const base: Company = {
  id: "c1",
  name: "Mealory",
  slug: "mealory",
  idea: "AI meal-prep for night-shift nurses",
  createdAt: Date.now(),
  status: "operating",
  night: 1,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
};

const act = (action: string, meta = ""): Activity => ({
  id: Math.random().toString(36).slice(2),
  night: 1,
  agent: "growth",
  action,
  meta,
  cost: 0,
  status: "done",
});

describe("buildICP — concentric circles", () => {
  it("returns 5 tiers, priority 1..5, cold last", () => {
    const icp = buildICP(base);
    expect(icp).toHaveLength(5);
    expect(icp.map((t) => t.priority)).toEqual([1, 2, 3, 4, 5]);
    expect(icp[0].tier).toMatch(/personal/i);
    expect(icp[4].tier).toMatch(/cold/i);
  });

  it("customizes the cold tier to the company", () => {
    const icp = buildICP(base);
    expect(icp[4].who).toContain("Mealory");
  });

  it("every tier carries a 'why' rationale", () => {
    for (const t of buildICP(base)) expect(t.why.length).toBeGreaterThan(0);
  });
});

describe("rankChannels — source-quality hierarchy", () => {
  it("ranks referral highest and closed-lost lowest", () => {
    const ch = rankChannels();
    expect(ch[0].source).toBe("referral");
    expect(ch[ch.length - 1].source).toBe("closed-lost");
    // weights strictly descending
    for (let i = 1; i < ch.length; i++) expect(ch[i].weight).toBeLessThan(ch[i - 1].weight);
  });
});

describe("diagnoseBottleneck", () => {
  it("calls DEMAND for an early-stage company with no activity", () => {
    const d = diagnoseBottleneck(base, []);
    expect(d.bottleneck).toBe("demand");
    expect(d.source).toMatch(/blond/i);
  });

  it("calls CONVERSION when demand is abundant but conversions lag", () => {
    const mature: Company = { ...base, night: 8 };
    const activities = [
      act("Sent outreach to 20 leads"),
      act("Posted SEO alternative page"),
      act("Got referral intro from a customer"),
      act("Ran an outbound campaign"),
      act("Drafted prospect list"),
      act("Booked one demo"),
    ];
    const d = diagnoseBottleneck(mature, activities);
    expect(d.bottleneck).toBe("conversion");
  });
});

describe("buildGTMPlan", () => {
  it("assembles north star + icp + channels + bottleneck", () => {
    const plan = buildGTMPlan(base, []);
    expect(plan.northStar).toMatch(/opportunit/i);
    expect(plan.icp).toHaveLength(5);
    expect(plan.channels.length).toBeGreaterThan(0);
    expect(plan.bottleneck.bottleneck).toBe("demand");
  });
});
