import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Founder-only KPI counts (aggregate, no PII). Guarded by METRICS_SECRET so pre-launch numbers can't
// be scraped. Fail-soft: no Supabase → zeros; no secret set → { locked:true } (the board shows how to
// enable it). The board (/house/board) sends the secret as a bearer; the founder enters it once.
export async function GET(req: Request) {
  const secret = process.env.METRICS_SECRET;
  if (!secret) {
    return Response.json({ ok: true, locked: true, note: "Set METRICS_SECRET (env) to enable the board." });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ ok: true, persisted: false, waitlist: 0, waitlistReferred: 0, demandTests: 0, demandSignups: 0 });
  }

  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const [wl, wlRef, dt, ds] = await Promise.all([
      sb.from("waitlist").select("id", { count: "exact", head: true }),
      sb.from("waitlist").select("id", { count: "exact", head: true }).not("ref", "is", null),
      sb.from("demand_tests").select("slug", { count: "exact", head: true }),
      sb.from("demand_signups").select("id", { count: "exact", head: true }),
    ]);
    return Response.json({
      ok: true,
      persisted: true,
      waitlist: wl.count ?? 0,
      waitlistReferred: wlRef.count ?? 0,
      demandTests: dt.count ?? 0,
      demandSignups: ds.count ?? 0,
    });
  } catch (e) {
    console.error("[/api/metrics] failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: true, persisted: false, waitlist: 0, waitlistReferred: 0, demandTests: 0, demandSignups: 0 });
  }
}
