// ─────────────────────────────────────────────────────────────────────────────
// DURABLE ORG RUN — the crash-safe state machine (Phase 3 / the "runs while you sleep" layer).
//
// Running the full multi-agent DAG can take minutes — too long for a single serverless request. So a run
// is DATA: a decomposed set of tasks, each with its own state, persisted in the DB. A driver (the nightly
// cron and/or a client poll) advances it ONE short step at a time — one model call per tick, well under
// the function limit — and the state survives between ticks (and crashes). This module is the PURE core:
// no DB, no async, no model — just "what's the next runnable task" and "apply a result." Fully testable;
// the persistence + the step executor wrap it (next slices).
// ─────────────────────────────────────────────────────────────────────────────

import { decomposeGoal } from "./orchestrator";
import { buildOrgPlan } from "./org-plan";
import type { AgentRole, Proof } from "./types";
import type { TaskAction } from "./task-queue";
import type { SpineActKind } from "./accountability-spine";

export type TaskState = "pending" | "running" | "done" | "failed";
export type RunStatus = "pending" | "running" | "done" | "failed";

export interface RunTask {
  id: string;
  role: AgentRole;
  goal: string;
  blockingOn: string[];
  priority: number;
  state: TaskState;
  proof?: Proof;
  handoffContext?: string; // context handed down from a predecessor task (plan → build → verify)
  // ── Optional ORG attribution (Phase 2, orgPlan runs) — carried verbatim from buildOrgPlan so the durable
  // step executor runs the real position (IC→lead→exec), escalates the right gate, and hands off correctly.
  action?: TaskAction;
  handoffTo?: string;
  orgRoleId?: string;
  orgTitle?: string;
  orgLevel?: "exec" | "director" | "lead" | "ic";
  reportsToTitle?: string | null;
  verifierOrgRoleId?: string;
  deskAct?: { kind: SpineActKind; title: string; action: string };
}

export interface OrgRun {
  id: string;
  goal: string;
  status: RunStatus;
  tasks: RunTask[];
  createdAt: number;
  updatedAt: number;
}

// Decompose a goal into a fresh, all-pending run (the DAG + per-task state). With orgPlan, the DAG mirrors
// the real org chart (IC→lead→exec + founder escalations) and the run OWNS the build (build-ic dispatches
// it); the org attribution rides along on each task so the step executor runs the real position.
export function createOrgRun(
  id: string,
  goal: string,
  opts?: { roles?: AgentRole[]; operate?: boolean; orgPlan?: boolean; now?: number },
): OrgRun {
  const now = opts?.now ?? Date.now();
  const source = opts?.orgPlan
    ? buildOrgPlan(goal, { operate: opts?.operate })
    : decomposeGoal(goal, opts?.roles, { operate: opts?.operate });
  const tasks: RunTask[] = source.map((t) => ({
    id: t.id,
    role: t.role,
    goal: t.goal,
    blockingOn: t.blockingOn,
    priority: t.priority,
    state: "pending",
    action: t.action,
    handoffTo: t.handoffTo,
    orgRoleId: t.orgRoleId,
    orgTitle: t.orgTitle,
    orgLevel: t.orgLevel,
    reportsToTitle: t.reportsToTitle,
    verifierOrgRoleId: t.verifierOrgRoleId,
    deskAct: t.deskAct,
  }));
  return { id, goal, status: tasks.length ? "pending" : "done", tasks, createdAt: now, updatedAt: now };
}

// The next task ready to run: pending, with EVERY dependency already done. Highest priority first (stable).
// null ⇒ nothing runnable right now (either everything's terminal, or the remaining work is blocked by a
// failed dependency — see runTerminalStatus).
export function nextRunnableTask(run: OrgRun): RunTask | null {
  const done = new Set(run.tasks.filter((t) => t.state === "done").map((t) => t.id));
  const runnable = run.tasks
    .filter((t) => t.state === "pending" && t.blockingOn.every((b) => done.has(b)))
    .sort((a, b) => b.priority - a.priority);
  return runnable[0] ?? null;
}

// Mark a task running BEFORE executing it — so a concurrent tick (cron + client poll) can't double-run it.
export function markRunning(run: OrgRun, taskId: string, now = Date.now()): OrgRun {
  return {
    ...run,
    status: "running",
    tasks: run.tasks.map((t) => (t.id === taskId ? { ...t, state: "running" } : t)),
    updatedAt: now,
  };
}

// Compute the run's status: done when all tasks are done; failed when it can't make progress with a
// failure/blockage present; running otherwise. A task blocked by a failed dependency is never runnable, so
// a stuck run resolves to "failed" rather than hanging in "running" forever.
function runTerminalStatus(tasks: RunTask[]): RunStatus {
  const done = new Set(tasks.filter((t) => t.state === "done").map((t) => t.id));
  const anyRunning = tasks.some((t) => t.state === "running");
  const anyRunnable = tasks.some((t) => t.state === "pending" && t.blockingOn.every((b) => done.has(b)));
  if (anyRunning || anyRunnable) return "running";
  // No task can advance → terminal. All done = success; anything not done (failed or blocked-pending) = failed.
  return tasks.every((t) => t.state === "done") ? "done" : "failed";
}

export interface StepResult { ok: boolean; proof?: Proof; handoffTo?: string; handoffContext?: string }

// Apply a completed step's result (immutably): set the task done/failed + its proof, deliver any handoff
// context to the successor, and recompute the run status. Idempotent-safe on a non-pending/running task
// (a duplicate tick is a no-op on the already-terminal task).
export function applyTaskResult(run: OrgRun, taskId: string, result: StepResult, now = Date.now()): OrgRun {
  const target = run.tasks.find((t) => t.id === taskId);
  if (!target || target.state === "done" || target.state === "failed") return run; // idempotent no-op
  const tasks = run.tasks.map((t) => {
    if (t.id === taskId) return { ...t, state: (result.ok ? "done" : "failed") as TaskState, proof: result.proof };
    if (result.handoffTo && t.id === result.handoffTo && result.handoffContext) return { ...t, handoffContext: result.handoffContext };
    return t;
  });
  return { ...run, tasks, status: runTerminalStatus(tasks), updatedAt: now };
}

export function isComplete(run: OrgRun): boolean {
  return run.status === "done" || run.status === "failed";
}

// A compact progress read for the UI / a founder briefing.
export function runProgress(run: OrgRun): { done: number; total: number; failed: number; status: RunStatus } {
  return {
    done: run.tasks.filter((t) => t.state === "done").length,
    total: run.tasks.length,
    failed: run.tasks.filter((t) => t.state === "failed").length,
    status: run.status,
  };
}
