// The durable STEP EXECUTOR: advance an org run by exactly ONE task, persisting as it goes. Called
// repeatedly by the cron (and/or a client poll) — each call is one short unit of work (one model call),
// so it never approaches the serverless limit, and the run state is saved before + after so a crash mid
// step is safe (the task is left "running" and re-picked, or completes idempotently on the next tick).
//
// Deps are INJECTED (executor + persistence spies) → fully unit-testable with zero DB/network. The cron
// wires the real ones: makeRealExecutor(realDeps) + saveOrgRun + a company-scoped activity writer.

import type { Activity } from "./types";
import type { AgentInstance } from "./agent-lifecycle";
import type { AgentTask } from "./task-queue";
import type { ExecuteFn, TaskResult } from "./supervisor";
import { type OrgRun, nextRunnableTask, markRunning, applyTaskResult } from "./org-run";

export interface AdvanceDeps {
  executor: ExecuteFn; // makeRealExecutor(realDeps) — the real per-task work
  saveRun: (run: OrgRun) => Promise<void>; // persist run state (claim + result)
  recordActivity: (a: Activity) => Promise<void>; // append to the Glass Box (company-scoped by the caller)
  makeId: () => string;
  now?: () => number;
}

// Advance the run by one runnable task. Returns the updated run + which task ran (null ⇒ terminal/nothing
// runnable — the caller stops driving this run).
export async function advanceOrgRun(run: OrgRun, deps: AdvanceDeps): Promise<{ run: OrgRun; ranTaskId: string | null }> {
  const task = nextRunnableTask(run);
  if (!task) return { run, ranTaskId: null };

  const now = deps.now?.() ?? Date.now();
  // Claim the task (persist "running") BEFORE executing — crash-safe + prevents a concurrent tick double-running it.
  let cur = markRunning(run, task.id, now);
  await deps.saveRun(cur);

  const inst: AgentInstance = {
    id: deps.makeId(), taskId: task.id, role: task.role, status: "working", model: "", budgetCents: 0, spentCents: 0, createdAt: now,
  };
  // Reconstruct the FULL task (org attribution included) so the executor runs the real position: build-ic
  // actually dispatches, a lead review verifies with org-role independence, gates escalate to the founder.
  const agentTask: AgentTask = {
    id: task.id, goal: task.goal, role: task.role, blockingOn: task.blockingOn, priority: task.priority,
    action: task.action, handoffTo: task.handoffTo,
    orgRoleId: task.orgRoleId, orgTitle: task.orgTitle, orgLevel: task.orgLevel,
    reportsToTitle: task.reportsToTitle, verifierOrgRoleId: task.verifierOrgRoleId, deskAct: task.deskAct,
  };

  let result: TaskResult;
  try {
    result = await Promise.resolve(deps.executor(inst, agentTask, task.handoffContext));
  } catch {
    result = { ok: false, spentCents: 0 };
  }

  // The work itself → a Glass-Box activity with its real proof. When the task carries an org position, the
  // meta shows WHO did it and who it rolls up to — the visible IC→lead→exec hierarchy, not a flat role.
  if (result.proof) {
    const who = task.orgTitle ? `${task.orgTitle}${task.reportsToTitle ? ` → ${task.reportsToTitle}` : ""} · ` : "";
    await deps.recordActivity({
      id: deps.makeId(), night: 0, agent: task.role, action: task.goal,
      meta: `${who}${result.ok ? "org run · done" : "org run · needs a retry"}`, cost: 0,
      status: result.ok ? "done" : "failed-credited", proof: result.proof,
    });
  }
  // Irreducible human acts → clearly-labeled "NEEDS YOU" activities (NOT auto-executing approvals, so
  // nothing consequential can fire on a mis-mapped kind). The founder reads it and does the manual step.
  for (const pkt of result.gatedActs ?? []) {
    await deps.recordActivity({
      id: deps.makeId(), night: 0, agent: pkt.preparedBy, action: `NEEDS YOU — ${pkt.title}`,
      meta: pkt.actionRequired, cost: 0, status: "done",
      proof: { kind: "metric", value: "prepared · awaiting your sign-off" },
    });
  }

  cur = applyTaskResult(cur, task.id, { ok: result.ok, proof: result.proof, handoffTo: result.handoffTo, handoffContext: result.handoffContext }, now);
  await deps.saveRun(cur);
  return { run: cur, ranTaskId: task.id };
}
