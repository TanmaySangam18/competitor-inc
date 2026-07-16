import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advance,
  activeObjective,
  digest,
  nextIterationGoal,
  recallForNextIteration,
  startNext,
  evaluate,
  type Evidence,
  type LoopState,
} from "./loop-engine";
import { createOrgRun, type OrgRun } from "@/lib/engine/org-run";
import { insertOrgRun, loadOrgRun } from "@/lib/engine/org-runs-db";
import { postToSlack } from "@/lib/engine/slack";

// ─────────────────────────────────────────────────────────────────────────────
// THE LOOP DRIVER — wires the pure outer loop (loop-engine) to the durable inner loop (org-run).
//
// One tick = one small, crash-safe step of the OUTER cycle:
//   idle            → promote the first objective, start running
//   running, no run → spin an org-run for the active objective's next iteration (recall fed forward)
//   running, run …  → still executing? no-op (the org-run cron owns the inner loop's progress)
//   running, run ✓✗ → gather EVIDENCE from the run's real task proofs, extract learnings, advance()
//   needs-human     → nothing auto-runs; the digest already told the human what waits
//
// The driver never talks to a model — org-run's step executor owns cognition. Everything here is
// injectable (tests run with zero network); the defaults bind to the real DB + Slack.
// ─────────────────────────────────────────────────────────────────────────────

interface LoopRow {
  tenant: string;
  user_id: string;
  state: unknown;
  current_run_id: string | null;
}

export async function loadLoop(sb: SupabaseClient, tenant: string): Promise<{ state: LoopState; userId: string } | null> {
  const { data, error } = await sb.from("loops").select("tenant, user_id, state, current_run_id").eq("tenant", tenant).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as LoopRow;
  const state = row.state as LoopState;
  state.currentRunId = row.current_run_id ?? undefined;
  return { state, userId: row.user_id };
}

export async function saveLoop(sb: SupabaseClient, state: LoopState): Promise<void> {
  const { currentRunId, ...pure } = state;
  const { error } = await sb
    .from("loops")
    .update({ state: pure, current_run_id: currentRunId ?? null, updated_at: new Date().toISOString() })
    .eq("tenant", state.tenant);
  if (error) throw error;
}

/** All registered loop tenants (the cron ticks each once per heartbeat). Bounded + oldest-touched first. */
export async function loadAllTenants(sb: SupabaseClient, limit = 5): Promise<string[]> {
  const { data, error } = await sb.from("loops").select("tenant").order("updated_at", { ascending: true }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { tenant: string }).tenant);
}

export async function insertLoop(sb: SupabaseClient, userId: string, state: LoopState): Promise<void> {
  const { currentRunId, ...pure } = state;
  const { error } = await sb.from("loops").insert({ tenant: state.tenant, user_id: userId, state: pure, current_run_id: currentRunId ?? null });
  if (error) throw error;
}

// HONEST DEFAULT evidence gathering: a success criterion is evidenced ONLY by a done task whose goal or
// proof VALUE actually mentions it (case-insensitive). Anything unmatched stays unmet — the loop iterates
// rather than declaring victory. Roadmap criteria should therefore be phrased as verifiable artifacts
// ("deploy url serves 200", "regression wall green"), which is exactly the discipline we want anyway.
export function evidenceFromRun(run: OrgRun, criteria: string[]): Evidence[] {
  const done = run.tasks.filter((t) => t.state === "done" && t.proof);
  return criteria.map((criterion) => {
    const c = criterion.toLowerCase();
    const hit = done.find((t) => t.goal.toLowerCase().includes(c) || String(t.proof!.value).toLowerCase().includes(c));
    return hit ? { criterion, passed: true, proof: `${hit.proof!.kind}:${hit.proof!.value}` } : { criterion, passed: false };
  });
}

// The learnings a finished run teaches: every failed task is a failure note; a fully-green run is a win.
export function learningsFromRun(run: OrgRun): { kind: "win" | "failure" | "insight"; note: string }[] {
  const failures = run.tasks
    .filter((t) => t.state === "failed")
    .map((t) => ({ kind: "failure" as const, note: `task "${t.goal.slice(0, 80)}" failed (role: ${t.role})` }));
  if (failures.length) return failures;
  return [{ kind: "win", note: `iteration completed: ${run.tasks.filter((t) => t.state === "done").length}/${run.tasks.length} tasks done` }];
}

