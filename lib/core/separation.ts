// lib/core/separation.ts — VERIFICATION SEPARATION (Tier C3 · REQUIREMENTS §5, DoD #6).
//
// "Builder agents MUST NOT be the sole verifiers of their own work." An agent may never verify or sign off
// anything in its own LINEAGE — the chain of agents that authored it (the author, its manager, any agent it
// delegated from). The Code Reviewer role (ORG #20) "never reviews its own lineage." Pure + deterministic.
//
// Also enforces the regression trigger: a prompt or model change re-runs the regression suite BEFORE it
// ships (REQUIREMENTS §5 — "model drift breaks behavior with zero code changes").

// Do two lineages overlap at all? (any shared agent/role id)
export function sharesLineage(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return b.some((x) => set.has(x));
}

// May `reviewer` verify work authored by `authorLineage`? Only if the reviewer is NOT in that lineage.
export function canVerify(reviewer: string, authorLineage: readonly string[]): boolean {
  return !authorLineage.includes(reviewer);
}

// Pick a reviewer with no lineage overlap. Returns null if every candidate is tainted (→ escalate: there is
// no independent verifier, which itself is a finding, never a silent self-approval).
export function assignReviewer(candidates: readonly string[], authorLineage: readonly string[]): string | null {
  return candidates.find((c) => canVerify(c, authorLineage)) ?? null;
}

export type ChangeKind = "prompt" | "model" | "code" | "config" | "docs";

// A change that can alter behavior must re-run the regression wall before shipping. Prompts + models are
// explicitly included (they change the whole workforce's behavior with no code diff). Docs never do.
export function requiresRegression(change: ChangeKind): boolean {
  return change === "prompt" || change === "model" || change === "code" || change === "config";
}
