import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/engine/service";
import { isEntitled } from "@/lib/engine/entitlement";

export const runtime = "nodejs";

// Constant-time bearer check (avoids timing leaks on the founder secret).
function bearerOk(req: Request, secret: string): boolean {
  const got = Buffer.from(req.headers.get("authorization") || "", "utf8");
  const want = Buffer.from(`Bearer ${secret}`, "utf8");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export interface PpuBlock {
  value: number; // the North Star
  paidUsers: number;
  provenOutcomes: number;
  activatedCompanies: number;
  totalCompanies: number;
  signedUpUsers: number;
  activationRate: number; // 0–1
  freeToPaid: number; // 0–1
  costPerPpu: number | null; // total spend ÷ PPU; null until there's a PPU
  retention14d: number | null; // forward proxy: share of paid users committed >14 days out; null until data
}
const EMPTY_PPU: PpuBlock = { value: 0, paidUsers: 0, provenOutcomes: 0, activatedCompanies: 0, totalCompanies: 0, signedUpUsers: 0, activationRate: 0, freeToPaid: 0, costPerPpu: null, retention14d: null };

// Proven Paying Users — the North Star (kills "signups" as a goal). A PPU is a user who BOTH (1) is on a
// paid plan AND (2) has ≥1 agent action with a VERIFIED, receipted real-world outcome in the Glass Box.
// One number tests demand (paid) + delivery (real outcome) + trust (receipted). Real outcomes are the
// activities appendRealResult writes ONLY when a LIVE executor returned a real proof (meta tagged
// "real ✓") — so simulated competitor.inc-subdomain placeholders never inflate it. Fail-soft: any gap → 0.
async function computePpu(sb: SupabaseClient): Promise<PpuBlock> {
  try {
    // (1) Paid — active entitlements. Access is derived from status + period end, not a collapsed boolean.
    const ent = await sb.from("entitlements").select("email,status,current_period_end");
    const paidEmails = (ent.data ?? [])
      .filter((e) => isEntitled(e.status as string, (e.current_period_end as string) ?? null))
      .map((e) => String(e.email).toLowerCase());

    // (2) Proven — real, receipted outcomes (live-executor proofs only; tagged "real").
    const realActs = await sb.from("activities").select("company_id").ilike("meta", "%real%");
    const provenOutcomes = (realActs.data ?? []).length;
    const verifiedCompanyIds = new Set((realActs.data ?? []).map((a) => a.company_id as string));

    // Companies → owners. Activation = the share of companies with ≥1 verified outcome.
    const cos = await sb.from("companies").select("id,user_id,ledger");
    const companies = cos.data ?? [];
    const totalCompanies = companies.length;
    const signedUpUserIds = new Set(companies.map((c) => c.user_id as string));
    const activatedCompanyRows = companies.filter((c) => verifiedCompanyIds.has(c.id as string));
    const activatedUserIds = new Set(activatedCompanyRows.map((c) => c.user_id as string));

    // PPU = paid owners who are ALSO activated. Map paid emails → user_id via the admin API (fail-soft).
    let value = 0;
    if (paidEmails.length > 0 && activatedUserIds.size > 0) {
      try {
        const { data: users } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const emailToId = new Map((users?.users ?? []).map((u) => [String(u.email ?? "").toLowerCase(), u.id]));
        for (const email of paidEmails) {
          const uid = emailToId.get(email);
          if (uid && activatedUserIds.has(uid)) value++;
        }
      } catch {
        /* admin API unavailable → leave PPU at 0 (honest fail-soft; don't overstate) */
      }
    }

    // Cost per PPU — real net spend (ledger) ÷ PPU. Null until there's a PPU (don't divide by zero).
    const totalSpend = companies.reduce((t, c) => {
      const l = c.ledger as { spent?: number; credited?: number } | null;
      return t + ((l?.spent ?? 0) - (l?.credited ?? 0));
    }, 0);
    const costPerPpu = value > 0 ? Math.round((totalSpend / value) * 100) / 100 : null;

    // 14-day retention (forward proxy): of paid users, the share committed to a paid period >14 days out.
    // A real cohort snapshot would be more precise; this is an honest, defensible read from current data.
    const now = Date.now();
    const D14 = 14 * 86_400_000;
    const committed = (ent.data ?? []).filter(
      (e) =>
        isEntitled(e.status as string, (e.current_period_end as string) ?? null) &&
        e.current_period_end &&
        new Date(e.current_period_end as string).getTime() - now > D14,
    ).length;
    const retention14d = paidEmails.length ? Math.round((committed / paidEmails.length) * 100) / 100 : null;

    return {
      value,
      paidUsers: paidEmails.length,
      provenOutcomes,
      activatedCompanies: activatedCompanyRows.length,
      totalCompanies,
      signedUpUsers: signedUpUserIds.size,
      activationRate: totalCompanies ? activatedCompanyRows.length / totalCompanies : 0,
      freeToPaid: signedUpUserIds.size ? paidEmails.length / signedUpUserIds.size : 0,
      costPerPpu,
      retention14d,
    };
  } catch {
    return EMPTY_PPU;
  }
}

// Founder-only KPI counts (aggregate, no PII). Guarded by METRICS_SECRET so pre-launch numbers can't be
// scraped. North Star = Proven Paying Users (ppu); signups are demoted to diagnostics (watch, don't
// chase). Fail-soft: no Supabase → zeros; no secret set → { locked:true } (the board shows how to enable
// it). The board (/house/board) sends the secret as a bearer; the founder enters it once.
export async function GET(req: Request) {
  const secret = process.env.METRICS_SECRET;
  if (!secret) {
    return Response.json({ ok: true, locked: true, note: "Set METRICS_SECRET (env) to enable the board." });
  }
  if (!bearerOk(req, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = serviceClient();
  if (!sb) {
    return Response.json({ ok: true, persisted: false, ppu: EMPTY_PPU, waitlist: 0, waitlistReferred: 0, demandTests: 0, demandSignups: 0 });
  }

  try {
    const [ppu, wl, wlRef, dt, ds] = await Promise.all([
      computePpu(sb),
      sb.from("waitlist").select("id", { count: "exact", head: true }),
      sb.from("waitlist").select("id", { count: "exact", head: true }).not("ref", "is", null),
      sb.from("demand_tests").select("slug", { count: "exact", head: true }),
      sb.from("demand_signups").select("id", { count: "exact", head: true }),
    ]);
    return Response.json({
      ok: true,
      persisted: true,
      ppu,
      // Diagnostics — watch, don't chase.
      waitlist: wl.count ?? 0,
      waitlistReferred: wlRef.count ?? 0,
      demandTests: dt.count ?? 0,
      demandSignups: ds.count ?? 0,
    });
  } catch (e) {
    console.error("[/api/metrics] failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: true, persisted: false, ppu: EMPTY_PPU, waitlist: 0, waitlistReferred: 0, demandTests: 0, demandSignups: 0 });
  }
}
