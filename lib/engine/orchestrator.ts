// Orchestrator — the convenience layer that turns a GOAL into a running agent org: decompose → run the
// supervisor. Default execution is the deterministic SIMULATED path (keyless, $0, matches the product's
// offline ethos); a model-backed/OpenHands `execute` is injected in Phase B. Pure + testable.

import type { AgentRole, Proof } from "./types";
import { type AgentTask } from "./task-queue";
import { runSupervisor, type ExecuteFn, type SupervisorOutcome, type TaskResult } from "./supervisor";
import { type AgentInstance } from "./agent-lifecycle";
import { preparePacket } from "./accountability-spine";

const DEFAULT_ROLES: AgentRole[] = ["ceo", "engineering", "support", "marketing"];

// A standard software pipeline mapped onto whichever crew roles exist: plan → build → verify → launch.
// Tasks whose role isn't in the crew are skipped, and deps are rewired to the previous present step.
export function decomposeGoal(goal: string, roles: AgentRole[] = DEFAULT_ROLES): AgentTask[] {
  const steps: { id: string; role: AgentRole; verb: string; priority: number }[] = (
    [
      { id: "plan", role: "ceo", verb: "Plan", priority: 5 },
      { id: "build", role: "engineering", verb: "Build", priority: 4 },
      { id: "verify", role: "support", verb: "Verify", priority: 3 },
      { id: "launch", role: "marketing", verb: "Launch", priority: 2 },
    ] as { id: string; role: AgentRole; verb: string; priority: number }[]
  ).filter((s) => roles.includes(s.role));

  const tasks: AgentTask[] = [];
  let prev: string | null = null;
  for (const s of steps) {
    tasks.push({ id: s.id, goal: `${s.verb}: ${goal}`, role: s.role, blockingOn: prev ? [prev] : [], priority: s.priority });
    prev = s.id;
  }
  return tasks;
}

// The independent verifier for a producer — never the producer itself (generator/evaluator separation).
function verifierFor(producer: AgentRole): AgentRole {
  return producer === "support" ? "ceo" : "support";
}

// Deterministic simulated execution: honest self-describing (metric) proof, a small real spend, an
// independent verifier, and — on the launch step — a gated money act escalated to the human spine.
export const simulatedExecute: ExecuteFn = (inst: AgentInstance, task: AgentTask): TaskResult => {
  const proof: Proof = { kind: "metric", value: `simulated — ${task.goal}` };
  const res: TaskResult = { ok: true, spentCents: 25, proof, verifierRole: verifierFor(task.role) };
  if (task.id === "launch") {
    res.gatedActs = [
      preparePacket({
        id: `${inst.id}-spend`,
        kind: "move_money",
        title: "Fund launch budget",
        summary: `Ad/launch spend for: ${task.goal}`,
        preparedBy: task.role,
        actionRequired: "Review and approve the launch spend on your own rail",
        now: inst.createdAt,
      }),
    ];
  }
  return res;
};

export interface RunGoalOptions {
  roles?: AgentRole[];
  modelForRole: (role: AgentRole) => string;
  makeId: () => string;
  execute?: ExecuteFn; // Phase B injects a model-backed / OpenHands executor
  budgetCentsPerTask?: number;
  now?: () => number;
}

export function runSupervisedGoal(goal: string, opts: RunGoalOptions): Promise<SupervisorOutcome> {
  const tasks = decomposeGoal(goal, opts.roles ?? DEFAULT_ROLES);
  return runSupervisor(tasks, opts.execute ?? simulatedExecute, {
    modelForRole: opts.modelForRole,
    makeId: opts.makeId,
    budgetCentsPerTask: opts.budgetCentsPerTask ?? 5000,
    now: opts.now,
  });
}
