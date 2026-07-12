// lib/core/plan.ts — PHASE 2: planning (the other half of coordination).
//
// Turn a GOAL into a coordinated task plan mapped to the org's real IC → lead → sign-off chain (who builds,
// who reviews, who signs off, what escalates to the founder). SALVAGES the proven, pure `buildOrgPlan`
// (lib/engine/org-plan) — deterministic, keyless — and orders it into a runnable sequence. This is how a
// goal becomes work the org can then deliberate on and (once connected) execute.

import { buildOrgPlan, renderOrgChain } from "@/lib/engine/org-plan";
import { orderTasks, type AgentTask } from "@/lib/engine/task-queue";

export interface Plan {
  goal: string;
  tasks: AgentTask[]; // ordered: ready-first, respecting the IC→lead→exec dependency chain
  chain: string[]; // the human-readable "who does what, reporting to whom" chain
}

export function plan(goal: string, opts: { operate?: boolean } = {}): Plan {
  const g = (goal || "").trim();
  const tasks = orderTasks(buildOrgPlan(g, opts));
  return { goal: g, tasks, chain: renderOrgChain(tasks) };
}
