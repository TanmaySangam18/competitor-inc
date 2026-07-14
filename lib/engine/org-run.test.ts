import { describe, it, expect } from "vitest";
import { createOrgRun, nextRunnableTask, markRunning, applyTaskResult, isComplete, runProgress, buildRepo } from "./org-run";

const ROLES = ["ceo", "engineering", "support", "marketing"] as const;
const ok = (proof = { kind: "metric" as const, value: "done" }) => ({ ok: true, proof });

describe("durable org run — the crash-safe state machine", () => {
  it("decomposes a goal into an all-pending run (plan→build→verify→launch)", () => {
    const run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    expect(run.tasks.map((t) => t.id)).toEqual(["plan", "build", "verify", "launch"]);
    expect(run.tasks.every((t) => t.state === "pending")).toBe(true);
    expect(run.status).toBe("pending");
  });

  it("only surfaces a task once ALL its dependencies are done (the DAG gate)", () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    expect(nextRunnableTask(run)!.id).toBe("plan"); // build blocked on plan
    run = applyTaskResult(markRunning(run, "plan"), "plan", ok());
    expect(nextRunnableTask(run)!.id).toBe("build"); // now unblocked
  });

  it("delivers handoff context to the successor task", () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    run = applyTaskResult(markRunning(run, "plan"), "plan", { ok: true, proof: { kind: "metric", value: "spec" }, handoffTo: "build", handoffContext: "SPEC-TEXT" });
    expect(run.tasks.find((t) => t.id === "build")!.handoffContext).toBe("SPEC-TEXT");
  });

  it("drives the whole run to done, one step at a time (durable/resumable)", () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    let guard = 0;
    for (let t = nextRunnableTask(run); t && guard < 20; t = nextRunnableTask(run), guard++) {
      run = applyTaskResult(markRunning(run, t.id), t.id, ok());
    }
    expect(isComplete(run)).toBe(true);
    expect(run.status).toBe("done");
    expect(runProgress(run)).toMatchObject({ done: 4, total: 4, failed: 0, status: "done" });
  });

  it("a failed task blocks its dependents and resolves the run to failed (never hangs)", () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    run = applyTaskResult(markRunning(run, "plan"), "plan", { ok: false }); // build/verify/launch depend on plan
    expect(nextRunnableTask(run)).toBeNull(); // nothing can advance
    expect(run.status).toBe("failed");
    expect(isComplete(run)).toBe(true);
  });

  it("applying a result twice is an idempotent no-op (safe under concurrent cron + client ticks)", () => {
    let run = createOrgRun("r1", "a focus app", { roles: [...ROLES], now: 0 });
    run = applyTaskResult(markRunning(run, "plan"), "plan", ok());
    const again = applyTaskResult(run, "plan", { ok: false }); // must NOT flip done→failed
    expect(again.tasks.find((t) => t.id === "plan")!.state).toBe("done");
  });

  it("orgPlan builds a hierarchical run that OWNS the build (IC→lead→exec + escalations), carrying attribution", () => {
    const run = createOrgRun("r1", "a tutoring marketplace", { orgPlan: true, operate: true, now: 0 });
    const ids = run.tasks.map((t) => t.id);
    expect(ids).toContain("build-ic"); // the run owns the build dispatch
    expect(ids).toContain("build-review");
    expect(ids).toContain("build-signoff");
    const buildIc = run.tasks.find((t) => t.id === "build-ic")!;
    expect(buildIc.action).toBe("build"); // dispatches, not narrates
    expect(buildIc.orgTitle).toBe("Backend Engineer");
    expect(buildIc.verifierOrgRoleId).toBeTruthy();
    // the founder-gated acts carry their explicit desk, ready to escalate
    expect(run.tasks.find((t) => t.id === "monetize")!.deskAct?.kind).toBe("move_money");
    // still a valid all-pending DAG that the step executor can drive
    expect(run.tasks.every((t) => t.state === "pending")).toBe(true);
    expect(nextRunnableTask(run)!.id).toBe("plan");
  });

  it("carries a build task's repo out (applyTaskResult + buildRepo) so the live URL can be polled", () => {
    let run = createOrgRun("r1", "x", { orgPlan: true, now: 0 });
    expect(buildRepo(run)).toBeNull(); // nothing dispatched yet
    // drive plan → spec → build-ic, then mark build-ic done WITH a repo
    run = applyTaskResult(markRunning(run, "plan"), "plan", { ok: true, proof: { kind: "metric", value: "s" }, handoffTo: "spec", handoffContext: "SPEC" });
    run = applyTaskResult(markRunning(run, "spec"), "spec", { ok: true, proof: { kind: "metric", value: "s" }, handoffTo: "build-ic", handoffContext: "SPEC" });
    run = applyTaskResult(markRunning(run, "build-ic"), "build-ic", { ok: true, proof: { kind: "metric", value: "building" }, repo: "TanmaySangam18/x-abc" });
    expect(run.tasks.find((t) => t.id === "build-ic")!.repo).toBe("TanmaySangam18/x-abc");
    expect(buildRepo(run)).toBe("TanmaySangam18/x-abc");
  });
});
