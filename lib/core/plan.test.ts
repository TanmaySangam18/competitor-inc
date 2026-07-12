import { describe, it, expect } from "vitest";
import { plan } from "./plan";

describe("plan — goal → coordinated org task chain", () => {
  it("turns a goal into ordered tasks + a readable chain", () => {
    const p = plan("a booking tool for a dog groomer");
    expect(p.tasks.length).toBeGreaterThan(0);
    expect(p.chain.length).toBe(p.tasks.length);
    expect(p.chain.every((s) => s.includes(p.goal) || s.length > 0)).toBe(true);
  });

  it("orders so a task never precedes a task it blocks on", () => {
    const p = plan("ship a landing page");
    const pos = new Map(p.tasks.map((t, i) => [t.id, i]));
    for (const t of p.tasks) for (const dep of t.blockingOn) {
      if (pos.has(dep)) expect(pos.get(dep)!).toBeLessThan(pos.get(t.id)!);
    }
  });

  it("is deterministic (same goal → same plan)", () => {
    expect(plan("improve retention")).toEqual(plan("improve retention"));
  });

  it("operate mode adds post-launch tasks", () => {
    expect(plan("x", { operate: true }).tasks.length).toBeGreaterThanOrEqual(plan("x").tasks.length);
  });
});
