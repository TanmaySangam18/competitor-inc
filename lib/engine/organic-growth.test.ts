import { describe, it, expect } from "vitest";
import { diagnoseConstraint, channelReadout, organicGrowthPlan, type ChannelInput } from "./organic-growth";
import type { FunnelSnapshot } from "./growth";

const funnel = (over: Partial<FunnelSnapshot> = {}): FunnelSnapshot => ({
  views: 500,
  signups: 40,
  payingCustomers: 3,
  revenueCents: 9000,
  basis: { views: "real", signups: "real", paying: "real", revenue: "real" },
  ...over,
});

describe("organic-growth — constraint diagnosis", () => {
  it("unknown when the pixel isn't capturing views", () => {
    expect(diagnoseConstraint(funnel({ basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" } }))).toBe("unknown");
  });
  it("traffic when reach is thin", () => {
    expect(diagnoseConstraint(funnel({ views: 20, signups: 1 }))).toBe("traffic");
  });
  it("conversion when reach is fine but signup rate is weak", () => {
    expect(diagnoseConstraint(funnel({ views: 1000, signups: 5 }))).toBe("conversion"); // 0.5% < 2%
  });
  it("monetization when signups convert but nobody pays", () => {
    expect(diagnoseConstraint(funnel({ views: 1000, signups: 100, payingCustomers: 0 }))).toBe("monetization");
  });
});

describe("organic-growth — channel readout (winners/losers, honest)", () => {
  const channels: ChannelInput[] = [
    { channel: "organic-social", views: 800, signups: 40 }, // 5%
    { channel: "community", views: 200, signups: 2 }, // 1%
    { channel: "referral", views: 300, signups: 0 }, // 0 → cut
    { channel: "email", views: 10, signups: 3 }, // below sample floor → needs-data
  ];
  it("flags winners, laggards, dead channels, and thin data honestly", () => {
    const r = channelReadout(channels);
    const byCh = Object.fromEntries(r.map((x) => [x.channel, x.verdict]));
    expect(byCh["organic-social"]).toBe("double-down");
    expect(byCh["referral"]).toBe("cut");
    expect(byCh["email"]).toBe("needs-data");
    expect(["keep", "double-down"]).toContain(byCh["community"]);
  });
});

describe("organic-growth — full plan", () => {
  it("produces a constraint-matched content plan + experiments", () => {
    const plan = organicGrowthPlan({ funnel: funnel({ views: 20 }), channels: [] });
    expect(plan.constraint).toBe("traffic");
    expect(plan.contentPlan.themes.length).toBeGreaterThan(0);
    expect(plan.diagnosis.toLowerCase()).toContain("reach");
    expect(plan.experiments.length).toBeGreaterThan(0);
    expect(plan.experiments[0].metric).toBe("views"); // traffic → optimize for reach
  });
  it("unknown constraint tells you to instrument first (honest)", () => {
    const plan = organicGrowthPlan({ funnel: funnel({ basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" } }), channels: [] });
    expect(plan.constraint).toBe("unknown");
    expect(plan.contentPlan.themes[0].theme.toLowerCase()).toContain("pixel");
  });
});
