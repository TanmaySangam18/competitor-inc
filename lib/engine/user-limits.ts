import "server-only";

// Server-enforced per-user daily caps. The old caps (usage.ts) are client-side localStorage — a nudge,
// bypassable by clearing storage. This is the REAL gate for users running on the OPERATOR's model key so
// a shared group can't drain the budget. BYOK users are uncapped (their own bill). Guests (no auth.uid)
// aren't per-user capped here — they're bounded by the per-IP rate limit in the route.
//
// FAIL-OPEN by design: if Supabase isn't configured, the user isn't signed in, or migration 0022 (the
// bump_usage RPC) isn't applied yet, we ALLOW the request. The app never breaks; the cap simply isn't
// enforced until the migration is live. (Matches the app's degrade-gracefully posture.)

import { getServerSupabase } from "@/lib/supabase/server";

export type LimitKind = "validate" | "shift" | "goal" | "build";

const num = (v: string | undefined, d: number): number => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : d;
};

// Per-user, per-day caps (operator-key usage). Env-overridable so you can tune without a deploy of code.
// `build` is the HOUSE-KEYS TRIAL valve (lib/engine/house-trial.ts): 0 = trial OFF (builds stay
// founder-only); setting HOUSE_TRIAL_BUILDS_PER_DAY opens real builds to signed-in users, hard-capped.
export const USER_DAILY_LIMITS: Record<LimitKind, number> = {
  validate: num(process.env.USER_DAILY_VALIDATE, 15),
  shift: num(process.env.USER_DAILY_SHIFT, 30),
  goal: num(process.env.USER_DAILY_GOAL, 20),
  build: num(process.env.HOUSE_TRIAL_BUILDS_PER_DAY, 0),
};

export interface LimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  enforced: boolean; // false when we failed open (not signed in / no DB / RPC missing)
}

// Atomically check + increment the signed-in user's daily count for `kind`. Never throws.
export async function checkUserLimit(kind: LimitKind): Promise<LimitResult> {
  const limit = USER_DAILY_LIMITS[kind];
  try {
    const sb = await getServerSupabase();
    if (!sb) return { allowed: true, used: 0, limit, enforced: false };
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return { allowed: true, used: 0, limit, enforced: false }; // guest → IP-limited only
    const { data, error } = await sb.rpc("bump_usage", { p_kind: kind, p_limit: limit });
    if (error) {
      console.warn("[user-limits] bump_usage failed (fail-open):", error.message);
      return { allowed: true, used: 0, limit, enforced: false };
    }
    const row = (Array.isArray(data) ? data[0] : data) as { allowed?: boolean; used?: number } | null;
    return { allowed: row?.allowed ?? true, used: row?.used ?? 0, limit, enforced: true };
  } catch (e) {
    console.warn("[user-limits] threw (fail-open):", e instanceof Error ? e.message : "unknown");
    return { allowed: true, used: 0, limit, enforced: false };
  }
}
