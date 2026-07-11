import { describe, it, expect } from "vitest";
import {
  emptyMemory,
  architectureDoc,
  adrDoc,
  nextAdrSeq,
  recallBrief,
  type ProductMemory,
} from "./product-memory";

const NOW = Date.UTC(2026, 6, 11);

describe("Product Memory (P1 — the compounding unlock)", () => {
  it("architecture doc captures the goal + the standing invariants, at seq 0", () => {
    const doc = architectureDoc("inventory-copilot", "an inventory tool with an assistant", NOW);
    expect(doc.kind).toBe("architecture");
    expect(doc.seq).toBe(0);
    expect(doc.body).toContain("an inventory tool with an assistant");
    expect(doc.body.toLowerCase()).toContain("cite-or-abstain"); // invariants embedded
  });

  it("ADRs are 1-indexed, chronological, and never renumbered", () => {
    let mem = emptyMemory("p");
    expect(nextAdrSeq(mem)).toBe(1);
    mem = { ...mem, docs: [adrDoc(1, "Use Supabase for persistence", { context: "c", decision: "Adopt Supabase with RLS", consequences: "k" }, NOW)] };
    expect(nextAdrSeq(mem)).toBe(2);
    const a2 = adrDoc(nextAdrSeq(mem), "Add credits metering later", { context: "c", decision: "Defer metering", consequences: "k" }, NOW);
    expect(a2.seq).toBe(2);
    expect(a2.body).toContain("# ADR-2: Add credits metering later");
    expect(a2.body).toContain("## Decision");
  });

  it("recall is EMPTY when there's nothing on record yet (a first build starts fresh)", () => {
    expect(recallBrief(emptyMemory("p"))).toBe("");
  });

  it("recall tells the agent it is CONTINUING the product and lists decisions, newest first", () => {
    const mem: ProductMemory = {
      product: "helpdesk-copilot",
      docs: [
        architectureDoc("helpdesk-copilot", "a helpdesk that answers from my tickets", NOW),
        adrDoc(1, "Ground answers on stored tickets", { context: "c", decision: "Retrieve then answer, cite ticket ids", consequences: "k" }, NOW),
        adrDoc(2, "Abstain when no ticket matches", { context: "c", decision: "Return an explicit no-record answer", consequences: "k" }, NOW),
      ],
    };
    const brief = recallBrief(mem);
    expect(brief).toContain("CONTINUING an existing product");
    expect(brief).toContain("helpdesk-copilot");
    expect(brief).toContain("a helpdesk that answers from my tickets");
    // newest ADR first
    expect(brief.indexOf("ADR-2")).toBeLessThan(brief.indexOf("ADR-1"));
    expect(brief).toContain("ADR-1: Ground answers on stored tickets — Retrieve then answer, cite ticket ids");
    // the invariants block is NOT duplicated into recall (it's injected separately)
    expect(brief).not.toContain("Standing invariants");
  });

  it("recall stays bounded even with a long decision history (won't blow the build brief)", () => {
    const docs = [architectureDoc("p", "a big product", NOW)];
    for (let i = 1; i <= 40; i++) docs.push(adrDoc(i, `Decision number ${i} with a fairly long descriptive title`, { context: "context ".repeat(20), decision: "decide ".repeat(20), consequences: "x" }, NOW));
    const brief = recallBrief({ product: "p", docs });
    expect(brief.length).toBeLessThanOrEqual(2600);
  });

  it("is deterministic — same inputs ⇒ identical doc", () => {
    expect(architectureDoc("p", "g", NOW)).toEqual(architectureDoc("p", "g", NOW));
    expect(adrDoc(1, "t", { context: "a", decision: "b", consequences: "c" }, NOW)).toEqual(
      adrDoc(1, "t", { context: "a", decision: "b", consequences: "c" }, NOW),
    );
  });
});
