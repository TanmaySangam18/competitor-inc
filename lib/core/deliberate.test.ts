import { describe, it, expect } from "vitest";
import { deliberate, hasModelKey, type Reasoner } from "./deliberate";

describe("deliberate — the structured, governed deliberation seed", () => {
  it("convenes a real panel with the chair first and a stance per participant", async () => {
    const d = await deliberate("ship the new onboarding flow");
    expect(d.participants.length).toBeGreaterThanOrEqual(2);
    expect(d.positions.length).toBe(d.participants.length);
    expect(d.decidedBy).toBe(d.participants[0]); // chair decides
    for (const p of d.positions) expect(p.stance.length).toBeGreaterThan(0); // grounded in a real mandate
  });

  it("escalates a high-consequence (money) task to the founder", async () => {
    const d = await deliberate("launch a paid ads campaign for $2000");
    expect(d.decision).toBe("escalate-to-founder");
    expect(d.rationale).toMatch(/founder/i);
  });

  it("proceeds on ordinary, reversible work", async () => {
    expect((await deliberate("write documentation for the API")).decision).toBe("proceed");
  });

  it("is deterministic (same task → same record)", async () => {
    expect(await deliberate("improve retention")).toEqual(await deliberate("improve retention"));
  });

  it("is flagged simulated with the default (mandate-derived) reasoner", async () => {
    expect((await deliberate("anything")).simulated).toBe(true);
  });

  it("uses an injected reasoner and drops the simulated flag (the real-reasoning seam)", async () => {
    const fake: Reasoner = ({ title, task }) => `${title} reasons about "${task}"`;
    const d = await deliberate("improve retention", { reasoner: fake });
    expect(d.simulated).toBe(false); // real reasoner supplied → not simulated
    expect(d.positions[0].stance).toContain(`reasons about "improve retention"`);
  });

  it("gates the real model on a key being present (hasModelKey)", () => {
    const priorModel = process.env.MODEL_API_KEY;
    const priorAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.MODEL_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(hasModelKey()).toBe(false); // no key → honest simulated default
    process.env.MODEL_API_KEY = "test-key";
    expect(hasModelKey()).toBe(true); // key present → real reasoning auto-selected
    if (priorModel === undefined) delete process.env.MODEL_API_KEY;
    else process.env.MODEL_API_KEY = priorModel;
    if (priorAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = priorAnthropic;
  });
});
