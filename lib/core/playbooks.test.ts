import { describe, it, expect } from "vitest";
import { PLAYBOOKS, getPlaybook, listPlaybooks } from "./playbooks";
import { CONNECTION_MAP } from "./connections";

const co = { name: "Acme", idea: "a scheduling tool for dog walkers" };

describe("the playbook library (ADR-0022, PloyBooks pattern on our loop engine)", () => {
  it("ids are unique and the registry is non-empty", () => {
    const ids = PLAYBOOKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PLAYBOOKS.length).toBeGreaterThanOrEqual(4);
    expect(listPlaybooks()).toBe(PLAYBOOKS);
    expect(getPlaybook("seo-sprint")?.name).toBe("SEO sprint");
  });

  it("every `needs` id exists on the connection map — no phantom requirements", () => {
    const known = new Set(CONNECTION_MAP.map((c) => c.id));
    for (const p of PLAYBOOKS) {
      expect(p.needs.length, p.id).toBeGreaterThan(0);
      for (const n of p.needs) expect(known.has(n), `${p.id} needs unknown connection "${n}"`).toBe(true);
    }
  });

  it("every playbook names its rails and carries them into the goal text", () => {
    for (const p of PLAYBOOKS) {
      expect(p.rails.length, p.id).toBeGreaterThanOrEqual(3);
      const g = p.goal(co);
      // The run must carry its compliance: disclosure/honesty language travels inside the goal itself.
      expect(/disclos|honest|receipt|compliance/i.test(g.goal), `${p.id} goal carries no rails`).toBe(true);
      expect(g.goal).toContain(co.name);
    }
  });

  it("goals compile to valid loop objectives: criteria present, iteration caps bounded", () => {
    for (const p of PLAYBOOKS) {
      const g = p.goal(co);
      expect(g.successCriteria.length, p.id).toBeGreaterThanOrEqual(2);
      expect(g.maxIterations, p.id).toBeGreaterThanOrEqual(1);
      expect(g.maxIterations, p.id).toBeLessThanOrEqual(10);
    }
  });

  it("the human floor is stated where it applies: hackathon submission stays human", () => {
    const g = getPlaybook("hackathon-win")!.goal(co);
    expect(g.goal.toLowerCase()).toContain("submit click stay human");
  });
});
