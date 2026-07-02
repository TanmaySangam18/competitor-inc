import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FunnelSnapshot, StageBasis } from "./growth";

// The one place that assembles a company's REAL funnel from what we actually capture (Block R4):
//   views    → events(type=view)            — real once the beacon/pixel is live for the slug
//   signups  → demand_signups ∪ events      — real when a demand test exists (capture is wired)
//   paying   → revenue_events distinct emails, attributed by checkout metadata.slug
//   revenue  → revenue_events sum(amount_cents)
// Basis rules are conservative: a stage is "real" only when its capture path is verifiably wired for
// this slug; otherwise "missing" — the loop treats missing as "connect the signal", never as zero.

export async function readFunnel(sb: SupabaseClient, slug: string): Promise<FunnelSnapshot> {
  const missing: FunnelSnapshot = {
    views: null,
    signups: null,
    payingCustomers: null,
    revenueCents: null,
    basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" },
  };
  if (!slug) return missing;

  try {
    const [test, viewsQ, signupEventsQ, demandSignupsQ, revenueQ] = await Promise.all([
      sb.from("demand_tests").select("slug").eq("slug", slug).maybeSingle(),
      sb.from("events").select("id", { count: "exact", head: true }).eq("slug", slug).eq("type", "view"),
      sb.from("events").select("id", { count: "exact", head: true }).eq("slug", slug).eq("type", "signup"),
      sb.from("demand_signups").select("id", { count: "exact", head: true }).eq("slug", slug),
      sb.from("revenue_events").select("amount_cents, email").eq("slug", slug),
    ]);

    const hasTest = !!test.data;
    const viewCount = viewsQ.count ?? 0;
    const signupCount = Math.max(signupEventsQ.count ?? 0, demandSignupsQ.count ?? 0);
    const revRows = (revenueQ.data as { amount_cents: number; email: string }[] | null) ?? [];

    // views: the beacon ships embedded on every /t/ page, so an existing demand test means the stage
    // is measured (zero is a real zero). Without a test, only actual pixel events prove wiring.
    const viewsBasis: StageBasis = hasTest || viewCount > 0 ? "real" : "missing";
    const signupsBasis: StageBasis = hasTest || signupCount > 0 ? "real" : "missing";
    // paying/revenue: attribution requires checkout metadata.slug → rows existing is the only proof.
    const revenueBasis: StageBasis = revRows.length > 0 ? "real" : "missing";

    return {
      views: viewsBasis === "real" ? viewCount : null,
      signups: signupsBasis === "real" ? signupCount : null,
      payingCustomers: revenueBasis === "real" ? new Set(revRows.map((r) => r.email)).size : null,
      revenueCents: revenueBasis === "real" ? revRows.reduce((t, r) => t + (r.amount_cents || 0), 0) : null,
      basis: { views: viewsBasis, signups: signupsBasis, paying: revenueBasis, revenue: revenueBasis },
    };
  } catch {
    return missing; // measurement must never break the shift
  }
}
