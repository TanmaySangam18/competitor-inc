// Long-horizon operation (v1) — the "runs while you sleep" loop for the agent org. Instead of a single
// goal-run, it runs the supervised org across MULTIPLE cycles, carries a memory summary forward into the
// next cycle (so the org builds on what happened), and RETRIES a cycle that left failed tasks (self-heal,
// bounded). This is the biggest gap in the autonomous-company machine; this is its first honest increment.
//
// Pure + deterministic (execution injected via RunGoalOptions.execute) → testable with zero tokens.
// NOTE: this runs N cycles in-process. TRUE multi-day operation = drive this from the cron scheduler with
// persistence between wake-ups (each cron tick = one cycle, memory loaded from the DB). That wiring is the
// next step; the loop core is here so it's a drop-in for the scheduler.

import { runSupervisedGoal, type RunGoalOptions } from "./orchestrator";
import type { SupervisorOutcome } from "./supervisor";

// A SINGLE operating cycle with PERSISTED memory — the unit a scheduler (cron) calls each tick so the
// agent org runs day-to-day continuously, not just on a manual goal-run. Memory is injected (recall/
// remember bound to lib/engine/memory.ts per company), so this stays pure/testable and needs no new
// migration. Wiring it into the cron loop (fail-soft, flag-gated) is the final step toward a truly
// self-running agent org.
export interface OperatingCycleDeps extends RunGoalOptions {
  recall: () => Promise<string[]>; // load prior cycles' summaries (continuity)
  remember: (note: string) => Promise<void>; // persist this cycle's summary
}

export async function runOperatingCycle(
  goal: string,
  deps: OperatingCycleDeps,
): Promise<{ outcome: SupervisorOutcome; note: string }> {
  const prior = await deps.recall().catch(() => [] as string[]);
  const cycleGoal = prior.length ? `${goal}\n[prior cycles: ${prior.join(" | ")}]` : goal;
  const outcome = await runSupervisedGoal(cycleGoal, deps);
  const note = `${outcome.completed.length} done, ${outcome.failed.length} failed, ${outcome.packets.length} to desk`;
  await deps.remember(note).catch(() => {});
  return { outcome, note };
}

export interface OperatingLoopOptions extends RunGoalOptions {
  cycles: number; // how many operating cycles to run
  maxRetries?: number; // per-cycle retries when tasks failed (self-heal)
}

export interface OperatingLoopResult {
  cycles: SupervisorOutcome[];
  memory: string[]; // what happened each cycle — carried forward + a founder-readable trace
  totalCompleted: number;
  totalFailed: number;
  deskItems: number; // total items escalated to the human across all cycles
  refundedCents: number;
}

export async function runOperatingLoop(goal: string, opts: OperatingLoopOptions): Promise<OperatingLoopResult> {
  const cycles: SupervisorOutcome[] = [];
  const memory: string[] = [];
  const n = Math.max(1, Math.floor(opts.cycles));
  const maxRetries = Math.max(0, opts.maxRetries ?? 0);

  for (let c = 0; c < n; c++) {
    // Carry memory forward: prior cycles inform this one (the honest first step of continuity).
    const cycleGoal = memory.length ? `${goal}\n[prior cycles: ${memory.join(" | ")}]` : goal;

    let outcome = await runSupervisedGoal(cycleGoal, opts);
    let tries = 0;
    // Self-heal: if a cycle left failures, retry it (bounded). Meaningful with a non-deterministic
    // executor; a deterministic one simply confirms the loop doesn't spin.
    while (outcome.failed.length > 0 && tries < maxRetries) {
      tries++;
      outcome = await runSupervisedGoal(cycleGoal, opts);
    }

    cycles.push(outcome);
    memory.push(`cycle ${c + 1}: ${outcome.completed.length} done, ${outcome.failed.length} failed, ${outcome.packets.length} to desk`);
  }

  return {
    cycles,
    memory,
    totalCompleted: cycles.reduce((s, o) => s + o.completed.length, 0),
    totalFailed: cycles.reduce((s, o) => s + o.failed.length, 0),
    deskItems: cycles.reduce((s, o) => s + o.packets.length, 0),
    refundedCents: cycles.reduce((s, o) => s + o.refundedCents, 0),
  };
}
