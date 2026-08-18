import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { WORK, coverageReport, byDepartment, canRunACompanyAlone } from "./coverage";
import { FLOOR } from "@/lib/core/hard-stops";

describe("every coverage claim is checkable", () => {
  it("names a real file for everything claimed automated or assisted", () => {
    // THE test that keeps this ledger honest. A claim of "automated" that points at a module which does
    // not exist is worse than admitting a gap, because it hides the gap behind a filename.
    const missing: string[] = [];
    for (const w of WORK) {
      if (w.coverage !== "automated" && w.coverage !== "assisted") continue;
      const paths = w.evidence.match(/\b(?:lib|app|scripts|supabase|docs)\/[A-Za-z0-9._/-]+/g) ?? [];
      for (const p of paths) {
        const base = p.replace(/[.,;]$/, "");
        if (!existsSync(base) && !existsSync(`${base}.ts`)) missing.push(`${w.id} -> ${base}`);
      }
    }
    expect(missing, `evidence points at files that do not exist: ${missing.join(", ")}`).toEqual([]);
  });

  it("never leaves an entry without evidence", () => {
    for (const w of WORK) {
      expect(w.evidence.trim().length, `${w.id} has no evidence`).toBeGreaterThan(25);
      expect(w.work.trim().length).toBeGreaterThan(10);
    }
  });

  it("has unique ids and no em-dashes in prose", () => {
    expect(new Set(WORK.map((w) => w.id)).size).toBe(WORK.length);
    for (const w of WORK) expect(`${w.work} ${w.evidence}`, w.id).not.toMatch(/—/);
  });
});

describe("human-only is a design choice, not a gap", () => {
  it("keeps every hard-stop represented as human-only work", () => {
    // If a hard-stop ever showed up as automated here, either the ledger is lying or the floor was broken.
    const humanOnly = WORK.filter((w) => w.coverage === "human_only");
    expect(humanOnly.length).toBeGreaterThanOrEqual(6);
    const joined = humanOnly.map((w) => w.evidence).join(" ");
    expect(joined).toMatch(/accept-terms/);
    expect(joined).toMatch(/pay/);
    expect(FLOOR).toHaveLength(6); // tripwire: the floor is untouched
  });

  it("excludes human-only work from the automatable denominator", () => {
    // Counting "sign the contract" as a shortfall would make the metric argue for destroying the product.
    const r = coverageReport();
    const automatable = r.total - r.humanOnly;
    expect(r.coverageOfAutomatableWork).toBeCloseTo(
      Math.round(((r.automated + r.assisted) / automatable) * 1000) / 10, 5);
    expect(r.coverageOfAutomatableWork).toBeGreaterThan(r.machineTouchedShare);
  });

  it("never claims signing, paying or answering a regulator is automated", () => {
    for (const id of ["sign-contract", "funds-out", "regulator", "hire-fire", "payroll-tax", "board-reporting"]) {
      const w = WORK.find((x) => x.id === id)!;
      expect(w.coverage, `${id} must stay human`).toBe("human_only");
    }
  });
});

describe("the gaps are named, not hidden", () => {
  it("lists the uncovered work rather than rounding it away", () => {
    const r = coverageReport();
    expect(r.uncovered).toBeGreaterThan(0); // an honest ledger of a real company has gaps
    expect(r.gaps).toHaveLength(r.uncovered);
  });

  it("names the gaps that actually block the goal", () => {
    const ids = coverageReport().gaps.map((g) => g.id);
    // Discovery blocks everything (no users). Invoicing blocks goal step 6. Calls block the sell step.
    expect(ids).toContain("discovery");
    expect(ids).toContain("invoicing");
    expect(ids).toContain("sales-calls");
    expect(ids).toContain("oncall");
  });

  it("counts every function exactly once", () => {
    const r = coverageReport();
    expect(r.automated + r.assisted + r.humanOnly + r.uncovered).toBe(r.total);
  });

  it("sorts departments by how much is missing, so the worst is first", () => {
    const d = byDepartment();
    for (let i = 1; i < d.length; i++) expect(d[i - 1].uncovered).toBeGreaterThanOrEqual(d[i].uncovered);
    expect(d.reduce((a, x) => a + x.total, 0)).toBe(WORK.length);
  });
});

describe("the blunt answer", () => {
  it("says no, and gives five checkable reasons", () => {
    // The founder asked a yes-or-no question. A hedge would have been a worse answer than a no.
    const a = canRunACompanyAlone();
    expect(a.answer).toBe(false);
    expect(a.because.length).toBeGreaterThanOrEqual(5);
    for (const r of a.because) expect(r.length).toBeGreaterThan(60);
  });

  it("grounds the refusal in measurements rather than opinion", () => {
    const joined = canRunACompanyAlone().because.join(" ");
    expect(joined).toMatch(/2h42m/);          // METR frontier
    expect(joined).toMatch(/forty shards|twenty of them/); // our own sharding measurement
    expect(joined).toMatch(/zero external users/i);        // the actual state
  });

  it("writes a headline that states all four buckets", () => {
    const h = coverageReport().headline;
    expect(h).toMatch(/run unattended/);
    expect(h).toMatch(/human by design/);
    expect(h).toMatch(/not built yet/);
    expect(h).not.toMatch(/—/);
  });
});
