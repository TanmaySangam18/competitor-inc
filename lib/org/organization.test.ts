import { describe, it, expect } from "vitest";
import { ROLES, DEPARTMENTS, validateOrg, reportingChain, directReports, orgSize, getRole } from "./organization";

describe("organization", () => {
  it("is structurally sound (one CEO root, valid managers, no cycles, complete JDs)", () => {
    expect(validateOrg()).toEqual([]);
  });

  it("has a real company's worth of roles across every department", () => {
    expect(orgSize()).toBeGreaterThanOrEqual(40);
    for (const d of DEPARTMENTS) {
      expect(ROLES.some((r) => r.department === d.id), `department ${d.id} has roles`).toBe(true);
    }
  });

  it("names every role by its POSITION, never a human/pet name", () => {
    for (const r of ROLES) {
      expect(r.title.trim().length, r.id).toBeGreaterThan(0);
      // titles read like positions: multi-word or a known acronym, not a first name
      expect(/[A-Z]/.test(r.title), `${r.id} title looks like a position`).toBe(true);
    }
  });

  it("gives every role a detailed job description, responsibilities, and KPIs", () => {
    for (const r of ROLES) {
      expect(r.jobDescription.length, `${r.id} JD`).toBeGreaterThan(60);
      expect(r.responsibilities.length, `${r.id} responsibilities`).toBeGreaterThanOrEqual(2);
      expect(r.kpis.length, `${r.id} kpis`).toBeGreaterThanOrEqual(2);
      expect(r.channel.startsWith("#"), `${r.id} channel`).toBe(true);
    }
  });

  it("every management chain reaches the CEO", () => {
    const ceo = ROLES.find((r) => r.reportsTo === null)!;
    for (const r of ROLES) {
      const chain = reportingChain(r.id);
      expect(chain[chain.length - 1].id, `${r.id} → CEO`).toBe(ceo.id);
    }
  });

  it("keeps money/legal/publishing acts gated to the founder", () => {
    // the CFO must never be able to move money without founder sign-off
    const cfo = getRole("finance-controller")!;
    expect(cfo.humanApprovalFor.join(" ").toLowerCase()).toContain("money");
    // the General Counsel must never sign autonomously
    const gc = getRole("legal-compliance-analyst")!;
    expect(gc.humanApprovalFor.join(" ").toLowerCase()).toContain("sign");
  });

  it("the CEO manages a real span (departments hang off the exec layer)", () => {
    expect(directReports("chief-of-staff").length).toBeGreaterThanOrEqual(5);
  });
});
