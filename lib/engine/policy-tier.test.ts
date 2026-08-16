import { describe, it, expect } from "vitest";
import { scoreTier, tierToVerdict, governedDecision, type ActionContext } from "@/lib/core/policy";

const ctx = (over: Partial<ActionContext>): ActionContext => ({ type: "build", agent: "engineering", ...over });

describe("A2 · the T0–T3 risk scorer", () => {
  it("cheap reversible engineering is low tier (T1)", () => {
    expect(scoreTier(ctx({ type: "build", reversible: true })).tier).toBe("T1");
  });

  it("always-T3 classes are T3 no matter how cheap (deploy, delete, payments, public posts)", () => {
    for (const type of ["deploy", "delete", "payments", "bluesky", "mastodon"]) {
      expect(scoreTier(ctx({ type })).tier).toBe("T3");
    }
  });

  it("spend tiers by dollar amount, T3 at/above the sign-off line", () => {
    expect(scoreTier(ctx({ type: "spend", agent: "marketing", amountUsd: 0 })).tier).toBe("T0");
    expect(scoreTier(ctx({ type: "spend", agent: "marketing", amountUsd: 25 })).tier).toBe("T1");
    expect(scoreTier(ctx({ type: "spend", agent: "marketing", amountUsd: 120 })).tier).toBe("T2"); // over per-tx cap
    expect(scoreTier(ctx({ type: "spend", agent: "marketing", amountUsd: 500 })).tier).toBe("T3");
  });

  it("default-DENY: a novel/unknown action never scores below T2", () => {
    const s = scoreTier(ctx({ type: "frobnicate_the_widget" }));
    expect(s.tier).toBe("T2");
    expect(s.reason).toMatch(/novel|default-deny/i);
  });

  it("irreversible raises an otherwise-low action to at least T2", () => {
    expect(scoreTier(ctx({ type: "build", reversible: false })).tier).toBe("T2");
  });

  it("tierToVerdict maps T0/T1→AUTO, T2→QUEUE, T3→BLOCK", () => {
    expect(tierToVerdict("T0")).toBe("AUTO");
    expect(tierToVerdict("T1")).toBe("AUTO");
    expect(tierToVerdict("T2")).toBe("QUEUE");
    expect(tierToVerdict("T3")).toBe("BLOCK");
  });

  it("governedDecision takes the STRICTER of policy and tier (scorer only tightens)", () => {
    // build is APPROVE in the matrix → decide QUEUE; tier T1 → AUTO; stricter = QUEUE.
    const g = governedDecision(ctx({ type: "build", agent: "engineering" }));
    expect(g.verdict).toBe("QUEUE");
    expect(g.tier).toBe("T1");
    // payments by ceo is APPROVE → QUEUE; tier T3 → BLOCK; stricter = BLOCK.
    const p = governedDecision(ctx({ type: "payments", agent: "ceo" }));
    expect(p.verdict).toBe("BLOCK");
    expect(p.tier).toBe("T3");
  });
});
