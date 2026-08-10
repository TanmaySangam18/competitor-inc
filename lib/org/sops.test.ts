import { describe, it, expect } from "vitest";
import { SOPS, getSop, rolesWithSop } from "./sops";
import { getRole } from "./organization";
import { orgSoul } from "./org-soul";

describe("per-role SOPs", () => {
  it("every SOP maps to a REAL canonical role id", () => {
    for (const id of rolesWithSop()) {
      expect(getRole(id), `SOP references unknown role '${id}'`).toBeDefined();
    }
  });

  it("every SOP has a name and ordered steps", () => {
    for (const sop of Object.values(SOPS)) {
      expect(sop.name.trim()).not.toBe("");
      expect(sop.steps.length).toBeGreaterThanOrEqual(3);
      expect(sop.steps.every((s) => s.trim().length > 0)).toBe(true);
    }
  });

  it("SOPs are CLAIM-FREE — no percentages, ROI, or 'proven/guaranteed' (honesty floor)", () => {
    const text = JSON.stringify(SOPS);
    expect(text).not.toMatch(/\d+\s?%/); // no percentage claims
    expect(text).not.toMatch(/\b(ROI|proven|guaranteed|best-in-class|10x|guarantee)\b/i);
  });

  it("the SOP is wired into the agent's soul so it actually follows it", () => {
    const sdr = getRole("sales-development-rep")!;
    const soul = orgSoul(sdr, { name: "Acme", idea: "a booking tool" });
    expect(soul).toContain("standard operating procedure");
    expect(soul).toContain("Prospecting SOP");
    expect(soul).toContain("no-spam gate");
  });

  it("a role without an SOP has no SOP line (no empty noise)", () => {
    const auditor = getRole("auditor")!; // no SOP assigned (audits everyone else's)
    expect(getSop("auditor")).toBeUndefined();
    const soul = orgSoul(auditor, { name: "Acme", idea: "x" });
    expect(soul).not.toContain("standard operating procedure");
  });

  it("the run-the-company SOPs exist (discovery, close+forecast, agent review)", () => {
    expect(getSop("ux-researcher")?.name).toBe("Discovery SOP");
    expect(getSop("finance-controller")?.name).toBe("Close & Forecast SOP");
    expect(getSop("chief-of-staff")?.name).toBe("Agent Review SOP");
  });
});
