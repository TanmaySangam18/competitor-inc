import { describe, it, expect } from "vitest";
import {
  tenantTable, scopedFunctionPath, tenantsIsolated, rlsPolicyFor, validateBackendSpec,
  emptyMemory, recordEpisode, consolidate, composeContext,
  type BackendSpec, type OperatorMemory,
} from "./backend";

const A = { companyId: "co-a" };
const B = { companyId: "co-b" };

describe("tenant isolation — the Governed promise at the data layer", () => {
  it("scopes table + function names per tenant", () => {
    expect(tenantTable(A, "flashcard deck")).toMatch(/^t_[0-9a-f]{8}_flashcard_deck$/);
    expect(scopedFunctionPath(A, "generate cards")).toMatch(/^\/api\/app\/[0-9a-f]{8}\/generate_cards$/);
  });
  it("two tenants never collide on any entity", () => {
    expect(tenantsIsolated(A, B, ["profile", "deck", "card"])).toBe(true);
  });
  it("is not isolated against itself (guard catches a namespace bug)", () => {
    expect(tenantsIsolated(A, A, ["profile"])).toBe(false);
  });
  it("degrades safely with no tenant identity (offline parity)", () => {
    expect(tenantTable({}, "deck")).toBe("t_deck");
    expect(tenantsIsolated({}, B, ["deck"])).toBe(false);
  });
});

describe("RLS policy generation", () => {
  it("user-owned table locks rows to auth.uid()", () => {
    const p = rlsPolicyFor("t_x_deck", true);
    expect(p).toContain("enable row level security");
    expect(p).toContain("user_id = auth.uid()");
  });
  it("tenant-global table is read-only to authenticated users", () => {
    expect(rlsPolicyFor("t_x_config", false)).toContain("for select using (auth.role() = 'authenticated')");
  });
});

describe("validateBackendSpec — guard before provisioning", () => {
  const base: BackendSpec = { auth: true, entities: [{ name: "deck", columns: [{ name: "title", type: "text" }], ownedByUser: true }], functions: [] };
  it("passes a sane spec", () => expect(validateBackendSpec(base).ok).toBe(true));
  it("rejects a user-owned entity when auth is off", () => {
    expect(validateBackendSpec({ ...base, auth: false }).ok).toBe(false);
  });
  it("rejects an authed function when auth is off", () => {
    const s: BackendSpec = { auth: false, entities: [], functions: [{ name: "f", purpose: "p", needsAuth: true }] };
    expect(validateBackendSpec(s).ok).toBe(false);
  });
  it("caps entity count (keep the MVP tight)", () => {
    const many = { ...base, entities: Array.from({ length: 13 }, (_, i) => ({ name: `e${i}`, columns: [], ownedByUser: false })) };
    expect(validateBackendSpec(many).ok).toBe(false);
  });
});

describe("Felix Operator — 3-layer memory that gets wiser, not just bigger", () => {
  it("episodic log is bounded to the recency window", () => {
    let m: OperatorMemory = emptyMemory();
    for (let i = 0; i < 60; i++) m = recordEpisode(m, { night: i, role: "support", summary: `e${i}` });
    expect(m.episodic.length).toBe(40);
    expect(m.episodic[0].night).toBe(20); // oldest 20 dropped
  });
  it("consolidation promotes a repeated lesson and raises confidence (the unlock)", () => {
    let m = emptyMemory();
    m = consolidate(m, "best_channel", "community");
    const first = m.semantic.find((f) => f.key === "best_channel")!;
    expect(first.hits).toBe(1);
    m = consolidate(m, "best_channel", "community");
    m = consolidate(m, "best_channel", "community");
    const after = m.semantic.find((f) => f.key === "best_channel")!;
    expect(after.hits).toBe(3);
    expect(after.confidence).toBeGreaterThan(first.confidence);
  });
  it("composeContext is role-filtered, high-confidence-first, and budget-bounded", () => {
    let m = emptyMemory();
    m = consolidate(m, "refund_policy", "14 days");
    m.procedural = [{ skill: "answer refunds kindly", when: "support" }, { skill: "cold email", when: "sales" }];
    m = recordEpisode(m, { night: 3, role: "support", summary: "resolved a login issue" });
    m = recordEpisode(m, { night: 3, role: "sales", summary: "sent 2 intros" });
    const ctx = composeContext(m, "support");
    expect(ctx).toContain("refund_policy");
    expect(ctx).toContain("answer refunds kindly");
    expect(ctx).not.toContain("cold email"); // sales skill filtered out for the support role
    expect(ctx).toContain("resolved a login issue");
  });
});
