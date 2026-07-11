// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SETUP — "connect your accounts, everything sets itself up." ([[zero-config-onboarding]])
//
// The founder's one hard rule: a user's ONLY job is to connect accounts; from there the org configures
// itself. This module turns raw connection status into (1) the honest read of what the org can do RIGHT
// NOW, and (2) the SINGLE highest-value next connection, phrased in plain language — no flags, no
// migrations, no jargon. The UI + the engine both read this, so onboarding is connect-and-go.
//
// Honesty floor: readiness reflects REAL connections only (the caps are real booleans) — never a fake
// "all set." Pure + deterministic. No I/O.
// ─────────────────────────────────────────────────────────────────────────────

export interface SetupSignals {
  github: boolean; // can create + own repos (write the code it builds)
  modelReady: boolean; // a usable model (a connected key, or the built-in local model)
  deploy: boolean; // can deploy what it builds (Vercel connected)
  outbound: boolean; // at least one outbound channel connected (email / social) — always approval-gated
}

export type ReadyLevel = "connect-to-start" | "can-build" | "can-build-and-run" | "fully-operating";

export interface NextStep {
  connect: string; // what to connect, in plain words
  unlocks: string; // what connecting it lets the org do
}

export interface Readiness {
  level: ReadyLevel;
  headline: string; // one plain sentence — no flags, no jargon
  can: string[]; // what the org can do right now, in plain words
  nextStep: NextStep | null; // the single highest-value next connection, or null when fully set up
}

/** Derive setup signals from capabilities() output. Only real connections count. */
export function signalsFromCaps(caps: Record<string, boolean>): SetupSignals {
  return {
    github: !!caps.github,
    modelReady: !!caps.model,
    deploy: !!caps.deploy,
    outbound: !!(caps.email || caps.ads || caps.bluesky || caps.mastodon || caps.reddit),
  };
}

// The single highest-value thing to connect next — the FIRST gap in dependency order. Null when nothing's
// missing that matters. Plain language: the user reads an outcome, never a setting.
function nextGap(s: SetupSignals): NextStep | null {
  if (!s.github) return { connect: "GitHub", unlocks: "the org can write and own the code it builds" };
  if (!s.modelReady) return { connect: "an AI model (or just use the built-in local one)", unlocks: "the org can actually write the software" };
  if (!s.deploy) return { connect: "Vercel", unlocks: "the org can deploy and run what it builds — not just write it" };
  if (!s.outbound) return { connect: "email or a social account", unlocks: "the org can reach customers for you (you approve anything that goes out)" };
  return null;
}

/** The plain-language readiness read the onboarding surface shows. */
export function assessSetup(s: SetupSignals): Readiness {
  const canBuild = s.github && s.modelReady;
  const canRun = canBuild && s.deploy;
  const next = nextGap(s);

  const can: string[] = [];
  if (canBuild) can.push("build real software from a plain description");
  if (canRun) can.push("deploy it live and keep it running");
  if (canRun && s.outbound) can.push("reach customers on your behalf (with your approval)");

  let level: ReadyLevel;
  let headline: string;
  if (!canBuild) {
    level = "connect-to-start";
    headline = "Connect your accounts and the org sets itself up — start with GitHub and a model.";
  } else if (!s.deploy) {
    level = "can-build";
    headline = "The org can build software right now. Connect Vercel and it'll deploy and run it, too.";
  } else if (!s.outbound) {
    level = "can-build-and-run";
    headline = "The org can build AND run software — just describe what you want.";
  } else {
    level = "fully-operating";
    headline = "You're fully set up — the org can build, run, and operate. Describe what you want and it goes.";
  }

  return { level, headline, can, nextStep: next };
}

/** Convenience: caps → readiness in one call (what the engine route hands the UI). */
export function readinessFromCaps(caps: Record<string, boolean>): Readiness {
  return assessSetup(signalsFromCaps(caps));
}
