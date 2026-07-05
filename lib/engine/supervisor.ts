// The Supervisor — the orchestrator. Given a task DAG, it spawns an ephemeral AgentInstance per task,
// runs it, INDEPENDENTLY verifies the result, then hands off to a successor or completes, and terminates the
// instance (returning unspent budget). It escalates any irreducible act to the Accountability Spine.
//
// The actual "agent does the work" is INJECTED as `execute` — so the pure orchestration (scheduling, state,
// verification, escalation, budget) is deterministic and testable with ZERO model calls / tokens. The real
// engine wires a model-backed `execute`; tests wire a deterministic one.

import type { AgentRole, Proof } from "./types";
import { type AgentTask, orderTasks } from "./task-queue";
import {
  type AgentInstance,
  spawnInstance,
  transition,
  recordSpend,
  handoff,
  terminate,
  isWellFormedProof,
} from "./agent-lifecycle";
import type { PreparedPacket } from "./accountability-spine";

export interface TaskResult {
  ok: boolean;
  proof?: Proof; // required for a "done" verdict (verify-before-done)
  spentCents: number;
  verifierRole?: AgentRole; // who checked the work — MUST differ from the producer (no self-grading)
  handoffTo?: string; // successor task id to pass context to
  handoffContext?: string;
  gatedActs?: PreparedPacket[]; // irreducible acts to escalate to the human spine (never auto-run)
}

// execute receives the instance, its task, and any context handed to it by a predecessor.
export type ExecuteFn = (
  instance: AgentInstance,
  task: AgentTask,
  inboundContext?: string,
) => Promise<TaskResult> | TaskResult;

export interface SupervisorOptions {
  modelForRole: (role: AgentRole) => string; // inject modelForAgent
  makeId: () => string;
  budgetCentsPerTask?: number; // default allocation per instance
  now?: () => number;
}

export interface SupervisorOutcome {
  instances: AgentInstance[];
  completed: string[]; // task ids that finished done or handed_off
  failed: string[];
  packets: PreparedPacket[]; // escalated to the Accountability Spine
  refundedCents: number; // unspent budget returned across all instances
  log: string[]; // human-readable trace for the Glass Box
}

// Why a result is NOT acceptable as "done" — returns null when it passes. Enforces the honesty invariants.
function verifyFailure(res: TaskResult, producer: AgentRole): string | null {
  if (!res.ok) return "agent reported failure";
  if (!isWellFormedProof(res.proof)) return "no well-formed proof (verify-before-done)";
  if (!res.verifierRole) return "no independent verifier";
  if (res.verifierRole === producer) return "self-graded (generator/evaluator not separated)";
  return null;
}

export async function runSupervisor(
  tasks: AgentTask[],
  execute: ExecuteFn,
  opts: SupervisorOptions,
): Promise<SupervisorOutcome> {
  const now = opts.now ?? Date.now;
  const budget = opts.budgetCentsPerTask ?? 0;
  const ordered = orderTasks(tasks); // throws on cycle / dangling dep — fail loudly

  const instances: AgentInstance[] = [];
  const completed: string[] = [];
  const failed: string[] = [];
  const packets: PreparedPacket[] = [];
  const log: string[] = [];
  const contextForTask: Record<string, string> = {};
  const done = new Set<string>();
  let refundedCents = 0;

  for (const task of ordered) {
    // A task whose dependency failed can't run — skip it (honest: we don't fake work on a broken chain).
    const blockedByFailure = task.blockingOn.some((b) => !done.has(b));
    if (blockedByFailure) {
      failed.push(task.id);
      log.push(`skip ${task.id} — upstream dependency did not complete`);
      continue;
    }

    let inst = spawnInstance({
      id: opts.makeId(),
      taskId: task.id,
      role: task.role,
      model: opts.modelForRole(task.role),
      budgetCents: budget,
      now: now(),
    });
    log.push(`spawn ${inst.id} (${task.role}) → ${task.goal}`);
    inst = transition(inst, "working");

    let res: TaskResult;
    try {
      res = await execute(inst, task, contextForTask[task.id]);
    } catch (e) {
      inst = transition(inst, "failed");
      const t = terminate(inst, now());
      refundedCents += t.refundCents;
      instances.push(t.instance);
      failed.push(task.id);
      log.push(`fail ${inst.id} — execute threw: ${e instanceof Error ? e.message : "unknown"}`);
      continue;
    }

    if (res.spentCents > 0) inst = recordSpend(inst, res.spentCents);
    if (res.gatedActs?.length) {
      packets.push(...res.gatedActs);
      log.push(`escalate ${res.gatedActs.length} act(s) to the accountability spine`);
    }

    inst = transition(inst, "verifying");
    const why = verifyFailure(res, task.role);
    if (why) {
      inst = transition(inst, "failed");
      failed.push(task.id);
      log.push(`fail ${inst.id} — ${why}`);
    } else if (res.handoffTo) {
      if (res.handoffContext) contextForTask[res.handoffTo] = res.handoffContext;
      inst = handoff(inst, res.handoffContext ?? "");
      completed.push(task.id);
      done.add(task.id);
      log.push(`handoff ${inst.id} → task ${res.handoffTo}`);
    } else {
      inst = transition(inst, "done");
      completed.push(task.id);
      done.add(task.id);
      log.push(`done ${inst.id} (verified by ${res.verifierRole})`);
    }

    const t = terminate(inst, now());
    refundedCents += t.refundCents;
    instances.push(t.instance);
  }

  return { instances, completed, failed, packets, refundedCents, log };
}
