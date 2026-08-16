import { describe, it, expect } from "vitest";
import {
  allocateMonthlyBudget,
  spendByAgent,
  budgetStatus,
  budgetBreaches,
  wouldExceedAllocation,
  reweightByPerformance,
} from "./office-budget";
import type { Activity, AgentRole } from "@/lib/core/types";

const act = (agent: AgentRole, cost: number): Activity => ({
  id: crypto.randomUUID(),
  night: 1,
  agent,
  action: "work",
  cost,
  status: "done",
});

describe("office-budget (Resource Allocator + Enforcer)", () => {
  describe("allocateMonthlyBudget", () => {
    it("splits the cap across present roles and sums to ~cap", () => {
      const alloc = allocateMonthlyBudget(2000, ["ceo", "engineering", "growth", "support"]);
      const total = Object.values(alloc).reduce((s, v) => s + v, 0);
      expect(total).toBeGreaterThan(1999);
      expect(total).toBeLessThan(2001);
    });

    it("gives engineering more than support", () => {
      const alloc = allocateMonthlyBudget(2000, ["engineering", "support"]);
      expect(alloc.engineering).toBeGreaterThan(alloc.support);
    });

    it("normalizes over present roles (absent roles reserve nothing)", () => {
      const alloc = allocateMonthlyBudget(1000, ["ceo"]);
      expect(alloc.ceo).toBeCloseTo(1000, 0);
      expect(alloc.engineering).toBeUndefined();
    });
  });

  describe("spendByAgent", () => {
    it("sums costs per agent, ignoring non-positive", () => {
      const s = spendByAgent([act("engineering", 30), act("engineering", 20), act("growth", 5), act("growth", -1)]);
      expect(s.engineering).toBe(50);
      expect(s.growth).toBe(5);
    });
  });

  describe("budgetStatus / budgetBreaches", () => {
    it("flags an agent over its allocation", () => {
      const roles: AgentRole[] = ["ceo", "engineering", "growth", "support"];
      // support gets the smallest share (~5% of 2000 ≈ $100) — overspend it.
      const activities = [act("support", 250)];
      const breaches = budgetBreaches(2000, roles, activities);
      expect(breaches.length).toBe(1);
      expect(breaches[0].agent).toBe("support");
      expect(breaches[0].overUsd).toBeGreaterThan(0);
    });

    it("no breach when everyone is within allocation", () => {
      const roles: AgentRole[] = ["ceo", "engineering"];
      const breaches = budgetBreaches(2000, roles, [act("engineering", 100), act("ceo", 50)]);
      expect(breaches.length).toBe(0);
    });

    it("reports remaining budget", () => {
      const status = budgetStatus(2000, ["ceo", "engineering"], [act("engineering", 100)]);
      const eng = status.find((s) => s.agent === "engineering")!;
      expect(eng.remainingUsd).toBe(Math.round((eng.allocatedUsd - 100) * 100) / 100);
    });
  });

  describe("wouldExceedAllocation (pre-approval veto check)", () => {
    it("returns projected overage when a proposed spend blows the allocation", () => {
      const roles: AgentRole[] = ["ceo", "engineering", "growth", "support"];
      const over = wouldExceedAllocation("support", 200, 2000, roles, []);
      expect(over).toBeGreaterThan(0);
    });

    it("returns 0 when the spend fits", () => {
      const roles: AgentRole[] = ["ceo", "engineering"];
      const over = wouldExceedAllocation("engineering", 10, 2000, roles, []);
      expect(over).toBe(0);
    });
  });

  describe("reweightByPerformance", () => {
    it("preserves the total budget while shifting toward higher success", () => {
      const base = { engineering: 600, growth: 400 };
      const out = reweightByPerformance(base, { engineering: 1, growth: 0 });
      const total = out.engineering + out.growth;
      expect(total).toBeGreaterThan(999);
      expect(total).toBeLessThan(1001);
      expect(out.engineering).toBeGreaterThan(out.growth);
    });

    it("is a no-op when no success data is given", () => {
      const base = { engineering: 600, growth: 400 };
      const out = reweightByPerformance(base, {});
      expect(out.engineering).toBeCloseTo(600, 0);
      expect(out.growth).toBeCloseTo(400, 0);
    });
  });
});
