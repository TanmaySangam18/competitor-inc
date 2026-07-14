// ─────────────────────────────────────────────────────────────────────────────
// THE DECISION QUEUE — the executive's entire day, as a data structure.
//
// Day One ([[autonomous-company-direction]]): the org runs the company around the clock; the ONLY thing
// that reaches the human principal is a queue of concise, PREPARED decisions — a drafted contract, a
// drafted invoice, a launch plan, a policy change. The principal has exactly three verbs:
//
//   APPROVE — the item becomes executable (execution still passes the existing double gate:
//             decideMandate + policy engine, via apply-decisions.ts; approval here NEVER bypasses it)
//   REJECT  — closed; nothing fires; the org records why
//   MODIFY  — sent back with a note; the responsible desk revises and re-queues (revision counter)
//
// This module is the pure core: no I/O, injected clock, deterministic. It sits UPSTREAM of
// apply-decisions.ts (which turns recorded approvals into gated execution) and is fed by the desks
// (executive-desks.ts) and the governed tool surface (lib/mcp/tools.ts approval_required outcomes).
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolOutcome } from "@/lib/mcp/tools";

// What kinds of decisions reach the principal. Mirrors HUMAN_RESERVED plus the desks' artifacts.
export type DecisionKind =
  | "contract" | "invoice" | "payment" | "hire" | "fire"
  | "launch" | "acquisition" | "policy_change" | "legal" | "data_action" | "other";

export type DecisionStatus = "pending" | "approved" | "rejected" | "revising";

export interface PreparedDecision {
  id: string;
  kind: DecisionKind;
  title: string; // one line, executive-grade
  summary: string; // the concise brief the principal actually reads
  artifact: string; // the full drafted thing (contract text, invoice body, launch plan …)
  preparedBy: string; // org role id, e.g. "legal-compliance-analyst"
  status: DecisionStatus;
  revision: number; // how many times it went around the modify loop
  history: { at: number; event: string }[]; // audit trail — every touch recorded
  createdAt: number;
}

export type Verdict =
  | { verb: "approve" }
  | { verb: "reject"; reason?: string }
  | { verb: "modify"; note: string };

export interface QueueState {
  items: PreparedDecision[];
}

export const emptyQueue = (): QueueState => ({ items: [] });

export interface EnqueueInput {
  kind: DecisionKind;
  title: string;
  summary: string;
  artifact: string;
  preparedBy: string;
}

/** Add a prepared decision. Pure: caller supplies clock + id (deterministic in tests). */
export function enqueue(state: QueueState, input: EnqueueInput, opts: { now: number; id: string }): QueueState {
  const item: PreparedDecision = {
    id: opts.id,
    ...input,
    status: "pending",
    revision: 0,
    history: [{ at: opts.now, event: `prepared by ${input.preparedBy}` }],
    createdAt: opts.now,
  };
  return { items: [...state.items, item] };
}

/** What the principal sees when they open the coworker: pending first, oldest first. */
export function executiveView(state: QueueState): PreparedDecision[] {
  return [...state.items]
    .filter((i) => i.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export interface VerdictResult {
  state: QueueState;
  outcome:
    | { kind: "executable"; item: PreparedDecision } // approved → hand to the gated executor
    | { kind: "closed"; item: PreparedDecision } // rejected → done, nothing fires
    | { kind: "revise"; item: PreparedDecision; note: string } // modify → back to the desk
    | { kind: "error"; reason: string };
}

/**
 * The principal's verb, applied. Invariants:
 *  - only PENDING items accept a verdict (no double-approve, no verdict on a closed item)
 *  - approve marks executable — it does NOT execute (the mandate+policy double gate still stands)
 *  - modify re-opens work: status→revising, revision+1, the note lands in the audit history
 */
export function applyVerdict(state: QueueState, id: string, verdict: Verdict, opts: { now: number }): VerdictResult {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx === -1) return { state, outcome: { kind: "error", reason: `no decision ${id}` } };
  const item = state.items[idx];
  if (item.status !== "pending") return { state, outcome: { kind: "error", reason: `decision ${id} is ${item.status}, not pending` } };

  const touch = (updated: PreparedDecision): QueueState => ({
    items: state.items.map((i, n) => (n === idx ? updated : i)),
  });

  if (verdict.verb === "approve") {
    const updated: PreparedDecision = { ...item, status: "approved", history: [...item.history, { at: opts.now, event: "approved by principal" }] };
    return { state: touch(updated), outcome: { kind: "executable", item: updated } };
  }
  if (verdict.verb === "reject") {
    const updated: PreparedDecision = { ...item, status: "rejected", history: [...item.history, { at: opts.now, event: `rejected by principal${verdict.reason ? `: ${verdict.reason}` : ""}` }] };
    return { state: touch(updated), outcome: { kind: "closed", item: updated } };
  }
  // modify
  const updated: PreparedDecision = {
    ...item,
    status: "revising",
    revision: item.revision + 1,
    history: [...item.history, { at: opts.now, event: `modify requested: ${verdict.note}` }],
  };
  return { state: touch(updated), outcome: { kind: "revise", item: updated, note: verdict.note } };
}

/** The desk finished a revision: the item returns to the queue as pending, history intact. */
export function resubmit(state: QueueState, id: string, revised: { summary: string; artifact: string }, opts: { now: number }): QueueState {
  return {
    items: state.items.map((i) =>
      i.id === id && i.status === "revising"
        ? { ...i, ...revised, status: "pending", history: [...i.history, { at: opts.now, event: `revision ${i.revision} resubmitted` }] }
        : i,
    ),
  };
}

/** Bridge from the governed tool surface: an approval_required outcome becomes a queue item. */
export function fromToolOutcome(outcome: ToolOutcome, opts: { now: number; id: string; preparedBy?: string }): EnqueueInput | null {
  if (outcome.status !== "approval_required") return null;
  const kind: DecisionKind = (["contract", "invoice", "payment", "hire", "fire", "launch", "acquisition", "policy_change", "legal", "data_action"] as const)
    .find((k) => outcome.action.includes(k)) ?? "other";
  return {
    kind,
    title: `${outcome.action} (via ${outcome.tool})`,
    summary: outcome.summary,
    artifact: outcome.summary,
    preparedBy: opts.preparedBy ?? "chief-of-staff",
  };
}
