import { describe, it, expect } from "vitest";
import { generateEnterprise } from "./synthetic-enterprise";
import {
  indexEnterprises,
  retrieve,
  retrieveUnscoped,
  groundedAnswer,
  proveGround,
} from "./proving-ground";

const OPTS = { people: 40, years: 30, artifactsPerYear: 40 };

describe("Synthetic Proving Ground — the capability crash-test (P0.5)", () => {
  it("THE WALL: every report + answer is simulated:true (never a real receipt)", () => {
    const idx = indexEnterprises([generateEnterprise("wall", OPTS)]);
    expect(idx.simulated).toBe(true);
    expect(groundedAnswer(idx, { tenant: "wall", query: "anything" }).simulated).toBe(true);
    expect(proveGround(["wall"], OPTS).simulated).toBe(true);
  });

  it("is deterministic: same seeds ⇒ identical verdict", () => {
    const a = proveGround(["acme", "globex", "initech"], OPTS);
    const b = proveGround(["acme", "globex", "initech"], OPTS);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("GROUNDING: an answer cites only real artifacts belonging to the asking tenant", () => {
    const e = generateEnterprise("ground", OPTS);
    const idx = indexEnterprises([e]);
    const ids = new Set(e.artifacts.map((a) => a.id));
    // "billing"/"auth"/etc. are seeded {d} tokens — one of them is present; use a term we know exists
    const ans = groundedAnswer(idx, { tenant: "ground", query: "billing auth search onboarding" });
    expect(ans.abstained).toBe(false);
    expect(ans.citations.length).toBeGreaterThan(0);
    for (const c of ans.citations) {
      expect(c.tenantSeed).toBe("ground"); // never another tenant
      expect(ids.has(c.artifactId)).toBe(true); // never an invented citation
      // the answer text references every citation id it makes a claim about (no unbacked claims)
      expect(ans.answer).toContain(`[${c.artifactId}]`);
    }
  });

  it("ISOLATION (the RLS analog): a tenant query never surfaces another tenant's artifacts", () => {
    const a = generateEnterprise("tenant-a", OPTS);
    const b = generateEnterprise("tenant-b", OPTS);
    const idx = indexEnterprises([a, b]);
    // every hit scoped to A is A's; every hit scoped to B is B's — for many common terms
    for (const term of ["billing", "auth", "search", "export", "onboarding", "latency", "roadmap"]) {
      for (const [tenant] of [["tenant-a"], ["tenant-b"]] as const) {
        const hits = retrieve(idx, { tenant, query: term, k: 50 });
        for (const h of hits) expect(h.tenantSeed).toBe(tenant);
      }
    }
  });

  it("ISOLATION is non-vacuous: the unscoped control proves the term matches BOTH tenants", () => {
    const a = generateEnterprise("iso-a", { ...OPTS, artifactsPerYear: 80 });
    const b = generateEnterprise("iso-b", { ...OPTS, artifactsPerYear: 80 });
    const idx = indexEnterprises([a, b]);
    // "onboarding" is a high-frequency seeded token → present in both at this volume
    const raw = retrieveUnscoped(idx, "onboarding", 100);
    expect(raw.some((h) => h.tenantSeed === "iso-a")).toBe(true);
    expect(raw.some((h) => h.tenantSeed === "iso-b")).toBe(true);
    // yet scoped retrieval strips the other tenant entirely
    const scoped = retrieve(idx, { tenant: "iso-a", query: "onboarding", k: 100 });
    expect(scoped.every((h) => h.tenantSeed === "iso-a")).toBe(true);
    expect(scoped.length).toBeGreaterThan(0);
  });

  it("ABSTENTION: a no-evidence query says 'I don't know' — never hallucinates a citation", () => {
    const idx = indexEnterprises([generateEnterprise("abstain", OPTS)]);
    const ans = groundedAnswer(idx, { tenant: "abstain", query: "zylophonic quibbleflux unobtanium" });
    expect(ans.abstained).toBe(true);
    expect(ans.citations).toHaveLength(0);
    expect(ans.answer.toLowerCase()).toContain("no supporting evidence");
  });

  it("THE VERDICT: the full battery passes across a fleet of synthetic tenants", () => {
    const report = proveGround(["acme", "globex", "initech", "umbrella", "hooli"], OPTS);
    expect(report.checks.grounding.passed).toBe(report.checks.grounding.total);
    expect(report.checks.isolation.passed).toBe(report.checks.isolation.total);
    expect(report.checks.abstention.passed).toBe(report.checks.abstention.total);
    expect(report.checks.isolation.total).toBeGreaterThan(0); // pairs were actually exercised
    expect(report.passed).toBe(true);
  });
});
