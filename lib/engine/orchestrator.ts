// Orchestrator — the convenience layer that turns a GOAL into a running agent org: decompose → run the
// supervisor. Default execution is the deterministic SIMULATED path (keyless, $0, matches the product's
// offline ethos); a model-backed/OpenHands `execute` is injected in Phase B. Pure + testable.

import type { AgentRole, Proof } from "./types";
import { type AgentTask } from "./task-queue";
import { runSupervisor, type ExecuteFn, type SupervisorOutcome, type TaskResult } from "./supervisor";
import { type AgentInstance } from "./agent-lifecycle";
import { preparePacket, type SpineActKind } from "./accountability-spine";

// Every function that applies to any company. Manufacturing is intentionally omitted (physical-product
// only). finance/legal/ops run in the operate phase (drafts → your desk). Governance keeps them safe.
const DEFAULT_ROLES: AgentRole[] = ["ceo", "engineering", "support", "marketing", "growth", "finance", "legal", "ops"];

type Step = { id: string; role: AgentRole; verb: string; priority: number };

// Phase A/B core pipeline: plan → build → verify → launch. Phase D (operate=true) appends the ONGOING
// company functions — announce (GTM) / retain (growth) / care (support) — which run AFTER launch and
// produce drafts for the founder's desk. Tasks whose role isn't in the crew are skipped.
export function decomposeGoal(goal: string, roles: AgentRole[] = DEFAULT_ROLES, opts?: { operate?: boolean }): AgentTask[] {
  const core: Step[] = (
    [
      { id: "plan", role: "ceo", verb: "Plan", priority: 9 },
      { id: "build", role: "engineering", verb: "Build", priority: 8 },
      { id: "verify", role: "support", verb: "Verify", priority: 7 },
      { id: "launch", role: "marketing", verb: "Launch", priority: 6 },
    ] as Step[]
  ).filter((s) => roles.includes(s.role));

  const tasks: AgentTask[] = [];
  let prev: string | null = null;
  for (const s of core) {
    tasks.push({ id: s.id, goal: `${s.verb}: ${goal}`, role: s.role, blockingOn: prev ? [prev] : [], priority: s.priority });
    prev = s.id;
  }

  if (opts?.operate && prev) {
    const lastCore = prev;
    const ops: Step[] = (
      [
        { id: "announce", role: "marketing", verb: "Announce", priority: 5 },
        { id: "retain", role: "growth", verb: "Build a retention loop for", priority: 4 },
        { id: "care", role: "support", verb: "Prepare support for", priority: 3 },
        // Back-office functions — each DRAFTS its work and routes the irreducible act to your desk.
        { id: "budget", role: "finance", verb: "Prepare the budget + unit economics for", priority: 5 },
        { id: "comply", role: "legal", verb: "Draft the terms, privacy, and compliance for", priority: 4 },
        { id: "process", role: "ops", verb: "Set up operations and vendors for", priority: 3 },
      ] as Step[]
    ).filter((s) => roles.includes(s.role));
    for (const s of ops) {
      tasks.push({ id: s.id, goal: `${s.verb}: ${goal}`, role: s.role, blockingOn: [lastCore], priority: s.priority });
    }
  }
  return tasks;
}

// The independent verifier for a producer — never the producer itself (generator/evaluator separation).
function verifierFor(producer: AgentRole): AgentRole {
  return producer === "support" ? "ceo" : "support";
}

// Which tasks produce something for the human's desk (a spend to fund, or a draft to approve before it
// goes out). The org prepares everything; the human just says yes. Nothing outbound auto-fires.
const DESK: Record<string, { kind: SpineActKind; title: string; action: string }> = {
  launch: { kind: "move_money", title: "Fund launch budget", action: "Review and approve the launch spend on your own rail" },
  announce: { kind: "approve_publish", title: "Approve the launch post", action: "Review the drafted post, then approve to publish" },
  retain: { kind: "approve_outreach", title: "Approve the referral email", action: "Review the drafted email, then approve to send" },
  care: { kind: "approve_support", title: "Approve support replies", action: "Review the drafted macros, then approve to enable" },
  // Back-office desk items — irreducible human acts (finance/legal/ops prepare 100%, you execute the last step).
  budget: { kind: "move_money", title: "Approve the budget", action: "Review the prepared budget + unit economics, then approve the spend on your own rail" },
  comply: { kind: "sign_contract", title: "Review and sign the terms", action: "Review the drafted terms / privacy / compliance, then sign — only a human can" },
  process: { kind: "vendor_review", title: "Approve the vendor / process change", action: "Review the prepared vendor + process change, then approve" },
};

// Deterministic simulated execution: honest self-describing (metric) proof, a small real spend, an
// independent verifier, and — for spend/outbound steps — a prepared item escalated to the human's desk.
export const simulatedExecute: ExecuteFn = (inst: AgentInstance, task: AgentTask): TaskResult => {
  const proof: Proof = { kind: "metric", value: `simulated — ${task.goal}` };
  const res: TaskResult = { ok: true, spentCents: 25, proof, verifierRole: verifierFor(task.role) };
  const desk = DESK[task.id];
  if (desk) {
    res.gatedActs = [
      preparePacket({
        id: `${inst.id}-${task.id}`,
        kind: desk.kind,
        title: desk.title,
        summary: task.goal,
        preparedBy: task.role,
        actionRequired: desk.action,
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
  operate?: boolean; // Phase D: also run the ongoing GTM/support functions (drafts → your desk)
  budgetCentsPerTask?: number;
  now?: () => number;
}

export function runSupervisedGoal(goal: string, opts: RunGoalOptions): Promise<SupervisorOutcome> {
  const tasks = decomposeGoal(goal, opts.roles ?? DEFAULT_ROLES, { operate: opts.operate });
  return runSupervisor(tasks, opts.execute ?? simulatedExecute, {
    modelForRole: opts.modelForRole,
    makeId: opts.makeId,
    budgetCentsPerTask: opts.budgetCentsPerTask ?? 5000,
    now: opts.now,
  });
}
