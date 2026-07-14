import { describe, it, expect } from "vitest";
import { PrecedentStore, normalizeQuestion } from "./precedent";
import { canVerify, assignReviewer, sharesLineage, requiresRegression } from "./separation";

describe("C4 · precedent store (the same question never asked twice)", () => {
  it("records a ruling and answers a re-phrasing of the same question without escalating", () => {
    const store = new PrecedentStore();
    store.record({ question: "Can we refund under $50 without approval?", ruling: "yes, up to $50" });
    const hit = store.consult("can we REFUND under $50 without approval");
    expect(hit.found).toBe(true);
    expect(hit.precedent?.ruling).toBe("yes, up to $50");
  });

  it("a genuinely novel question still escalates (miss)", () => {
    const store = new PrecedentStore();
    store.record({ question: "refund policy?", ruling: "up to $50" });
    expect(store.consult("can we sign a 2-year contract?").found).toBe(false);
  });

  it("scopes rulings per tenant (no cross-customer leak)", () => {
    const store = new PrecedentStore();
    store.record({ question: "allow overage?", ruling: "yes", scope: "acme" });
    expect(store.consult("allow overage?", "acme").found).toBe(true);
    expect(store.consult("allow overage?", "beta").found).toBe(false);
  });

  it("re-ruling updates in place, does not duplicate", () => {
    const store = new PrecedentStore();
    store.record({ question: "x?", ruling: "no" });
    store.record({ question: "x?", ruling: "yes" });
    expect(store.size).toBe(1);
    expect(store.consult("x?").precedent?.ruling).toBe("yes");
  });

  it("normalizes punctuation/case/whitespace", () => {
    expect(normalizeQuestion("Can WE  do X??")).toBe("can we do x");
  });
});

describe("C3 · verification separation (never verify your own lineage)", () => {
  const lineage = ["backend-engineer", "engineering-lead"]; // who authored the work

  it("an author (or their manager) cannot verify their own work", () => {
    expect(canVerify("backend-engineer", lineage)).toBe(false);
    expect(canVerify("engineering-lead", lineage)).toBe(false);
  });

  it("an independent reviewer can", () => {
    expect(canVerify("code-reviewer", lineage)).toBe(true);
  });

  it("assignReviewer skips the lineage and picks an independent one; null if none", () => {
    expect(assignReviewer(["engineering-lead", "code-reviewer"], lineage)).toBe("code-reviewer");
    expect(assignReviewer(["backend-engineer", "engineering-lead"], lineage)).toBeNull();
  });

  it("sharesLineage detects overlap", () => {
    expect(sharesLineage(["a", "b"], ["b", "c"])).toBe(true);
    expect(sharesLineage(["a"], ["c"])).toBe(false);
  });

  it("prompt + model changes require a regression run; docs do not", () => {
    expect(requiresRegression("prompt")).toBe(true);
    expect(requiresRegression("model")).toBe(true);
    expect(requiresRegression("docs")).toBe(false);
  });
});
