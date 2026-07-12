import { describe, it, expect } from "vitest";
import { deliberate } from "./deliberate";

describe("deliberate — the structured, governed deliberation seed", () => {
  it("convenes a real panel with the chair first and a stance per participant", () => {
    const d = deliberate("ship the new onboarding flow");
    expect(d.participants.length).toBeGreaterThanOrEqual(2);
    expect(d.positions.length).toBe(d.participants.length);
    expect(d.decidedBy).toBe(d.participants[0]); // chair decides
    for (const p of d.positions) expect(p.stance.length).toBeGreaterThan(0); // grounded in a real mandate
  });

  it("escalates a high-consequence (money) task to the founder", () => {
    const d = deliberate("launch a paid ads campaign for $2000");
    expect(d.decision).toBe("escalate-to-founder");
    expect(d.rationale).toMatch(/founder/i);
  });

  it("proceeds on ordinary, reversible work", () => {
    expect(deliberate("write documentation for the API").decision).toBe("proceed");
  });

  it("is deterministic (same task → same record)", () => {
    expect(deliberate("improve retention")).toEqual(deliberate("improve retention"));
  });

  it("is honestly flagged simulated until real model debate is wired", () => {
    expect(deliberate("anything").simulated).toBe(true);
  });
});
