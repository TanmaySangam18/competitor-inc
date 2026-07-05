// Ephemeral agent lifecycle (Phase A of the autonomous-company architecture, docs/…temporal-honking-cosmos).
// An AgentInstance is born for a single task, does work, gets independently verified, either hands off to a
// successor or completes, then TERMINATES — returning unspent budget. No instance runs unbounded, which is
// how we bound long-horizon drift. Pure + deterministic (no model calls, no I/O) so it's cheap to test.

import type { AgentRole, Proof } from "./types";

export type InstanceStatus =
  | "spawned"
  | "working"
  | "verifying"
  | "handed_off"
  | "done"
  | "failed"
  | "terminated";

export interface AgentInstance {
  id: string;
  taskId: string;
  role: AgentRole;
  status: InstanceStatus;
  model: string; // resolved via modelForAgent(role) by the caller
  budgetCents: number; // allocated to this instance
  spentCents: number;
  handoffContext?: string; // context this instance passed to its successor (set on handoff)
  createdAt: number;
  endedAt?: number;
}

// The ONLY legal transitions. Everything else throws — an illegal transition is a bug, not a state.
const NEXT: Record<InstanceStatus, InstanceStatus[]> = {
  spawned: ["working", "failed", "terminated"],
  working: ["verifying", "failed", "terminated"],
  verifying: ["done", "handed_off", "failed"],
  handed_off: ["terminated"],
  done: ["terminated"],
  failed: ["terminated"],
  terminated: [],
};

export function canTransition(from: InstanceStatus, to: InstanceStatus): boolean {
  return NEXT[from]?.includes(to) ?? false;
}

export function spawnInstance(opts: {
  id: string;
  taskId: string;
  role: AgentRole;
  model: string;
  budgetCents: number;
  now?: number;
}): AgentInstance {
  if (opts.budgetCents < 0) throw new Error("budgetCents must be ≥ 0");
  return {
    id: opts.id,
    taskId: opts.taskId,
    role: opts.role,
    status: "spawned",
    model: opts.model,
    budgetCents: opts.budgetCents,
    spentCents: 0,
    createdAt: opts.now ?? Date.now(),
  };
}

export function transition(inst: AgentInstance, to: InstanceStatus): AgentInstance {
  if (!canTransition(inst.status, to)) {
    throw new Error(`illegal agent-instance transition: ${inst.status} → ${to}`);
  }
  return { ...inst, status: to };
}

// Honesty invariant: spend is real and never exceeds the instance's allocated budget.
export function recordSpend(inst: AgentInstance, cents: number): AgentInstance {
  if (cents < 0) throw new Error("spend must be ≥ 0");
  const spent = inst.spentCents + cents;
  if (spent > inst.budgetCents) throw new Error("spend would exceed instance budget");
  return { ...inst, spentCents: spent };
}

export function handoff(inst: AgentInstance, context: string): AgentInstance {
  return { ...transition(inst, "handed_off"), handoffContext: context };
}

// Terminate + return unspent budget so the ledger stays honest (you're never charged for unspent allocation).
export function terminate(inst: AgentInstance, now?: number): { instance: AgentInstance; refundCents: number } {
  const refundCents = Math.max(0, inst.budgetCents - inst.spentCents);
  return { instance: { ...transition(inst, "terminated"), endedAt: now ?? Date.now() }, refundCents };
}

// A claim isn't "done" without a well-formed proof (verify-before-done). This is the cheap, pure shape
// check; the network-verifying `verifyProof` in execution.ts is the real check used when a claim is live.
export function isWellFormedProof(p?: Proof): boolean {
  if (!p) return false;
  if (p.kind === "url") return /^https:\/\/\S+$/.test(p.value);
  if (p.kind === "build") return /^[0-9a-f]{7,40}$/i.test(p.value.trim());
  if (p.kind === "metric") return p.value.trim().length > 0;
  return false;
}
