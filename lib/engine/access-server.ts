import "server-only";

// SERVER enforcement of the premium gate — so the UI tiering (access-gate.ts) can't be bypassed by
// calling the API directly. Design: the reverse TRIAL unlocks the in-app operate experience client-side
// (simulated, $0), but REAL EXTERNAL actions — the ones that touch the world or cost money — are a paid
// capability, enforced here at the /api/execute keystone. This keeps enforcement server-authoritative
// (founder or a live paid entitlement) without needing the client trial clock on the server.
//
// Only active when NEXT_PUBLIC_WAITLIST_GATE is on (the caller checks). Fail-SAFE: any uncertainty →
// not-premium → the premium action is withheld (revenue-safe; the action also still needs connectors +
// wallet + approval, so a withheld one simply stays simulated).

import { getServerSupabase } from "@/lib/supabase/server";
import { isFounderEmail } from "./founders";
import { isEntitled } from "./entitlement";

// Real external actions gated to premium. Build/spend are handled elsewhere (build = the free aha up to
// the cap; spend = wallet + policy). These are the "make it truly live / go to real customers" actions.
export const PREMIUM_ACTIONS = new Set([
  "deploy", "outreach", "ads", "payments", "bluesky", "mastodon", "reddit", "twitter", "linkedin", "video",
]);

export function isPremiumAction(action: string): boolean {
  return PREMIUM_ACTIONS.has(action);
}

// Server-authoritative premium check: founder OR a live paid entitlement. Never throws → false on any
// error (fail-safe: withhold the premium action rather than wrongly grant it).
export async function serverPremium(): Promise<boolean> {
  try {
    const sb = await getServerSupabase();
    if (!sb) return false;
    const { data: auth } = await sb.auth.getUser();
    const email = auth?.user?.email;
    if (!email) return false;
    if (isFounderEmail(email)) return true;
    const { data } = await sb
      .from("entitlements")
      .select("status, current_period_end")
      .eq("email", email)
      .maybeSingle();
    return isEntitled(data?.status, (data?.current_period_end as string | null) ?? null);
  } catch {
    return false;
  }
}
