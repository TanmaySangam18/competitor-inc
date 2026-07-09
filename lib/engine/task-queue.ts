// Task DAG for the supervisor: a goal decomposes into tasks with dependencies (blockingOn) and a
// priority. `orderTasks` is a Kahn topological sort (ties broken by priority) that throws on a cycle or a
// dangling dependency — a malformed plan should fail loudly, not run half-done. Pure + deterministic.

import type { AgentRole } from "./types";
import type { SpineActKind } from "./accountability-spine";

// What the executor should DO for a task. The org plan sets it explicitly; the legacy flat plan leaves it
// undefined and the executor infers it from the task id (plan/build/verify → else draft).
export type TaskAction = "plan" | "build" | "verify" | "draft";

export interface AgentTask {
  id: string;
  goal: string; // what this task accomplishes
  role: AgentRole; // which agent function owns it (drives model routing + tooling)
  blockingOn: string[]; // task ids that must complete first
  priority: number; // higher runs sooner among ready tasks
  action?: TaskAction; // what the executor does (org plan sets this; legacy infers from id)
  handoffTo?: string; // successor task id to pass this task's output/context to (context flows down the chain)

  // ── Optional ORG attribution (Phase 2) ──────────────────────────────────────
  // Ties a task to a real POSITION in the org chart (lib/org/organization.ts) so execution reflects the
  // IC→lead→exec hierarchy, not a flat crew. Absent on the legacy flat decomposeGoal plan.
  orgRoleId?: string; // the specific position, e.g. "fullstack-engineer"
  orgTitle?: string; // the position NAME shown in the Glass Box / Slack (founder mandate: names = positions)
  orgLevel?: "exec" | "director" | "lead" | "ic";
  reportsToTitle?: string | null; // the position this work rolls up to (renders the visible chain)
  verifierOrgRoleId?: string; // the manager / independent position that reviews this task's output
  deskAct?: { kind: SpineActKind; title: string; action: string }; // a founder-gated act this task escalates
}

// Tasks whose dependencies are all satisfied, most-important first. `done` = ids already completed.
export function readyTasks(tasks: AgentTask[], done: ReadonlySet<string>): AgentTask[] {
  return tasks
    .filter((t) => !done.has(t.id) && t.blockingOn.every((b) => done.has(b)))
    .sort((a, b) => b.priority - a.priority);
}

export function orderTasks(tasks: AgentTask[]): AgentTask[] {
  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    for (const dep of t.blockingOn) {
      if (!ids.has(dep)) throw new Error(`task ${t.id} depends on unknown task ${dep}`);
    }
  }
  const done = new Set<string>();
  const out: AgentTask[] = [];
  while (out.length < tasks.length) {
    const next = readyTasks(tasks, done)[0];
    if (!next) throw new Error("task graph has a cycle");
    out.push(next);
    done.add(next.id);
  }
  return out;
}
