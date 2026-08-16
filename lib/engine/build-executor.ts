// Phase B seam — a build-capable executor for the supervisor. Routes BUILD tasks to a REAL builder
// (injected: our existing generateSiteFiles+buildOnGitHub for static sites today, an OpenHands run later)
// and produces a live-URL proof only after INDEPENDENT verification. It never fakes a build: if no builder
// is available it degrades to the honest simulated path; if a build can't be verified, the task FAILS.
// Pure (builder + verifier injected) so it's testable with zero infra / tokens.

import type { AgentRole, Proof } from "@/lib/core/types";
import type { AgentInstance } from "./agent-lifecycle";
import type { AgentTask } from "./task-queue";
import type { ExecuteFn, TaskResult } from "./supervisor";
import { simulatedExecute } from "./orchestrator";

// A real builder: given a goal, return a live artifact URL (+ real spend), or null if it can't build here.
export type BuildFn = (goal: string) => Promise<{ url: string; spentCents?: number } | null>;
// Independent verification of the built artifact (prod passes verifyProof; default = https shape check).
export type VerifyUrlFn = (url: string) => Promise<boolean> | boolean;

export interface BuildExecuteOptions {
  build: BuildFn;
  verifyUrl?: VerifyUrlFn;
  verifierRole?: AgentRole; // independent verifier — MUST differ from the builder role ("engineering")
  buildTaskIds?: string[]; // which task ids count as "build" (default ["build"])
}

export function makeBuildExecute(opts: BuildExecuteOptions): ExecuteFn {
  const buildIds = new Set(opts.buildTaskIds ?? ["build"]);
  const verify = opts.verifyUrl ?? ((u: string) => /^https:\/\/\S+$/.test(u));
  const verifier: AgentRole = opts.verifierRole ?? "support";

  return async (inst: AgentInstance, task: AgentTask, inbound?: string): Promise<TaskResult> => {
    if (!buildIds.has(task.id)) return simulatedExecute(inst, task, inbound);

    let built: Awaited<ReturnType<BuildFn>> = null;
    try {
      built = await opts.build(task.goal);
    } catch {
      built = null;
    }
    if (!built) return simulatedExecute(inst, task, inbound); // no real build available → honest sim fallback

    const ok = await verify(built.url);
    if (!ok) return { ok: false, spentCents: built.spentCents ?? 0 }; // built but unverifiable → fail, no fake proof

    const proof: Proof = { kind: "url", value: built.url };
    return { ok: true, spentCents: built.spentCents ?? 0, proof, verifierRole: verifier };
  };
}
