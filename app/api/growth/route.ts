import { serviceClient } from "@/lib/engine/service";
import { SLUG_RE } from "@/lib/engine/slug";
import { readFunnel } from "@/lib/engine/funnel";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// R5 of the Revenue Loop: the Growth tab's data source. Returns the company's REAL funnel snapshot
// (aggregates + per-stage basis) — never emails, never row-level data. Fail-soft to an all-missing
// funnel so the tab renders honestly ("connect the signal") instead of erroring.
export async function GET(req: Request) {
  if (await overLimit(`growth:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return Response.json({ ok: false, error: "bad slug" }, { status: 400 });

  const missing = {
    views: null,
    signups: null,
    payingCustomers: null,
    revenueCents: null,
    basis: { views: "missing", signups: "missing", paying: "missing", revenue: "missing" },
  };

  const sb = serviceClient();
  if (!sb) return Response.json({ ok: true, persisted: false, funnel: missing });
  try {
    const funnel = await readFunnel(sb, slug);
    return Response.json({ ok: true, persisted: true, funnel });
  } catch {
    return Response.json({ ok: true, persisted: false, funnel: missing });
  }
}
