import { describe, it, expect } from "vitest";
import { buildFundingPack, autonomyRate, orgRosterSummary, type FundingPackInput } from "./funding-pack";

const base: FundingPackInput = {
  companyName: "PilotWorks",
  goalUsd: 10_000,
  autonomy: { ranAutonomously: 0, neededFounder: 0, killSwitchEngagements: 0 },
  revenue: { collectedUsd: 0, paidCustomers: 0, windowDays: 30 },
  proof: { totalReceipts: 0, liveReceipts: 0 },
};

describe("funding pack — the anti-money-printer artifact", () => {
  it("an empty company yields an honest, non-inflated pack", () => {
    const p = buildFundingPack(base);
    expect(p.goalProgressPct).toBe(0);
    expect(p.autonomyRatePct).toBe(0);
    expect(p.headline).toContain("nothing fabricated");
    // Every revenue/proof claim reads not-yet, none faked to "proven".
    const revClaim = p.claims.find((c) => c.label.startsWith("Collected revenue"))!;
    expect(revClaim.value).toBe("$0");
    expect(revClaim.status).toBe("not-yet");
    expect(p.claims.some((c) => c.status === "proven" && /revenue|customers/i.test(c.label))).toBe(false);
  });

  it("autonomyRate is bounded and never NaN", () => {
    expect(autonomyRate({ ranAutonomously: 0, neededFounder: 0, killSwitchEngagements: 0 })).toBe(0);
    expect(autonomyRate({ ranAutonomously: 9, neededFounder: 1, killSwitchEngagements: 0 })).toBe(90);
    expect(autonomyRate({ ranAutonomously: 1, neededFounder: 0, killSwitchEngagements: 0 })).toBe(100);
  });

  it("real, receipted revenue promotes the right claims to proven", () => {
    const p = buildFundingPack({
      ...base,
      autonomy: { ranAutonomously: 42, neededFounder: 6, killSwitchEngagements: 1 },
      revenue: { collectedUsd: 6000, paidCustomers: 6, windowDays: 30, repeatablePct: 70 },
      proof: { totalReceipts: 20, liveReceipts: 18 },
    });
    expect(p.goalProgressPct).toBe(60);
    expect(p.autonomyRatePct).toBe(88); // 42 / 48
    const byLabel = Object.fromEntries(p.claims.map((c) => [c.label, c]));
    expect(byLabel["Collected revenue (verified)"].status).toBe("proven");
    expect(byLabel["Repeatable revenue"].status).toBe("proven"); // 70% ≥ 60
    expect(byLabel["Goal progress"].status).toBe("in-progress"); // 60% < 100
    expect(p.headline).toContain("$6,000");
  });

  it("goal progress caps at 100 and repeatable <60 stays in-progress", () => {
    const p = buildFundingPack({
      ...base,
      revenue: { collectedUsd: 25_000, paidCustomers: 20, windowDays: 30, repeatablePct: 40 },
    });
    expect(p.goalProgressPct).toBe(100);
    expect(p.claims.find((c) => c.label === "Repeatable revenue")!.status).toBe("in-progress");
  });

  it("every claim carries an auditable basis (trust nothing, verify everything)", () => {
    const p = buildFundingPack(base);
    expect(p.claims.every((c) => c.basis.length > 10)).toBe(true);
  });

  it("roster summary covers all departments with role titles", () => {
    const roster = orgRosterSummary();
    expect(roster.length).toBe(11);
    expect(roster.every((d) => d.roles.length > 0)).toBe(true);
    expect(roster.flatMap((d) => d.roles)).toContain("Chief Executive Officer");
  });
});
