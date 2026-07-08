import { describe, it, expect } from "vitest";
import { PLAYBOOKS, buildSalesPrompt, salesAttackFallback } from "./sales-playbooks";

describe("sales-playbooks (the Sales Floor — the invention)", () => {
  it("encodes the canon of named sales/marketing frameworks", () => {
    const keys = PLAYBOOKS.map((b) => b.key);
    for (const k of ["jtbd", "positioning", "storybrand", "challenger", "spin", "sandler", "cialdini", "bullseye", "chasm"]) {
      expect(keys).toContain(k);
    }
    // every playbook credits a real source + gives applicable guidance (application, not reproduction)
    for (const b of PLAYBOOKS) {
      expect(b.author.length).toBeGreaterThan(0);
      expect(b.applyTo("a tutoring app")).toMatch(/tutoring app/);
    }
  });

  it("buildSalesPrompt injects the product + the canon + the honesty guardrail", () => {
    const prompt = buildSalesPrompt("an AI meal-prep app for nurses");
    expect(prompt).toMatch(/an AI meal-prep app for nurses/);
    expect(prompt).toMatch(/Jobs To Be Done/);
    expect(prompt).toMatch(/StoryBrand/);
    expect(prompt).toMatch(/no fabricated stats|no fake urgency/i); // never trains it to lie
  });

  it("salesAttackFallback always returns a complete, framework-grounded attack (never empty)", () => {
    const a = salesAttackFallback("a booking marketplace for local tutors");
    expect(a.product).toMatch(/tutors/);
    expect(a.job.length).toBeGreaterThan(0);
    expect(a.oneLiner.length).toBeGreaterThan(0);
    expect(a.channels.length).toBeGreaterThan(0);
    expect(a.channels.length).toBeLessThanOrEqual(3); // Bullseye: focus, not all 19
    expect(a.objections.length).toBeGreaterThanOrEqual(3);
    expect(a.firstWeek.length).toBeGreaterThan(0);
    expect(a.frameworks).toContain("Jobs To Be Done");
  });

  it("handles an empty product gracefully", () => {
    const a = salesAttackFallback("");
    expect(a.product).toBe("your product");
    expect(a.oneLiner.length).toBeGreaterThan(0);
  });
});
