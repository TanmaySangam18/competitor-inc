import { describe, it, expect } from "vitest";
import { personaFor, displayName } from "./personas";
import { getRole, ROLES } from "./organization";
import { orgSoul } from "./org-soul";

describe("personas — named characters, honestly (Living Org C.3)", () => {
  it("is deterministic: the same role always gets the same persona (stable across sessions)", () => {
    for (const r of ROLES) {
      const a = personaFor(r);
      const b = personaFor(r);
      expect(a).toEqual(b);
      expect(a.name.length).toBeGreaterThan(1);
      expect(a.voice.length).toBeGreaterThan(10);
      expect(a.temperament.length).toBeGreaterThan(10);
    }
  });

  it("leadership is hand-cast with distinct names (the roles customers talk to most)", () => {
    const leads = ["chief-executive-officer", "chief-technology-officer", "head-of-quality", "general-counsel"].map((id) => personaFor(getRole(id)!));
    const names = leads.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length); // no duplicate cast names
    expect(names).toContain("Vera"); // the CTO from the approved mockup pattern
  });

  it("every hand-cast persona key is a REAL role id (an org rename can't silently drop a character)", () => {
    // The cast falls back to derived personas on a miss — fine at runtime, but a miss means a typo here.
    const ids = new Set(ROLES.map((r) => r.id));
    const castLeaders = ["chief-executive-officer", "chief-of-staff", "chief-technology-officer", "vp-engineering", "chief-product-officer", "head-of-design", "head-of-quality", "chief-revenue-officer", "head-of-customer-success", "head-of-licensing", "chief-financial-officer", "general-counsel", "head-of-analytics"];
    for (const id of castLeaders) expect(ids.has(id)).toBe(true);
    expect(personaFor(getRole("vp-engineering")!).name).toBe("Dmitri"); // the fixed key actually resolves
  });

  it("displayName keeps the POSITION canonical — name WITH title, never instead of it", () => {
    const cto = getRole("chief-technology-officer")!;
    expect(displayName(cto)).toBe("Vera · Chief Technology Officer");
  });

  it("the soul speaks as the persona but keeps every honesty rail", () => {
    const cto = getRole("chief-technology-officer")!;
    const s = orgSoul(cto, { name: "Acme", idea: "a tutoring marketplace" });
    expect(s).toContain("You are Vera, the Chief Technology Officer");
    expect(s).toContain("Your voice:");
    expect(s).toContain("Affect is honest and about the WORK");
    expect(s).toMatch(/never claim something shipped\/sent\/earned unless it verifiably did/);
    expect(s).toContain("AI employee");
  });

  it("a lead's soul names its reports as people WITH their positions (the relay feels human, stays precise)", () => {
    const cto = getRole("chief-technology-officer")!;
    const s = orgSoul(cto, { name: "Acme", idea: "x" });
    expect(s).toMatch(/Your direct reports: .*\(/); // "Name (Title)" format
  });
});
