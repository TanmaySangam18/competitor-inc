import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { DELIVERABLES, deliverablesReport, deliverablesByDepartment } from "./deliverables";
import { DEPARTMENTS } from "./organization";

describe("every catalog claim is checkable", () => {
  it("names a real file for everything claimed build, draft or integrate", () => {
    // The same honesty test the coverage ledger uses. A "build" claim pointing at a module that does not
    // exist hides the gap behind a filename, which is worse than admitting it.
    const missing: string[] = [];
    for (const d of DELIVERABLES) {
      if (d.produce === "none") continue;
      const paths = d.evidence.match(/\b(?:lib|app|scripts|supabase|docs)\/[A-Za-z0-9._/-]+/g) ?? [];
      for (const p of paths) {
        const base = p.replace(/[.,;)]$/, "");
        if (!existsSync(base) && !existsSync(`${base}.ts`)) missing.push(`${d.id} -> ${base}`);
      }
    }
    expect(missing, `evidence points at files that do not exist: ${missing.join(", ")}`).toEqual([]);
  });

  it("never leaves an entry without evidence or examples", () => {
    for (const d of DELIVERABLES) {
      expect(d.evidence.trim().length, `${d.id} has no evidence`).toBeGreaterThan(25);
      expect(d.examples.trim().length, `${d.id} has no examples`).toBeGreaterThan(5);
    }
  });

  it("uses only the eight real departments", () => {
    const real = new Set(DEPARTMENTS.map((x) => x.id));
    for (const d of DELIVERABLES) expect(real.has(d.department), `${d.id} bad department`).toBe(true);
  });

  it("has unique ids and no em-dashes in prose", () => {
    expect(new Set(DELIVERABLES.map((d) => d.id)).size).toBe(DELIVERABLES.length);
    for (const d of DELIVERABLES) expect(`${d.category} ${d.examples} ${d.evidence}`, d.id).not.toMatch(/—/);
  });
});

describe("the honest verbs stay honest", () => {
  it("never grades a billion-user platform or a regulated filing as buildable", () => {
    // The exact overclaims the product exists to refuse. If these ever flip to build, the catalog is lying.
    for (const id of ["big-platform", "entity-tax", "ats-hris", "ad-campaign", "a11y-audit"]) {
      expect(DELIVERABLES.find((d) => d.id === id)!.produce, `${id} must be none`).toBe("none");
    }
  });

  it("grades Salesforce as integrate, not build", () => {
    // We sit next to Salesforce. Claiming to rebuild it is the category error.
    const crm = DELIVERABLES.find((d) => d.id === "crm")!;
    expect(crm.produce).toBe("integrate");
    expect(crm.evidence).toMatch(/do not rebuild it|next to/i);
  });

  it("keeps invoicing at draft until money actually moves", () => {
    // Drafting an invoice is real; charging a card is not built. The catalog must not conflate them.
    const inv = DELIVERABLES.find((d) => d.id === "invoice")!;
    expect(inv.produce).toBe("draft");
    expect(inv.evidence).toMatch(/charging is unbuilt|task #78/i);
  });

  it("separates deliberate refusals from the real backlog", () => {
    const r = deliverablesReport();
    expect(r.refusals.map((d) => d.id).sort()).toEqual(["ats-hris", "big-platform", "entity-tax"]);
    // The backlog is things we WOULD build and have not; refusals are things we never will.
    for (const g of r.gaps) expect(["ats-hris", "big-platform", "entity-tax"]).not.toContain(g.id);
    expect(r.gaps.length).toBeGreaterThan(0);
  });
});

describe("the report adds up", () => {
  it("counts every category exactly once", () => {
    const r = deliverablesReport();
    expect(r.build + r.draft + r.integrate + r.none).toBe(r.total);
  });

  it("covers all eight departments", () => {
    const covered = new Set(DELIVERABLES.map((d) => d.department));
    for (const dept of DEPARTMENTS) expect(covered.has(dept.id), `${dept.id} has no deliverables`).toBe(true);
  });

  it("writes a headline that states all four verbs without an em-dash", () => {
    const h = deliverablesReport().headline;
    expect(h).toMatch(/BUILD/);
    expect(h).toMatch(/DRAFT/);
    expect(h).toMatch(/INTEGRATE/);
    expect(h).toMatch(/refused by design/);
    expect(h).not.toMatch(/—/);
  });

  it("groups by department without dropping anything", () => {
    const grouped = deliverablesByDepartment();
    expect(grouped.reduce((a, g) => a + g.categories.length, 0)).toBe(DELIVERABLES.length);
  });
});
