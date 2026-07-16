// ─────────────────────────────────────────────────────────────────────────────
// THE LOOP ENGINE — Loop Engineering's OUTER cycle (founder directive 2026-07-15).
//
// The inner loop already exists: org-run.ts decomposes a goal into a task DAG and advances it one
// crash-safe step at a time (Plan → Build → Test → Review → Fix → Deploy). What was missing is the OUTER
// loop that makes the system autonomous rather than one-shot:
//
//     Plan → Build → Test → Review → Fix → Deploy → MONITOR → LEARN → REPEAT
//
// This module owns Monitor/Learn/Repeat. On each iteration's outcome it (1) EVALUATES the result against
// the objective's success criteria — with EVIDENCE, never assertion (unknown ≠ met, the honesty floor);
// (2) appends LEARNINGS to an append-only store so the next iteration continues instead of restarting;
// (3) either advances to the next objective (met) or generates the next corrective iteration (unmet),
// feeding the learnings forward; and (4) escalates to the human ONLY when an action genuinely needs it —
// reusing autopilot.autopilotMode so the escalation logic can never drift from the rest of the platform.
//
// ONE ENGINE, TWO TENANTS: `tenant` is "competitor.inc" (company #0 — the agents building the product
// itself, the human is the founder) OR a customer id (the agents running that customer's company). Same
// state machine, same floor. Pure + deterministic (injected clock): the DB, the org-run driver, and the
// Slack digest wrap it — this is the testable core, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

import { autopilotMode } from "@/lib/org/autopilot";
import type { ActionContext } from "@/lib/engine/policy";

export type LoopPhase = "plan" | "build" | "test" | "review" | "fix" | "deploy" | "monitor" | "learn";
export const LOOP_PHASES: readonly LoopPhase[] = ["plan", "build", "test", "review", "fix", "deploy", "monitor", "learn"] as const;

export type ObjectiveStatus = "pending" | "active" | "met" | "blocked";
export type LoopStatus = "idle" | "running" | "all-met" | "needs-human";

export interface Objective {
  id: string;
  goal: string;
  successCriteria: string[]; // each must be EVIDENCED to count as met — no criterion, no autonomous "done"
  status: ObjectiveStatus;
  iterations: number;
  maxIterations: number; // guardrail: the loop never spins forever — hit the cap ⇒ block + escalate
  blockedReason?: string;
}

export interface Learning {
  id: string;
  objectiveId: string;
  iteration: number;
  at: number;
  kind: "win" | "failure" | "insight";
  note: string;
}

export interface LoopState {
  tenant: string;
  objectives: Objective[];
  learnings: Learning[]; // append-only + compounding — NEVER cleared between iterations (that's the point)
  status: LoopStatus;
  currentRunId?: string; // the org-run executing the active objective's current iteration (driver-managed)
}

// A criterion counts as met ONLY with a proof attached and passed=true. Absent evidence is treated as
// unmet, not as pass — the loop cannot declare victory on something it didn't verify.
export interface Evidence {
  criterion: string;
  passed: boolean;
  proof?: string;
}

export interface IterationOutcome {
  objectiveId: string;
  evidence: Evidence[];
  learnings: { kind: Learning["kind"]; note: string }[];
  // If this iteration wants to take a consequential action, name it here; the loop checks whether it may
  // auto-run before advancing. High-consequence (money, deploy-to-prod, contracts…) escalates to the human.
  action?: ActionContext;
}

const DEFAULT_MAX_ITERATIONS = 6;

/** Seed a loop from a roadmap of high-level goals. The founder defines goals; the loop drives them. */
export function initLoop(tenant: string, roadmap: { goal: string; successCriteria: string[]; maxIterations?: number }[]): LoopState {
  return {
    tenant,
    status: "idle",
    learnings: [],
    objectives: roadmap.map((o, i) => ({
      id: `obj-${i + 1}`,
      goal: o.goal,
      successCriteria: o.successCriteria,
      status: "pending",
      iterations: 0,
      maxIterations: o.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    })),
  };
}

/** The objective currently being pursued (the single active one), if any. */
export function activeObjective(state: LoopState): Objective | undefined {
  return state.objectives.find((o) => o.status === "active");
}

/** Promote the next pending objective to active. Returns a new state; sets all-met when nothing's left. */
export function startNext(state: LoopState): LoopState {
  if (activeObjective(state)) return state; // one at a time — don't start a second in parallel
  const idx = state.objectives.findIndex((o) => o.status === "pending");
  if (idx < 0) {
    const anyBlocked = state.objectives.some((o) => o.status === "blocked");
    return { ...state, status: anyBlocked ? "needs-human" : "all-met" };
  }
  const objectives = state.objectives.map((o, i) => (i === idx ? { ...o, status: "active" as ObjectiveStatus } : o));
  return { ...state, objectives, status: "running" };
}

