// Post-preview access gate — the freemium "continue" lock (build order #2).
//
// The flow: a user gets the whole AHA for free — validate → build → preview their product live. Beyond
// that, CONTINUING (running the org, building more) is gated: they join the waitlist now, or purchase
// once billing is live. Their project stays saved (data is per-user persisted), so unlocking = resume.
//
// Off unless WAITLIST_GATE is on, so it can NOT disrupt the current pre-launch demo (where everyone sees
// everything). Founders and truly-paid users are never gated. Joining the waitlist captures intent — it
// does not itself unlock (access comes from purchase, or the founder granting it). Pure + testable.

// ── Reverse trial (the CPO model) ────────────────────────────────────────────────────────────────
// After the user's first build (the aha), the premium "Operate" layer (autopilot + real-world actions)
// is fully unlocked for TRIAL_DAYS so they FEEL the compounding value — then it converts. Pure.
export const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function trialActive(trialStartedAt: number | null | undefined, now: number = Date.now(), days: number = TRIAL_DAYS): boolean {
  if (!trialStartedAt) return false;
  return now - trialStartedAt < days * DAY_MS;
}

export function trialDaysLeft(trialStartedAt: number | null | undefined, now: number = Date.now(), days: number = TRIAL_DAYS): number {
  if (!trialStartedAt) return days;
  return Math.max(0, days - Math.floor((now - trialStartedAt) / DAY_MS));
}

// The master gate: is the premium (Operate) layer — autopilot, real actions — unlocked for this user?
export interface AccessInput {
  founder: boolean;
  paid: boolean; // REAL entitlement (billing live), never the demo bypass
  trialStartedAt: number | null | undefined;
  now?: number;
}
export function premiumUnlocked(i: AccessInput): boolean {
  return i.founder || i.paid || trialActive(i.trialStartedAt, i.now);
}

// The "1 free company" cap (the value metric = a running company). The reverse trial unlocks the OPERATE
// layer, NOT a portfolio — so a 2nd company is premium even during the trial. Only founders/paid bypass.
export function companyCreateLocked(i: {
  gateOn: boolean;
  founder: boolean;
  paid: boolean;
  currentCount: number;
  freeCompanies?: number;
}): boolean {
  if (!i.gateOn) return false;
  if (i.founder || i.paid) return false;
  return i.currentCount >= (i.freeCompanies ?? 1);
}

// ── Post-preview "continue" gate ─────────────────────────────────────────────────────────────────
export interface GateInput {
  gateOn: boolean; // the WAITLIST_GATE flag (NEXT_PUBLIC_WAITLIST_GATE === "1")
  founder: boolean; // allow-listed founder → never gated (dogfoods full product)
  paid: boolean; // REAL entitlement (not the billing-off demo bypass) → never gated
  previewedCount: number; // products the user has already built/previewed (the aha, consumed)
  freePreviews?: number; // how many previews are free before the gate (default 1)
  trialStartedAt?: number | null; // active reverse trial → not gated (they're mid-taste)
  now?: number;
}

// True when the user should be blocked from CONTINUING (and shown the waitlist/purchase prompt).
export function continueLocked(i: GateInput): boolean {
  if (!i.gateOn) return false; // gate disabled → current behavior (nothing locked)
  if (i.founder || i.paid) return false; // never gate a founder or a paying user
  if (trialActive(i.trialStartedAt, i.now)) return false; // reverse trial: unlocked while it runs
  return i.previewedCount >= (i.freePreviews ?? 1);
}

// A user has "consumed the free preview" once any of their products has been built/previewed — i.e. they
// reached the aha. We count companies that have a live product URL, or have run at least one night, or
// are operating. (Validating-only companies don't count — they haven't seen it build yet.)
export function previewedCount(
  companies: { product?: { url?: string; status?: string } | null; night?: number; status?: string }[],
): number {
  return companies.filter(
    (c) => !!c.product?.url || (c.night ?? 0) > 0 || c.status === "operating",
  ).length;
}

// Convenience for the client: read the flag from a NEXT_PUBLIC env value.
export function waitlistGateOn(flag: string | undefined): boolean {
  return flag === "1" || flag === "true";
}
