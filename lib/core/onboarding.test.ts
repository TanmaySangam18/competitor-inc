import { describe, it, expect } from "vitest";
import { SETUP_RECIPES, recipeFor, onboardingPlan, stepReport, type HardStop } from "./onboarding";
import { CONNECTION_MAP } from "./connections";

const VALID_STOPS: HardStop[] = ["account-create","accept-terms","authenticate","captcha","grant-consent","pay"];

describe("onboarding co-pilot plan (ADR-0017)", () => {
  it("every recipe step is well-formed; human steps carry a valid hard-stop, agent steps never do", () => {
    for (const r of SETUP_RECIPES) for (const s of r.steps) {
      expect(s.label.length).toBeGreaterThan(0);
      if (s.actor === "human") expect(VALID_STOPS).toContain(s.hardStop);
      else expect(s.hardStop).toBeUndefined();
    }
  });

  it("agent steps NEVER pre-fill a secret (only names, scopes, redirect URLs, copy hints)", () => {
    const banned = /secret|password|token:\s*\S|key:\s*sk-|xoxb/i;
    for (const r of SETUP_RECIPES) for (const s of r.steps) {
      for (const p of s.prefill ?? []) expect(p).not.toMatch(banned);
    }
  });

  it("the money/bank step is a HUMAN 'pay' hard-stop — the agent never touches it", () => {
    const stripe = SETUP_RECIPES.find((r) => r.connectionId === "payments")!;
    const bank = stripe.steps.find((s) => s.hardStop === "pay");
    expect(bank).toBeTruthy();
    expect(bank!.actor).toBe("human");
  });

  it("recipeFor falls back honestly for any unmapped customer connection", () => {
    const unmapped = CONNECTION_MAP.find((c) => c.owner === "customer" && !SETUP_RECIPES.some((r) => r.connectionId === c.id))!;
    const r = recipeFor(unmapped);
    expect(r.steps.some((s) => s.actor === "human")).toBe(true);
    expect(r.steps.some((s) => s.actor === "agent")).toBe(true);
  });

  it("onboardingPlan skips connected services and counts agent work vs human taps", () => {
    const none = onboardingPlan(new Set());
    expect(none.remaining).toBe(none.total);
    // The co-pilot does at least as much as it asks of you, and — the load-bearing invariant — EVERY
    // human tap is an irreducible hard-stop (nothing the agent could legally/safely have done itself).
    expect(none.agentSteps).toBeGreaterThanOrEqual(none.humanStops);
    const humanTaps = none.services.flatMap((s) => s.steps).filter((s) => s.actor === "human");
    expect(humanTaps.every((s) => Boolean(s.hardStop))).toBe(true);
    const someDone = onboardingPlan(new Set(["github", "ai-model"]));
    expect(someDone.remaining).toBe(none.total - 2);
    expect(someDone.services.find((s) => s.connectionId === "github")!.done).toBe(true);
  });

  it("stepReport phrases human waits with the hard-stop reason and agent steps as progress", () => {
    expect(stepReport("GitHub", { actor: "human", label: "Click Generate", hardStop: "authenticate" })).toContain("waiting on you");
    expect(stepReport("GitHub", { actor: "human", label: "Click Generate", hardStop: "authenticate" })).toContain("authenticate");
    expect(stepReport("GitHub", { actor: "agent", label: "Open token page", prefill: ["scopes: repo"] })).toContain("pre-filled");
  });
});