export interface DriverDeps {
  load: (tenant: string) => Promise<{ state: LoopState; userId: string } | null>;
  save: (state: LoopState) => Promise<void>;
  createRun: (userId: string, goal: string) => Promise<string>; // returns the new run id
  loadRun: (runId: string) => Promise<OrgRun | null>;
  notify: (text: string) => Promise<void>; // Slack digest/escalation — best-effort, never blocks the tick
  now: () => number;
}

export function defaultDeps(sb: SupabaseClient, slackChannel?: string): DriverDeps {
  return {
    load: (tenant) => loadLoop(sb, tenant),
    save: (state) => saveLoop(sb, state),
    createRun: async (userId, goal) => {
      const run = createOrgRun(`lr-${Date.now().toString(36)}`, goal, { orgPlan: true });
      await insertOrgRun(sb, userId, null, run);
      return run.id;
    },
    loadRun: async (runId) => (await loadOrgRun(sb, runId))?.run ?? null,
    notify: async (text) => {
      if (!slackChannel) return;
      try {
        await postToSlack(slackChannel, text);
      } catch {
        /* a digest must never break the loop */
      }
    },
    now: () => Date.now(),
  };
}

export type TickResult =
  | { acted: "started-objective" | "spun-iteration" | "advanced" | "waiting" | "paused" | "finished"; detail: string }
  | { acted: "no-loop"; detail: string };

/** One outer-loop tick for a tenant. Crash-safe: every mutation persists before the tick returns. */
export async function tickLoop(tenant: string, deps: DriverDeps): Promise<TickResult> {
  const found = await deps.load(tenant);
  if (!found) return { acted: "no-loop", detail: `no loop registered for ${tenant}` };
  let { state } = found;
  const { userId } = found;

  // Terminal / paused states: nothing runs. (needs-human clears when the human acts via the decision queue.)
  if (state.status === "all-met") return { acted: "finished", detail: "roadmap complete" };
  if (state.status === "needs-human") return { acted: "paused", detail: "waiting on the human — nothing auto-runs" };

  // Idle → promote the first objective.
  if (state.status === "idle") {
    state = startNext(state);
    await deps.save(state);
    await deps.notify(digest(state));
    return { acted: "started-objective", detail: activeObjective(state)?.goal ?? "none pending" };
  }

  const obj = activeObjective(state);
  if (!obj) {
    state = startNext(state); // repair: running with nothing active — promote or settle to all-met
    await deps.save(state);
    return { acted: state.status === "all-met" ? "finished" : "started-objective", detail: state.status };
  }

  // No run in flight → spin the next iteration's org-run, learnings fed forward.
  if (!state.currentRunId) {
    const goal = nextIterationGoal(obj, evaluate(obj, []).unmet, recallForNextIteration(state, obj.id));
    const runId = await deps.createRun(userId, goal);
    state.currentRunId = runId;
    await deps.save(state);
    return { acted: "spun-iteration", detail: `${obj.id} iteration ${obj.iterations + 1} → run ${runId}` };
  }

  // A run is in flight — has the inner loop finished it?
  const run = await deps.loadRun(state.currentRunId);
  if (!run) {
    // The run vanished (migration gap / manual delete). Honest recovery: drop the pointer and re-spin next tick.
    state.currentRunId = undefined;
    await deps.save(state);
    return { acted: "waiting", detail: "run missing — pointer cleared, will re-spin" };
  }
  if (run.status === "pending" || run.status === "running") {
    return { acted: "waiting", detail: `run ${run.id} still ${run.status}` };
  }

  // Run terminal → evidence + learnings from what ACTUALLY happened, then the outer transition.
  const outcome = {
    objectiveId: obj.id,
    evidence: run.status === "done" ? evidenceFromRun(run, obj.successCriteria) : [],
    learnings: learningsFromRun(run),
  };
  state.currentRunId = undefined;
  state = advance(state, outcome, deps.now());
  await deps.save(state);
  await deps.notify(digest(state));
  return { acted: "advanced", detail: `${obj.id} → ${state.objectives.find((o) => o.id === obj.id)?.status} · loop ${state.status}` };
}
