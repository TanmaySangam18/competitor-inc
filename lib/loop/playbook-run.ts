import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlaybook } from "@/lib/core/playbooks";
import { initLoop, type LoopState, type Objective } from "./loop-engine";
import { insertLoop, loadLoop, saveLoop } from "./loop-driver";

// Starting a playbook (ADR-0022) = compiling it into a loop OBJECTIVE on the tenant's existing loop —
// no second execution path. No loop yet ⇒ the playbook births one (same shape ignition uses); a loop
// exists ⇒ the objective is appended and the next heartbeat picks it up. A human-paused loop
// (needs-human) stays paused: the objective queues behind the human's decision, never around it.

export type StartResult = { ok: true; detail: string } | { ok: false; error: string };

export async function startPlaybook(
  sb: SupabaseClient,
  input: { userId: string; tenant: string; playbookId: string; company: { name: string; idea: string } },
): Promise<StartResult> {
  const pb = getPlaybook(input.playbookId);
  if (!pb) return { ok: false, error: `unknown playbook: ${input.playbookId}` };
  const obj = pb.goal(input.company);

  const existing = await loadLoop(sb, input.tenant).catch(() => null);
  if (!existing) {
    const state = initLoop(input.tenant, [obj]);
    await insertLoop(sb, input.userId, state);
    return { ok: true, detail: `${pb.name} started — new loop for ${input.tenant}; the next heartbeat begins it` };
  }

  // Only the loop's owner may point its org at a new strategy.
  if (existing.userId !== input.userId) return { ok: false, error: "not your loop" };

  const state: LoopState = existing.state;
  const objective: Objective = {
    id: `${pb.id}-${state.objectives.length + 1}`,
    goal: obj.goal,
    successCriteria: obj.successCriteria,
    status: "pending",
    iterations: 0,
    maxIterations: obj.maxIterations,
  };
  state.objectives = [...state.objectives, objective];
  // A finished roadmap wakes back up; a human-paused one does NOT — the pause outranks the playbook.
  if (state.status === "all-met") state.status = "idle";
  await saveLoop(sb, state);

  const paused = state.status === "needs-human";
  return {
    ok: true,
    detail: `${pb.name} queued on ${input.tenant}'s roadmap` + (paused ? " — loop is waiting on the human; it runs after they act" : "; the next heartbeat picks it up"),
  };
}
