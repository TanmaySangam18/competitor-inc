// ─────────────────────────────────────────────────────────────────────────────
// THE RUN: idea in, working product out, measured.
//
// The goal is "everything done and dusted under 45 minutes". That is a claim about elapsed time, and a
// claim about elapsed time is worthless unless something counts it. This counts it.
//
// THE RULE THIS MODULE ENFORCES: a phase that could not run is BLOCKED, never DONE, and the reason names
// the exact thing missing. The tempting shortcut is to let a skipped phase pass so the total looks fast.
// A 12 minute run that skipped deploy is not a fast run, it is a run that did not deploy, and a timer
// that hides that is worse than no timer at all.
// ─────────────────────────────────────────────────────────────────────────────

export type PhaseId =
  | "understand" | "validate" | "plan" | "build" | "deploy" | "verify" | "watch" | "reach";

export type PhaseState = "pending" | "running" | "done" | "blocked" | "refused";

export interface Phase {
  id: PhaseId;
  /** Plain words: this is read by a student, not an engineer. */
  label: string;
  /** Which of the six goal steps this phase serves, so the work stays honest about its purpose. */
  goalStep: number;
  /** Environment variables without which this phase cannot run at all. */
  requires: readonly string[];
}

export const PHASES: readonly Phase[] = [
  { id: "understand", label: "Understand what you asked for", goalStep: 4, requires: [] },
  { id: "validate", label: "Check whether anyone wants it", goalStep: 4, requires: [] },
  { id: "plan", label: "Decide who does what", goalStep: 4, requires: [] },
  { id: "build", label: "Write the software", goalStep: 5, requires: ["FULLSTACK_BUILDS", "GITHUB_TOKEN", "FULLSTACK_LLM_API_KEY"] },
  { id: "deploy", label: "Put it on the internet", goalStep: 5, requires: ["FULLSTACK_VERCEL_TOKEN"] },
  { id: "verify", label: "Confirm it actually answers", goalStep: 5, requires: [] },
  { id: "watch", label: "Keep watching it", goalStep: 5, requires: [] },
  { id: "reach", label: "Tell people about it", goalStep: 5, requires: ["AGENTMAIL_API_KEY"] },
] as const;

export interface PhaseRun {
  id: PhaseId;
  state: PhaseState;
  startedAt?: number;
  endedAt?: number;
  /** Present when blocked or refused: names what is missing, or why it was refused. */
  reason?: string;
}

export interface Run {
  idea: string;
  startedAt: number;
  phases: PhaseRun[];
}

export const TARGET_MINUTES = 45;

export const phaseById = (id: PhaseId): Phase => PHASES.find((p) => p.id === id)!;

/**
 * Known shapes for the credentials this project needs.
 *
 * WHY THIS EXISTS: a presence check reported "READY" over a GITHUB_TOKEN that was 8 characters of
 * clipboard debris, and GitHub answered 401. Presence is not validity. Shape is not validity either
 * (only the provider can confirm that), but it catches the overwhelmingly common real failure, which is
 * a bad paste, and it costs nothing. Reporting ready over junk is the exact false green this codebase
 * exists to refuse.
 */
const SHAPES: Record<string, { test: (v: string) => boolean; hint: string }> = {
  GITHUB_TOKEN: {
    test: (v) => /^(ghp_|gho_|ghu_|ghs_|github_pat_)/.test(v) && v.length >= 30,
    hint: "a GitHub token starts with ghp_ or github_pat_ and is at least 30 characters",
  },
  FULLSTACK_VERCEL_TOKEN: {
    test: (v) => /^[A-Za-z0-9_-]{20,}$/.test(v),
    hint: "a Vercel token is at least 20 characters with no spaces",
  },
  FULLSTACK_LLM_API_KEY: {
    test: (v) => v.length >= 20,
    hint: "a model key is at least 20 characters",
  },
  AGENTMAIL_API_KEY: {
    test: (v) => v.length >= 20,
    hint: "an AgentMail key is at least 20 characters",
  },
};

export interface CredentialProblem {
  key: string;
  problem: "absent" | "malformed";
  hint?: string;
}

/** Requirements that are absent OR obviously not the thing they claim to be. */
export function credentialProblems(phase: Phase, env: Record<string, string | undefined>): CredentialProblem[] {
  const out: CredentialProblem[] = [];
  for (const k of phase.requires) {
    const v = (env[k] ?? "").trim();
    if (!v) { out.push({ key: k, problem: "absent" }); continue; }
    const shape = SHAPES[k];
    if (shape && !shape.test(v)) out.push({ key: k, problem: "malformed", hint: shape.hint });
  }
  return out;
}

