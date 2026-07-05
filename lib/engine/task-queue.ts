// Task DAG for the supervisor: a goal decomposes into tasks with dependencies (blockingOn) and a
// priority. `orderTasks` is a Kahn topological sort (ties broken by priority) that throws on a cycle or a
// dangling dependency — a malformed plan should fail loudly, not run half-done. Pure + deterministic.

import type { AgentRole } from "./types";

export interface AgentTask {
  id: string;
  goal: string; // what this task accomplishes
  role: AgentRole; // which agent function owns it
  blockingOn: string[]; // task ids that must complete first
  priority: number; // higher runs sooner among ready tasks
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
