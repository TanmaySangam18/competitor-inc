import { describe, it, expect } from "vitest";
import { orgSoul, relayLine } from "./org-soul";
import { getRole } from "./organization";

const co = { name: "Acme", idea: "a campus tutoring marketplace" };

describe("org soul — a position speaks in-character, honestly (Living Org C.2)", () => {
  it("a lead's soul carries its real job: title, mandate, manager, and its direct reports for the relay", () => {
    const cto = getRole("chief-technology-officer")!;
    const s = orgSoul(cto, co);
    expect(s).toContain("Chief Technology Officer");
    expect(s).toContain(cto.mandate);
    expect(s).toContain("AI employee");
    expect(s).toContain("Your direct reports:");
    expect(s).toContain("relay down");
  });

  it("an IC's soul says it does the work itself (no invented reports)", () => {
    const ics = ["fullstack-engineer", "manual-qa-analyst", "content-marketer"]
      .map((id) => getRole(id))
      .filter((r) => !!r);
    expect(ics.length).toBeGreaterThan(0);
    for (const r of ics) {
      const line = relayLine(r!);
      if (line === null) expect(orgSoul(r!, co)).toContain("individual contributor");
    }
  });

  it("the honesty rails are ALWAYS in the soul — no fake 'done', consequential acts queue for approval", () => {
    const roles = ["chief-executive-officer", "chief-revenue-officer", "fullstack-engineer"];
    for (const id of roles) {
      const s = orgSoul(getRole(id)!, co);
      expect(s).toMatch(/never claim something shipped\/sent\/earned unless it verifiably did/);
      expect(s).toMatch(/DRAFT and queue for the founder's approval/);
    }
  });

  it("relayLine names real direct reports for a lead, null for a leaf", () => {
    const cto = relayLine(getRole("chief-technology-officer")!);
    expect(cto).toBeTruthy();
    expect(cto!).toContain("can assign to:");
  });
});
