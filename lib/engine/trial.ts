"use client";

// Reverse-trial clock — persists WHEN the user first reached value (their first company), so the premium
// "Operate" layer (autopilot + real actions) can be unlocked for TRIAL_DAYS from that point, then convert.
// Client-side (localStorage), matching the app's other soft caps (usage.ts); the F1/pre-billing posture
// makes a client clock fine for v1 — it hardens to the DB alongside billing. Read by the dashboard, which
// combines it with founder/paid state via access-gate's premiumUnlocked/continueLocked.

const KEY = "cofounder:trial:v1";

export function getTrialStart(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

// Start the trial once (idempotent — first call wins, so it dates from the first real engagement).
export function markTrialStart(now: number = Date.now()): number {
  const cur = getTrialStart();
  if (cur) return cur;
  try {
    window.localStorage.setItem(KEY, String(now));
  } catch {
    /* ignore */
  }
  return now;
}
