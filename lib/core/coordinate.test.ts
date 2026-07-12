import { describe, it, expect } from "vitest";
import { coordinate } from "./coordinate";
import type { Reasoner } from "./deliberate";

describe("coordinate — the closed nervous-system loop (goal → plan → govern each task)", () => {
  it("plans a goal and returns one governed decision per task", async () => {
    const c = await coordinate("a booking tool for a dog groomer");
    expect(c.plan.tasks.length).toBeGreaterThan(0);
    expect(c.decisions.length).toBe(c.plan.tasks.length);
    expect(c.summary.tasks).toBe(c.plan.tasks.length);
    expect(c.summary.proceed + c.summary.escalate).toBe(c.plan.tasks.length);
  });

  it("is deterministic and flagged simulated with no reasoner", async () => {
    expect(await coordinate("improve retention")).toEqual(await coordinate("improve retention"));
    expect((await coordinate("x")).summary.simulated).toBe(true);
  });

  it("drops the simulated flag when a real reasoner is supplied", async () => {
    const fake: Reasoner = ({ title }) => `${title} weighs in`;
    expect((await coordinate("ship it", { reasoner: fake })).summary.simulated).toBe(false);
  });
});
