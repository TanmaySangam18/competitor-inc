import { createClient } from "@supabase/supabase-js";
import { readFunnel } from "@/lib/engine/funnel";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// R5 of the Revenue Loop: the Growth tab's data source. Returns the company's REAL funnel snapshot
// (aggregates + per-stage basis) — never emails, never row-level data. Fail-soft to an all-missing
// funnel so the tab renders honestly ("connect the signal") instead of erroring.
export async function GET(req: Request) {
  if (rateLimited(`growth:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return Response.json({ ok: false, error: "bad slug" }, { status: 400 });

  const missing = {
    views: null,
    signups: null,
    payingCustomers: null,
    revenueCents: null,
    basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" },
  };

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !key) return Response.json({ ok: true, persisted: false, funnel: missing });
  try {
    const sb = createClient(dbUrl, key, { auth: { persistSession: false } });
    const funnel = await readFunnel(sb, slug);
    return Response.json({ ok: true, persisted: true, funnel });
  } catch {
    return Response.json({ ok: true, persisted: false, funnel: missing });
  }
}
