import { describe, it, expect } from "vitest";
import { architectKnowledge, ARCHITECT_INVARIANTS } from "./architect-knowledge";
import { fullstackPromptFile } from "./fullstack-build";

describe("Architect Knowledge (P0 — stand on the frontier)", () => {
  const block = architectKnowledge();

  it("states every load-bearing invariant (the doc can't silently drop one)", () => {
    // cite-or-abstain — the anti-hallucination core
    expect(block.toLowerCase()).toContain("cite");
    expect(block.toLowerCase()).toContain("abstain");
    expect(block.toLowerCase()).toContain("never invent");
    // tenant isolation + deny-by-default
    expect(block.toLowerCase()).toContain("isolation");
    expect(block.toLowerCase()).toContain("deny-by-default");
    expect(block.toLowerCase()).toContain("service-role key");
    // verify before done
    expect(block.toLowerCase()).toContain("verify before done");
    // adopt don't invent
    expect(block.toLowerCase()).toContain("adopt");
    // input discipline — fail closed
    expect(block.toLowerCase()).toContain("fail closed");
  });

  it("exposes stable invariant keys for higher rungs to reference", () => {
    expect(ARCHITECT_INVARIANTS.citeOrAbstain).toBe("cite-or-abstain");
    expect(ARCHITECT_INVARIANTS.tenantIsolation).toBe("tenant-isolation");
    expect(Object.keys(ARCHITECT_INVARIANTS)).toHaveLength(5);
  });

  it("is injected into every build brief, ahead of the product goal", () => {
    const brief = fullstackPromptFile("a habit tracker with streaks");
    expect(brief).toContain(block); // the whole knowledge block is present
    // and it comes BEFORE the product description, so it frames the whole build
    expect(brief.indexOf(block)).toBeLessThan(brief.indexOf("a habit tracker with streaks"));
  });

  it("stays compact — high-signal, not a wall of text that degrades one-shot builds", () => {
    expect(block.length).toBeLessThan(1600);
  });
});
