import { describe, it, expect } from "vitest";
import { SPECIALISTS, PERSONA, specialistsForRole } from "./specialists";
import { AGENTS, type AgentRole } from "./types";

const ROLES = Object.keys(AGENTS) as AgentRole[];

describe("specialists catalog (agency-agents-derived)", () => {
  it("covers every governed role with ≥1 specialist and a persona line", () => {
    for (const role of ROLES) {
      expect(SPECIALISTS[role]?.length ?? 0).toBeGreaterThan(0);
      expect(typeof PERSONA[role]).toBe("string");
      expect(PERSONA[role].length).toBeGreaterThan(0);
    }
  });

  it("specialistsForRole is bounded by n and deterministic", () => {
    const a = specialistsForRole("engineering", "an AI chatbot app", 3);
    const b = specialistsForRole("engineering", "an AI chatbot app", 3);
    expect(a).toEqual(b); // pure + deterministic (no model call)
    expect(a.length).toBeLessThanOrEqual(3);
  });

  it("is idea-aware: keyword hits promote the relevant specialist", () => {
    const ai = specialistsForRole("engineering", "an AI vision model for photos", 3).map((s) => s.name);
    expect(ai).toContain("AI Engineer");
    const hw = specialistsForRole("engineering", "an EV car with custom hardware", 3).map((s) => s.name);
    expect(hw).toContain("Firmware Engineer");
  });

  it("never leaks specialists across roles", () => {
    const finance = new Set(SPECIALISTS.finance.map((s) => s.name));
    for (const s of specialistsForRole("finance", "any idea", 9)) expect(finance.has(s.name)).toBe(true);
  });
});
