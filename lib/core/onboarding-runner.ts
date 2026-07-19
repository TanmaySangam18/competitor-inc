// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING CO-PILOT — THE HANDS (ADR-0018). Executes the plan (ADR-0017) step by step.
//
// This is the governed brain that DRIVES the browser and enforces the six hard-stops as real blocks. The
// physical browser backend (Chrome extension / Playwright / claude-in-chrome) is injected as a
// `BrowserDriver` — this module never talks to a screen directly, so it's tested offline with a fake and
// the same runner works behind any backend. The backend runs CUSTOMER-SIDE on their consent; competitor.inc
// ships the co-pilot, it never drives screens from our servers.
//
// THE INVARIANTS (all enforced here, not by politeness):
//  1. CONSENT — nothing runs without an explicit consent flag from the user.
//  2. GOVERNANCE FIRST — every agent step passes governAction (kill switch → policy → audit) BEFORE the
//     driver is touched. A non-AUTO verdict halts the run.
//  3. HARD-STOP FLOOR — the driver is NEVER invoked for a human/hard-stop step, even if a recipe mislabels
//     one: a defensive guard re-checks and refuses. The run PAUSES and hands the tap to the human.
//  4. NO SECRETS — the driver only ever receives a step's `prefill` (guaranteed secret-free by ADR-0017's
//     tests); the co-pilot never types a key, password, or payment detail.
// ─────────────────────────────────────────────────────────────────────────────

import { governAction, type GovernOptions } from "@/lib/core/govern";
import { type OnboardingStep, type SetupRecipe, stepReport } from "@/lib/core/onboarding";

// The physical backend, injected. Minimal + honest: navigate, fill non-secret fields, detect completion.
// A real implementation wraps a browser extension / Playwright / claude-in-chrome; tests pass a fake.
export interface BrowserDriver {
  navigate(url: string): Promise<void>;
  fill(fields: string[]): Promise<void>; // ONLY non-secret prefill (names, scopes, redirect URLs)
  detect(signal: string): Promise<boolean>; // did the expected artifact land? (drives auto-advance)
}

export interface RunnerDeps {
  driver: BrowserDriver;
  consent: boolean; // the user explicitly said "yes, take over" — required, no default
  report?: (text: string) => Promise<void>; // Slack office update per step (office.postToDept)
  govern?: GovernOptions; // injectable audit log + kill switch for tests
}

export type StepOutcome =
  | { status: "did"; step: OnboardingStep } // agent performed it
  | { status: "paused"; step: OnboardingStep; reason: string } // human hard-stop — waiting on the user
  | { status: "blocked"; step: OnboardingStep; reason: string } // governance said no (kill switch / policy)
  | { status: "unverified"; step: OnboardingStep; reason: string }; // agent acted but detect() was false

export interface ServiceRun {
  connectionId: string;
  outcomes: StepOutcome[];
  completed: boolean; // every step 'did' (or already done) — service fully connected
  pausedOn?: OnboardingStep; // the human tap the user now owes, if any
}

async function say(deps: RunnerDeps, text: string) {
  if (deps.report) { try { await deps.report(text); } catch { /* a Slack hiccup never halts setup */ } }
}

/**
 * Run ONE service's steps in order. Stops at the first human hard-stop (returns paused) or a governance
 * block. Agent steps: govern → drive → detect → report. The run is resumable: call again after the human
 * completes the paused tap; already-satisfied steps are skipped via detect().
 */
export async function runService(recipe: SetupRecipe, deps: RunnerDeps): Promise<ServiceRun> {
  const outcomes: StepOutcome[] = [];
  if (!deps.consent) {
    return { connectionId: recipe.connectionId, outcomes, completed: false };
  }

  for (const step of recipe.steps) {
    // (3) HARD-STOP FLOOR — a human step is never driven. Pause and hand the tap over.
    if (step.actor === "human") {
      await say(deps, stepReport(recipe.name, step));
      outcomes.push({ status: "paused", step, reason: step.hardStop ?? "human step" });
      return { connectionId: recipe.connectionId, outcomes, completed: false, pausedOn: step };
    }
    // Defense in depth: even an AGENT step carrying a hardStop (a mislabel) is refused, never driven.
    if (step.hardStop) {
      outcomes.push({ status: "paused", step, reason: `guard: agent step carried hard-stop ${step.hardStop}` });
      return { connectionId: recipe.connectionId, outcomes, completed: false, pausedOn: step };
    }

    // (2) GOVERNANCE FIRST — before the driver is touched.
    const g = governAction({ type: "browser_setup", agent: "engineering" }, { ...deps.govern, input: `${recipe.connectionId}:${step.label}` });
    if (g.decision.verdict !== "AUTO") {
      outcomes.push({ status: "blocked", step, reason: `${g.decision.verdict} — ${g.decision.reason}` });
      return { connectionId: recipe.connectionId, outcomes, completed: false };
    }

    // Drive: navigate + fill NON-SECRET prefill only.
    try {
      if (step.url) await deps.driver.navigate(step.url);
      if (step.prefill?.length) await deps.driver.fill(step.prefill);
    } catch (e) {
      outcomes.push({ status: "unverified", step, reason: `driver error: ${e instanceof Error ? e.message : "unknown"}` });
      return { connectionId: recipe.connectionId, outcomes, completed: false };
    }

    // Verify (auto-advance only on a real signal).
    if (step.detect) {
      const ok = await deps.driver.detect(step.detect).catch(() => false);
      if (!ok) {
        await say(deps, `… ${recipe.name}: still waiting to verify ${step.detect}`);
        outcomes.push({ status: "unverified", step, reason: `detect(${step.detect}) false` });
        return { connectionId: recipe.connectionId, outcomes, completed: false };
      }
    }
    await say(deps, stepReport(recipe.name, step));
    outcomes.push({ status: "did", step });
  }
  return { connectionId: recipe.connectionId, outcomes, completed: true };
}

export interface OnboardingRun {
  ran: boolean; // false only when consent was withheld
  services: ServiceRun[];
  pausedOn?: { connectionId: string; step: OnboardingStep }; // the one human tap to hand back
  allConnected: boolean;
}

/**
 * Run the whole plan across services in order, stopping at the FIRST human hard-stop so the user does one
 * tap at a time (never a wall of prompts). Resumable: call again after each tap. Consent gates everything.
 */
export async function runOnboarding(recipes: SetupRecipe[], deps: RunnerDeps): Promise<OnboardingRun> {
  if (!deps.consent) {
    await say(deps, "Onboarding co-pilot: consent not given — I won't touch your screen. Say the word and I'll take it from here.");
    return { ran: false, services: [], allConnected: false };
  }
  const services: ServiceRun[] = [];
  for (const recipe of recipes) {
    const run = await runService(recipe, deps);
    services.push(run);
    if (run.pausedOn) {
      return { ran: true, services, pausedOn: { connectionId: run.connectionId, step: run.pausedOn }, allConnected: false };
    }
    if (!run.completed) {
      return { ran: true, services, allConnected: false }; // blocked/unverified — stop, honest
    }
  }
  return { ran: true, services, allConnected: services.every((s) => s.completed) };
}
