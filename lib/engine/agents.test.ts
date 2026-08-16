import { describe, it, expect } from "vitest";
import { AGENTS, type AgentRole } from "@/lib/core/types";

const ROLES: AgentRole[] = ["ceo", "engineering", "marketing", "support", "growth"];

describe("AGENTS — enriched job descriptions", () => {
  it("every agent has the core fields + non-empty responsibilities", () => {
    for (const role of ROLES) {
      const a = AGENTS[role];
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.playbook.length).toBeGreaterThan(0);
      expect(Array.isArray(a.responsibilities)).toBe(true);
      expect(a.responsibilities.length).toBeGreaterThan(0);
      for (const r of a.responsibilities) expect(r.trim().length).toBeGreaterThan(0);
    }
  });

  it("the customer-facing agents carry an ICP", () => {
    expect(AGENTS.marketing.icp).toBeTruthy();
    expect(AGENTS.growth.icp).toBeTruthy();
  });

  it("objections, where present, are non-empty", () => {
    for (const role of ROLES) {
      const obj = AGENTS[role].objections;
      if (obj) {
        expect(obj.length).toBeGreaterThan(0);
        for (const o of obj) expect(o.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Apex + Guard own the independent-verifier duty (generator/evaluator separation)", () => {
    const verifierish = (rs: string[]) =>
      rs.some((r) => /verif|review|grade its own|independent/i.test(r));
    expect(verifierish(AGENTS.ceo.responsibilities)).toBe(true);
    expect(verifierish(AGENTS.support.responsibilities)).toBe(true);
  });

  it("Pitch leads with demand generation", () => {
    expect(AGENTS.marketing.responsibilities.some((r) => /demand/i.test(r))).toBe(true);
  });
});