/** Which required variables are absent or blank. Kept for callers that only care about presence. */
export function missingFor(phase: Phase, env: Record<string, string | undefined>): string[] {
  return phase.requires.filter((k) => !(env[k] ?? "").trim());
}

export function startRun(idea: string, at: number): Run {
  return {
    idea: idea.trim(),
    startedAt: at,
    phases: PHASES.map((p) => ({ id: p.id, state: "pending" as PhaseState })),
  };
}

/** Begin a phase, or mark it blocked when its requirements are absent. Never silently skips. */
export function begin(run: Run, id: PhaseId, at: number, env: Record<string, string | undefined>): Run {
  const phase = phaseById(id);
  const problems = credentialProblems(phase, env);
  const reason = problems.length
    ? problems
        .map((c) => (c.problem === "absent" ? `${c.key} is not set` : `${c.key} does not look right (${c.hint})`))
        .join(". ") + "."
    : undefined;
  return {
    ...run,
    phases: run.phases.map((p) =>
      p.id !== id
        ? p
        : reason
          ? { ...p, state: "blocked", reason }
          : { ...p, state: "running", startedAt: at }
    ),
  };
}

/** Finish a phase. Refuses to mark a blocked phase done, because that is the lie this module prevents. */
export function finish(run: Run, id: PhaseId, at: number, outcome: { ok: boolean; reason?: string }): Run {
  return {
    ...run,
    phases: run.phases.map((p) => {
      if (p.id !== id) return p;
      if (p.state === "blocked") return p; // a blocked phase cannot be completed by asserting it was
      return { ...p, state: outcome.ok ? "done" : "refused", endedAt: at, reason: outcome.reason };
    }),
  };
}

export interface RunReport {
  idea: string;
  elapsedMs: number;
  elapsedMinutes: number;
  /** True only when EVERY phase is done. A blocked phase means the answer is no. */
  complete: boolean;
  /** True only when complete AND inside the target. Never true on a partial run. */
  withinTarget: boolean;
  done: PhaseId[];
  blocked: Array<{ id: PhaseId; label: string; reason: string }>;
  perPhaseMs: Array<{ id: PhaseId; label: string; ms: number }>;
  /** The one honest sentence. */
  verdict: string;
}

export function report(run: Run, now: number): RunReport {
  const elapsedMs = Math.max(0, now - run.startedAt);
  const minutes = Math.round((elapsedMs / 60000) * 10) / 10;

  const done = run.phases.filter((p) => p.state === "done").map((p) => p.id);
  const blocked = run.phases
    .filter((p) => p.state === "blocked" || p.state === "refused")
    .map((p) => ({ id: p.id, label: phaseById(p.id).label, reason: p.reason ?? "no reason recorded" }));
  const perPhaseMs = run.phases
    .filter((p) => p.startedAt !== undefined && p.endedAt !== undefined)
    .map((p) => ({ id: p.id, label: phaseById(p.id).label, ms: p.endedAt! - p.startedAt! }));

  const complete = run.phases.every((p) => p.state === "done");
  const withinTarget = complete && minutes <= TARGET_MINUTES;

  const verdict = complete
    ? withinTarget
      ? `Done in ${minutes} minutes, inside the ${TARGET_MINUTES} minute target.`
      : `Done, but it took ${minutes} minutes against a ${TARGET_MINUTES} minute target.`
    : blocked.length
      ? `Not done. ${blocked.length} of ${run.phases.length} phase${blocked.length === 1 ? "" : "s"} could not run, so the ${minutes} minutes elapsed does not mean anything yet.`
      : `Still running. ${done.length} of ${run.phases.length} phases finished in ${minutes} minutes.`;

  return { idea: run.idea, elapsedMs, elapsedMinutes: minutes, complete, withinTarget, done, blocked, perPhaseMs, verdict };
}

/** Everything standing between this codebase and the founder's goal, named. Read from env, not guessed. */
export function whatIsMissing(env: Record<string, string | undefined>): Array<CredentialProblem & { forPhase: string }> {
  const out: Array<CredentialProblem & { forPhase: string }> = [];
  for (const p of PHASES) for (const c of credentialProblems(p, env)) out.push({ ...c, forPhase: p.label });
  return out;
}
