import { describe, it, expect } from "vitest";
import { runOperatingLoop } from "./operating-loop";
import type { ExecuteFn } from "./supervisor";

let n = 0;
const base = () => ({ modelForRole: (r: string) => `m-${r}`, makeId: () => `i${++n}`, now: () => 0 });

describe("operating-loop (long-horizon v1)", () => {
  it("runs N cycles and carries memory forward into later cycles", async () => {
    const seenGoals: string[] = [];
    const execute: ExecuteFn = (_i, task) => {
      seenGoals.push(task.goal);
      return { ok: true, spentCents: 0, proof: { kind: "metric", value: "x" }, verifierRole: "growth" };
    };
    const res = await runOperatingLoop("a habit tracker", { ...base(), execute, cycles: 2 });
    expect(res.cycles).toHaveLength(2);
    expect(res.memory).toHaveLength(2);
    // cycle 2's goals were seeded with the prior cycle's summary → continuity
    expect(seenGoals.some((g) => g.includes("[prior cycles:"))).toBe(true);
  });

  it("self-heals: retries a cycle that left failures (bounded)", async () => {
    let calls = 0;
    const execute: ExecuteFn = () => {
      calls++;
      if (calls === 1) return { ok: false, spentCents: 0 }; // first task fails → downstream skipped
      return { ok: true, spentCents: 0, proof: { kind: "metric", value: "x" }, verifierRole: "growth" };
    };
    const res = await runOperatingLoop("x", { ...base(), execute, cycles: 1, maxRetries: 1 });
    expect(res.totalFailed).toBe(0); // the retry healed the cycle
    expect(res.totalCompleted).toBeGreaterThan(0);
  });

  it("aggregates the default simulated org across cycles (drafts land on the desk)", async () => {
    const res = await runOperatingLoop("x", { ...base(), cycles: 2, operate: true });
    expect(res.cycles).toHaveLength(2);
    expect(res.deskItems).toBeGreaterThan(0); // launch spend + GTM/support drafts each cycle
    expect(res.refundedCents).toBeGreaterThan(0);
  });
});
