import { describe, it, expect } from "vitest";
import { organicShift, toChannelInputs } from "./organic-shift";
import type { FunnelSnapshot } from "./growth";
import type { Company } from "./types";

const company = (over: Partial<Company> = {}): Company =>
  ({ id: "c1", name: "Lumira", idea: "clean skincare for oily skin", slug: "lumira", night: 3, product: { url: "https://lumira.example" } } as unknown as Company);

const funnel = (over: Partial<FunnelSnapshot> = {}): FunnelSnapshot => ({
  views: 1000,
  signups: 8, // 0.8% → conversion-bound
  payingCustomers: 0,
  revenueCents: 0,
  basis: { views: "real", signups: "real", paying: "real", revenue: "real" },
  ...over,
});

describe("organic-shift — operationalized nightly move", () => {
  it("emits a Glass-Box plan activity + ready-to-post drafts on the desk", () => {
    const s = organicShift(company(), funnel(), [{ channel: "organic-social", views: 800, signups: 8 }], 4);
    expect(s.plan.constraint).toBe("conversion");
    // one activity summarizing the plan
    expect(s.activities.length).toBe(1);
    expect(s.activities[0].cost).toBe(0); // pure, no spend
    expect(s.activities[0].action.toLowerCase()).toContain("organic plan");
    // drafts land as approvals (draft → approve → post), capped
    expect(s.approvals.length).toBeGreaterThan(0);
    expect(s.approvals.length).toBeLessThanOrEqual(2);
    // drafts are grounded in the brand and constraint-matched (conversion → proof/trust)
    expect(s.approvals[0].detail).toContain("Lumira");
    expect(s.approvals[0].detail.toLowerCase()).toContain("proof");
  });

  it("respects the draft cap", () => {
    const s = organicShift(company(), funnel({ views: 20 }), [], 4, 1); // traffic-bound
    expect(s.plan.constraint).toBe("traffic");
    expect(s.approvals.length).toBe(1);
  });

  it("stays honest with no data — instrument-first, no fabricated drafts", () => {
    const s = organicShift(
      company(),
      funnel({ basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" } }),
      [],
      4,
    );
    expect(s.plan.constraint).toBe("unknown");
    expect(s.approvals[0].detail.toLowerCase()).toContain("pixel");
  });

  it("routes theme channels to the right approval kind", () => {
    const s = organicShift(company(), funnel({ views: 20 }), [], 4); // traffic themes → organic-social + community
    const kinds = new Set(s.approvals.map((a) => a.kind));
    // first traffic theme is organic-social → "twitter" draft
    expect(kinds.has("twitter")).toBe(true);
  });

  it("toChannelInputs maps attribution rows to engine inputs", () => {
    const inputs = toChannelInputs([
      { channel: "organic-social", views: 800, signups: 40, revenueCents: null },
      { channel: "referral", views: 100, signups: 0, revenueCents: 500 },
    ]);
    expect(inputs).toEqual([
      { channel: "organic-social", views: 800, signups: 40, revenueCents: null },
      { channel: "referral", views: 100, signups: 0, revenueCents: 500 },
    ]);
  });
});
