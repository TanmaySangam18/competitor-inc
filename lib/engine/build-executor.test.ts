import { describe, it, expect } from "vitest";
import { makeBuildExecute } from "./build-executor";
import { spawnInstance } from "./agent-lifecycle";
import { runSupervisedGoal } from "./orchestrator";
import type { AgentTask } from "./task-queue";

const inst = () => spawnInstance({ id: "i", taskId: "build", role: "engineering", model: "m", budgetCents: 5000, now: 0 });
const buildTask: AgentTask = { id: "build", goal: "a PM-tools app", role: "engineering", blockingOn: [], priority: 4 };

describe("build-executor", () => {
  it("produces a verified live-URL proof for a build task", async () => {
    const exec = makeBuildExecute({ build: async () => ({ url: "https://built.example/app", spentCents: 500 }), verifyUrl: () => true });
    const r = await exec(inst(), buildTask);
    expect(r.ok).toBe(true);
    expect(r.proof).toEqual({ kind: "url", value: "https://built.example/app" });
    expect(r.verifierRole).toBe("support"); // independent of the engineering builder
    expect(r.spentCents).toBe(500);
  });

  it("fails honestly when a build can't be verified (no fake proof)", async () => {
    const exec = makeBuildExecute({ build: async () => ({ url: "https://built.example/app" }), verifyUrl: () => false });
    const r = await exec(inst(), buildTask);
    expect(r.ok).toBe(false);
    expect(r.proof).toBeUndefined();
  });

  it("degrades to the simulated path when no real builder is available", async () => {
    const exec = makeBuildExecute({ build: async () => null });
    const r = await exec(inst(), buildTask);
    expect(r.ok).toBe(true);
    expect(r.proof?.kind).toBe("metric"); // honest simulated fallback, not a faked URL
  });

  it("plugs into the supervisor: a real build makes the whole goal complete", async () => {
    let n = 0;
    const out = await runSupervisedGoal("a PM-tools aggregator", {
      modelForRole: (r) => `m-${r}`,
      makeId: () => `i${++n}`,
      now: () => 0,
      execute: makeBuildExecute({ build: async () => ({ url: "https://built.example/app", spentCents: 500 }), verifyUrl: () => true }),
    });
    expect(out.completed.sort()).toEqual(["build", "launch", "plan", "verify"]);
    expect(out.failed).toEqual([]);
  });
});
