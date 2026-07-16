// ─────────────────────────────────────────────────────────────────────────────
// HOUSE-KEYS TRIAL — the cold-start unlock (cto.new adoption, founder-approved 2026-07-15).
//
// BYOK stays the model, but the FIRST taste runs on competitor.inc's own keys: N builds per day,
// hard-capped, daily reset (UTC) — then "connect your own keys to continue." Bounded cost (~$0.13/build
// × cap), bounded blast radius (the kill switch + spend caps still bind every build), zero fake scarcity:
// the copy states plainly whose keys these are and why there's a cap.
//
// Pure policy module: the build route reads today's count from its own store and asks this for a verdict.
// OFF unless HOUSE_TRIAL_BUILDS_PER_DAY is set (>0) — flipping it on is a founder env decision, not code.
// ─────────────────────────────────────────────────────────────────────────────

export interface HouseTrialVerdict {
  enabled: boolean;
  allowed: boolean;
  remaining: number; // after this build, if allowed
  cap: number;
  resetsAt: number; // epoch ms of the next UTC midnight
  reason: string; // honest, user-showable line
}

export function houseTrialCap(env: Record<string, string | undefined> = process.env): number {
  const n = parseInt(env.HOUSE_TRIAL_BUILDS_PER_DAY ?? "0", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function nextUtcMidnight(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** The day bucket a build counts against — UTC date string, the key for the per-user daily counter. */
export function trialDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * May this user run one more house-keys build today? `buildsToday` = their count in today's UTC bucket.
 * The verdict is honest in both directions: when allowed it says whose keys and what remains; when
 * exhausted it points to BYOK — never a dark-pattern "upgrade" wall.
 */
export function houseTrialVerdict(buildsToday: number, now: number, env: Record<string, string | undefined> = process.env): HouseTrialVerdict {
  const cap = houseTrialCap(env);
  const resetsAt = nextUtcMidnight(now);
  if (cap === 0) {
    return { enabled: false, allowed: false, remaining: 0, cap, resetsAt, reason: "House-keys trial is off — connect your own keys to build." };
  }
  const used = Math.max(0, buildsToday);
  if (used >= cap) {
    return {
      enabled: true, allowed: false, remaining: 0, cap, resetsAt,
      reason: `Today's ${cap} free builds on competitor.inc's keys are used. They reset daily — or connect your own keys to keep going now.`,
    };
  }
  return {
    enabled: true, allowed: true, remaining: cap - used - 1, cap, resetsAt,
    reason: `Running on competitor.inc's keys — ${cap - used - 1} of ${cap} free builds left today. Connect your own keys for no shared limits.`,
  };
}
