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
  verifierOrgRoleId?: string; // the specific POSITION that checked it (org-role independence; Phase 2)
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
  maxTaskRetries?: number; // per-task self-repair attempts on a verification failure (default 0 = off)
  now?: () => number;
}

export interface SupervisorOutcome {
  instances: AgentInstance[];
  completed: string[]; // task ids that finished done or handed_off
  failed: string[];
  packets: PreparedPacket[]; // escalated to the Accountability Spine
  artifacts: { taskId: string; role: AgentRole; url: string }[]; // real, verified live URLs produced
  refundedCents: number; // unspent budget returned across all instances
  log: string[]; // human-readable trace for the Glass Box
}

// Why a result is NOT acceptable as "done" — returns null when it passes. Enforces the honesty invariants.
// Independence is checked at ORG-ROLE granularity when the task carries a position (Phase 2): a lead
// reviewing an IC in the SAME execFn is genuinely independent (a different, supervisory position), so only
// a position grading its OWN work is rejected. Tasks with no org attribution (the legacy flat plan) fall
// back to engine-role independence — behaviour unchanged.
function verifyFailure(res: TaskResult, task: AgentTask): string | null {
  if (!res.ok) return "agent reported failure";
  if (!isWellFormedProof(res.proof)) return "no well-formed proof (verify-before-done)";
  if (task.orgRoleId) {
    if (!res.verifierOrgRoleId) return "no independent verifier (org position)";
    if (res.verifierOrgRoleId === task.orgRoleId) return "self-graded (same org position verified its own work)";
    return null;
  }
  if (!res.verifierRole) return "no independent verifier";
  if (res.verifierRole === task.role) return "self-graded (generator/evaluator not separated)";
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
  const artifacts: { taskId: string; role: AgentRole; url: string }[] = [];
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

    // Per-task SELF-REPAIR: run → verify; on a verification failure, retry with diagnostic feedback (bounded).
    // Default 0 retries = unchanged behavior; the autonomous path opts in via maxTaskRetries. The verifier stays
    // independent every attempt (verifyFailure enforces it) and spend stays budget-capped (recordSpend throws).
    const maxRetries = opts.maxTaskRetries ?? 0;
    let res!: TaskResult;
    let why: string | null = "not attempted";
    let failReason: string | null = null;
    let ctx = contextForTask[task.id];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        res = await execute(inst, task, ctx);
      } catch (e) {
        failReason = `execute threw: ${e instanceof Error ? e.message : "unknown"}`;
        break; // an execute exception isn't retried
      }
      if (res.spentCents > 0) {
        try {
          inst = recordSpend(inst, res.spentCents);
        } catch {
          failReason = "budget exhausted during self-repair";
          break;
        }
      }
      why = verifyFailure(res, task);
      if (!why) break; // verified → accept
      if (attempt < maxRetries) {
        ctx = `${contextForTask[task.id] ?? ""}\n[self-repair ${attempt + 1}/${maxRetries}: previous output rejected — ${why}. Produce a real, independently-verifiable proof.]`.trim();
        log.push(`retry ${inst.id} — ${why}`);
      }
    }
    if (failReason) {
      inst = transition(inst, "failed");
      const t = terminate(inst, now());
      refundedCents += t.refundCents;
      instances.push(t.instance);
      failed.push(task.id);
      log.push(`fail ${inst.id} — ${failReason}`);
      continue;
    }

    if (res.gatedActs?.length) {
      packets.push(...res.gatedActs);
      log.push(`escalate ${res.gatedActs.length} act(s) to the accountability spine`);
    }

    inst = transition(inst, "verifying");
    if (!why && res.proof?.kind === "url") artifacts.push({ taskId: task.id, role: task.role, url: res.proof.value });
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

  return { instances, completed, failed, packets, artifacts, refundedCents, log };
}
