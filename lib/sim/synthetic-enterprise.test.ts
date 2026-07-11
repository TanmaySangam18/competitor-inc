import { describe, it, expect } from "vitest";
import { generateEnterprise, corpusStats } from "./synthetic-enterprise";

describe("Synthetic Enterprise — a fake world that is internally real (SIM)", () => {
  it("is deterministic: same seed + opts ⇒ byte-identical corpus", () => {
    const a = generateEnterprise("acme", { people: 40, years: 30, artifactsPerYear: 20 });
    const b = generateEnterprise("acme", { people: 40, years: 30, artifactsPerYear: 20 });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("different seeds ⇒ different companies (not a fixed template)", () => {
    const a = generateEnterprise("acme");
    const b = generateEnterprise("globex");
    expect(a.company.name + a.people[0].name).not.toEqual(b.company.name + b.people[0].name);
  });

  it("THE WALL: every corpus is simulated:true — literal, never a real tenant", () => {
    const e = generateEnterprise("wall");
    expect(e.simulated).toBe(true);
    expect(corpusStats(e).simulated).toBe(true);
  });

  it("referential integrity holds across the whole history (the point of 'every inch real')", () => {
    const e = generateEnterprise("integrity", { people: 50, years: 30, artifactsPerYear: 60 });
    const s = corpusStats(e);
    expect(s.integrityOk).toBe(true); // every author resolves, every createdAt after hire + before now, refs resolve
    expect(s.spanYears).toBe(30);
    expect(s.artifacts).toBe(30 * 60);
    // chronological order preserved
    for (let i = 1; i < e.artifacts.length; i++) expect(e.artifacts[i].createdAt).toBeGreaterThanOrEqual(e.artifacts[i - 1].createdAt);
  });

  it("scales: a large corpus stays consistent (the crash-test dummy grows)", () => {
    const e = generateEnterprise("scale", { people: 2000, years: 30, artifactsPerYear: 1000 });
    const s = corpusStats(e);
    expect(e.people).toHaveLength(2000);
    expect(s.artifacts).toBe(30_000);
    expect(s.integrityOk).toBe(true);
    // all four kinds present in a corpus this size
    expect(s.byKind.document).toBeGreaterThan(0);
    expect(s.byKind.ticket).toBeGreaterThan(0);
    expect(s.byKind.commit).toBeGreaterThan(0);
    expect(s.byKind.email).toBeGreaterThan(0);
  });

  it("no wall-clock leak: a bare generate() uses the fixed epoch, not Date.now()", () => {
    const e = generateEnterprise("clock");
    expect(e.company.now).toBe(Date.UTC(2026, 0, 1));
    expect(e.company.foundedAt).toBeLessThan(e.company.now);
  });
});
