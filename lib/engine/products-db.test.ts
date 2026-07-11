import { describe, it, expect } from "vitest";
import { rowToProduct } from "./products-db";

describe("products registry (c) — owner always, company optional", () => {
  it("maps a full row, including an optional company", () => {
    const p = rowToProduct({
      id: "p1",
      product: "support-desk",
      repo: "octo/support-desk-abc",
      company_id: "co1",
      founding_goal: "a support desk with grounded answers",
      created_at: "2026-07-11T00:00:00Z",
    });
    expect(p).toMatchObject({ id: "p1", product: "support-desk", repo: "octo/support-desk-abc", companyId: "co1", foundingGoal: "a support desk with grounded answers" });
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it("a founder raw-build attaches to the owner with NO company (the (c) case)", () => {
    const p = rowToProduct({ id: "p2", product: "tracker", repo: "octo/tracker-xy", company_id: null, founding_goal: "" });
    expect(p.companyId).toBeNull(); // company optional — the product still has an owner
    expect(p.repo).toBe("octo/tracker-xy");
  });

  it("coerces garbage to safe defaults (never throws mid-request)", () => {
    const p = rowToProduct({});
    expect(p).toEqual({ id: "", product: "", repo: null, companyId: null, foundingGoal: "", createdAt: 0 });
  });
});
