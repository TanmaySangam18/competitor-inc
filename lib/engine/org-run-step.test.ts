import { describe, it, expect, vi } from "vitest";
import type { Activity } from "./types";
import type { ExecuteFn, TaskResult } from "./supervisor";
import { advanceOrgRun, type AdvanceDeps } from "./org-run-step";
import { createOrgRun, isComplete, type OrgRun } from "./org-run";
import { preparePacket } from "./accountability-spine";

const ROLES = ["ceo", "engineering", "support", "marketing"] as const;

// A fake executor: plan hands a spec to build; build "ships"; launch prepares a gated desk act.
const fakeExecutor: ExecuteFn = async (_inst, task) => {
  const base: TaskResult = { ok: true, spentCents: 10, proof: { kind: "metric", value: `${task.id} done` } };
  if (task.id === "plan") return { ...base, handoffTo: "build", handoffContext: "SPEC" };
  if (task.id === "launch") return { ...base, gatedActs: [preparePacket({ id: "g1", kind: "move_money", title: "Fund launch", summary: "budget", preparedBy: "marketing", actionRequired: "approve the spend on your rail", now: 0 })] };
  return base;
};

function deps(over: Partial<AdvanceDeps> = {}): { deps: AdvanceDeps; saved: OrgRun[]; acts: Activity[] } {
  const saved: OrgRun[] = [];
  const acts: Activity[] = [];
  let n = 0;
  return {
    saved, acts,
    deps: {
      executor: fakeExecutor,
      saveRun: async (r) => { saved.push(JSON.parse(JSON.stringify(r))); },
      recordActivity: async (a) => { acts.push(a); },
      makeId: () => `id${++n}`,
      now: () => 0,
      ...over,
    },
  };
}

describe("durable step executor — advance one task, persist, resume", () => {
  it("runs the next task, records its proof, and saves state twice (claim + result)", async () => {
    const run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    const { deps: d, saved, acts } = deps();
    const { ranTaskId, run: after } = await advanceOrgRun(run, d);
    expect(ranTaskId).toBe("plan"); // first runnable
    expect(saved).toHaveLength(2); // claim (running) then result (done)
    expect(saved[0].tasks.find((t) => t.id === "plan")!.state).toBe("running");
    expect(after.tasks.find((t) => t.id === "plan")!.state).toBe("done");
    expect(acts.some((a) => a.action.includes("Plan") || a.action.includes("plan"))).toBe(true);
    expect(acts[0].proof).toEqual({ kind: "metric", value: "plan done" });
    // handoff context delivered to build
    expect(after.tasks.find((t) => t.id === "build")!.handoffContext).toBe("SPEC");
  });

  it("does nothing when no task is runnable (terminal run)", async () => {
    let run = createOrgRun("r1", "x", { roles: ["ceo"], now: 0 }); // single task: plan
    const { deps: d, acts } = deps();
    ({ run } = await advanceOrgRun(run, d)); // runs plan → done
    const { ranTaskId } = await advanceOrgRun(run, d); // nothing left
    expect(ranTaskId).toBeNull();
    expect(acts).toHaveLength(1);
  });

  it("gated acts become clearly-labeled NEEDS-YOU activities, never auto-executing approvals", async () => {
    // drive to launch
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    const { deps: d, acts } = deps();
    for (let i = 0; i < 6; i++) ({ run } = await advanceOrgRun(run, d));
    const needsYou = acts.find((a) => a.action.startsWith("NEEDS YOU"));
    expect(needsYou).toBeTruthy();
    expect(needsYou!.action).toContain("Fund launch");
    expect(needsYou!.meta).toContain("approve the spend");
  });

  it("drives a run to completion step-by-step (resumable/durable)", async () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    const { deps: d } = deps();
    for (let i = 0; i < 10 && !isComplete(run); i++) ({ run } = await advanceOrgRun(run, d));
    expect(run.status).toBe("done");
  });

  it("a thrown executor marks the task failed (honest, no crash)", async () => {
    const run = createOrgRun("r1", "x", { roles: ["ceo"], now: 0 });
    const { deps: d } = deps({ executor: vi.fn(async () => { throw new Error("boom"); }) as unknown as ExecuteFn });
    const { run: after } = await advanceOrgRun(run, d);
    expect(after.tasks.find((t) => t.id === "plan")!.state).toBe("failed");
    expect(after.status).toBe("failed");
  });
});