/** Verify an objective against its criteria. Met iff EVERY criterion has passed evidence (unknown ≠ pass). */
export function evaluate(objective: Objective, evidence: Evidence[]): { met: boolean; unmet: string[] } {
  const passed = new Set(evidence.filter((e) => e.passed && e.proof).map((e) => e.criterion));
  const unmet = objective.successCriteria.filter((c) => !passed.has(c));
  return { met: unmet.length === 0, unmet };
}

/** The failure/insight notes to feed FORWARD into the next iteration so it continues, not restarts. */
export function recallForNextIteration(state: LoopState, objectiveId: string): string[] {
  return state.learnings
    .filter((l) => l.objectiveId === objectiveId && l.kind !== "win")
    .map((l) => l.note);
}

/** The auto-generated goal for the next iteration — "every completed task generates the next." */
export function nextIterationGoal(objective: Objective, unmet: string[], recalled: string[]): string {
  const lines = [
    `CONTINUE (do not restart) the objective: ${objective.goal}`,
    unmet.length ? `Still unmet: ${unmet.join("; ")}` : "",
    recalled.length ? `Apply what earlier iterations learned: ${recalled.join("; ")}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

/** Does this action need the human? Delegates to the ONE escalation authority (autopilot), never re-implemented. */
export function needsHuman(action: ActionContext): boolean {
  return autopilotMode(action).mode !== "auto";
}

/**
 * The outer-loop transition. Given an iteration's outcome:
 *  - append its learnings (compounding memory);
 *  - if it wants a human-gated action → status needs-human, objective stays active (nothing auto-runs);
 *  - else evaluate the evidence: met → mark met + advance to the next objective;
 *      unmet → iterate again with learnings carried forward, unless the iteration cap is hit → block + escalate.
 */
export function advance(state: LoopState, outcome: IterationOutcome, now: number): LoopState {
  const obj = state.objectives.find((o) => o.id === outcome.objectiveId);
  if (!obj || obj.status !== "active") return state; // only the active objective can advance

  // 1) Record learnings — always, win or lose. This is the store that makes the next run smarter.
  const baseSeq = state.learnings.length;
  const learnings: Learning[] = [
    ...state.learnings,
    ...outcome.learnings.map((l, i) => ({
      id: `lrn-${baseSeq + i + 1}`,
      objectiveId: obj.id,
      iteration: obj.iterations + 1,
      at: now,
      kind: l.kind,
      note: l.note,
    })),
  ];

  // 2) Escalation gate — a consequential action pauses the loop for the human. The floor, reused.
  if (outcome.action && needsHuman(outcome.action)) {
    return { ...state, learnings, status: "needs-human" };
  }

  const iterations = obj.iterations + 1;
  const { met } = evaluate(obj, outcome.evidence);

  // 3a) Met — verified against every criterion. Mark it, then auto-advance to the next objective.
  if (met) {
    const objectives = state.objectives.map((o) => (o.id === obj.id ? { ...o, status: "met" as ObjectiveStatus, iterations } : o));
    return startNext({ ...state, objectives, learnings, status: "running" });
  }

  // 3b) Unmet + out of iterations — block and escalate rather than loop forever.
  if (iterations >= obj.maxIterations) {
    const objectives = state.objectives.map((o) =>
      o.id === obj.id ? { ...o, status: "blocked" as ObjectiveStatus, iterations, blockedReason: `unmet after ${iterations} iterations` } : o,
    );
    return { ...state, objectives, learnings, status: "needs-human" };
  }

  // 3c) Unmet, iterations remain — stay active; the next tick re-plans with the recalled learnings.
  const objectives = state.objectives.map((o) => (o.id === obj.id ? { ...o, iterations } : o));
  return { ...state, objectives, learnings, status: "running" };
}

/** The Slack digest content (pure string): progress, the active goal, blockers, recent learnings. */
export function digest(state: LoopState): string {
  const met = state.objectives.filter((o) => o.status === "met").length;
  const total = state.objectives.length;
  const active = activeObjective(state);
  const blocked = state.objectives.filter((o) => o.status === "blocked");
  const recent = state.learnings.slice(-3).map((l) => `  · [${l.kind}] ${l.note}`);
  return [
    `Loop · ${state.tenant} — ${met}/${total} objectives met · ${state.status}`,
    active ? `Now: ${active.goal} (iteration ${active.iterations}/${active.maxIterations})` : "No active objective",
    blocked.length ? `NEEDS YOU: ${blocked.map((b) => `${b.goal} — ${b.blockedReason}`).join(" | ")}` : "",
    recent.length ? `Recent learnings:\n${recent.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
