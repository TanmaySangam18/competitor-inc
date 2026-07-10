import { describe, it, expect } from "vitest";
import {
  STAGE_ORDER,
  STAGE_STORY,
  stageForSignals,
  stageIndex,
  activeDepartments,
  activeRoles,
  stageDiff,
} from "./org-stages";
import { DEPARTMENTS, ROLES } from "./organization";

describe("staged enterprise — stages advance only on REAL signals (honesty invariant)", () => {
  it("a brand-new company is a garage company (no signals, no inflation)", () => {
    expect(stageForSignals({})).toBe("garage");
    expect(stageForSignals({ signups: 50, revenueEventCents: 9900, repeatCustomers: 2 })).toBe("garage"); // no live build ⇒ nothing else counts
  });

  it("a verified live build unlocks seed — and only that", () => {
    expect(stageForSignals({ hasVerifiedLiveBuild: true })).toBe("seed");
  });

  it("real signups on a live product unlock growth", () => {
    expect(stageForSignals({ hasVerifiedLiveBuild: true, signups: 1 })).toBe("growth");
  });

  it("settled revenue + a repeat customer unlock enterprise (never projections)", () => {
    expect(stageForSignals({ hasVerifiedLiveBuild: true, signups: 10, revenueEventCents: 4900, repeatCustomers: 1 })).toBe("enterprise");
    // revenue without repeatability is still growth — repeatable is the charter's bar
    expect(stageForSignals({ hasVerifiedLiveBuild: true, signups: 10, revenueEventCents: 4900 })).toBe("growth");
  });

  it("stages strictly widen — each stage contains every earlier department (no regressions)", () => {
    for (let i = 1; i < STAGE_ORDER.length; i++) {
      const prev = new Set(activeDepartments(STAGE_ORDER[i - 1]).map((d) => d.id));
      const cur = new Set(activeDepartments(STAGE_ORDER[i]).map((d) => d.id));
      for (const id of prev) expect(cur.has(id)).toBe(true);
      expect(cur.size).toBeGreaterThan(prev.size);
    }
  });

  it("enterprise = the full company (all departments, all roles)", () => {
    expect(activeDepartments("enterprise")).toHaveLength(DEPARTMENTS.length);
    expect(activeRoles("enterprise")).toHaveLength(ROLES.length);
  });

  it("garage is a real build team — engineering yes, legal/finance/revenue not yet", () => {
    const ids = new Set(activeDepartments("garage").map((d) => d.id));
    expect(ids.has("engineering")).toBe(true);
    expect(ids.has("quality")).toBe(true);
    expect(ids.has("legal")).toBe(false);
    expect(ids.has("finance")).toBe(false);
    expect(ids.has("revenue")).toBe(false);
  });

  it("stageDiff narrates growth — garage→seed gains revenue/customer/data and their roles", () => {
    const d = stageDiff("garage", "seed");
    expect(d.departments.map((x) => x.id).sort()).toEqual(["customer", "data", "revenue"]);
    expect(d.roles.length).toBeGreaterThan(0);
    expect(d.roles.every((r) => ["customer", "data", "revenue"].includes(r.department))).toBe(true);
  });

  it("every stage has a story + every active role belongs to an active department", () => {
    for (const s of STAGE_ORDER) {
      expect(STAGE_STORY[s].label.length).toBeGreaterThan(0);
      expect(STAGE_STORY[s].story.length).toBeGreaterThan(20);
      const deptIds = new Set(activeDepartments(s).map((d) => d.id));
      expect(activeRoles(s).every((r) => deptIds.has(r.department))).toBe(true);
    }
    expect(stageIndex("garage")).toBe(0);
    expect(stageIndex("enterprise")).toBe(3);
  });
});
