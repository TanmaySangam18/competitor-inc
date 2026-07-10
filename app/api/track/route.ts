import { createHash } from "node:crypto";
import { serviceClient as sb } from "@/lib/engine/service";
import { SLUG_RE } from "@/lib/engine/slug";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// R2 of the Revenue Loop: the first-party pixel. Counts REAL funnel events (views, signups) per
// slug — the loop's sensory organ. Trust posture mirrors /api/demand: public, rate-limited,
// fail-soft without Supabase. Hard rules:
//  - `purchase` is NEVER accepted here — revenue rows come only from the verified Polar webhook,
//    so the public pixel can't fabricate money (the no-fake-proof rule, enforced at the API edge).
//  - slug must exist (demand test or company) — no junk spray into the table.
//  - dedup via salted hash of ip+ua+slug+type+day (TRACK_SALT); the raw IP is never stored.
// CORS is open on POST so the copy-paste snippet works from customers' own sites.

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  if (await overLimit(`track:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429, headers: CORS });
  }
  const raw = await req.text();
  if (raw.length > 1024) return Response.json({ ok: false, error: "too large" }, { status: 400, headers: CORS });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400, headers: CORS });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().slice(0, 80) : "";
  const type = typeof body.type === "string" ? body.type : "";
  const source = typeof body.source === "string" ? body.source.slice(0, 60) : null;

  if (!SLUG_RE.test(slug)) return Response.json({ ok: false, error: "bad slug" }, { status: 400, headers: CORS });
  // Public pixel may only report views, signups, and hero-demo events. Purchases come from the
  // payment webhook alone. Demo events are restricted to OUR first-party pages (reserved slugs) —
  // they measure the attention-first playbook's triggers, never a customer's demand test.
  const isDemoType = type === "demo_start" || type === "demo_verdict" || type === "demo_cta";
  // "tool" = a run of a first-party free tool (/sell, /score) — the top of the funnel-proof.
  const isToolType = type === "tool";
  // "receipts" = the Receipts Campaign's attribution slug (?ref=receipts on persona-post links).
  const isReservedSlug = slug === "home" || slug === "nu" || slug === "sell" || slug === "score" || slug === "receipts";
  if (type !== "view" && type !== "signup" && !isDemoType && !isToolType) {
    return Response.json({ ok: false, error: "type must be view|signup|tool|demo_*" }, { status: 400, headers: CORS });
  }
  if ((isDemoType || isToolType) && !isReservedSlug) {
    return Response.json({ ok: false, error: "demo/tool events are first-party only" }, { status: 400, headers: CORS });
  }

  const client = sb();
  if (!client) return Response.json({ ok: true, persisted: false }, { headers: CORS });

  try {
    // Slug must belong to something real — a demand test or a company. Reserved first-party slugs
    // (our own landing pages) are exempt from the join check.
    if (!isReservedSlug) {
      const [dt, co] = await Promise.all([
        client.from("demand_tests").select("slug").eq("slug", slug).maybeSingle(),
        client.from("companies").select("slug").eq("slug", slug).maybeSingle(),
      ]);
      if (!dt.data && !co.data) return Response.json({ ok: false, error: "unknown slug" }, { status: 404, headers: CORS });
    }

    // Salted daily dedup — one view per visitor/slug/day, never a raw IP at rest.
    const salt = process.env.TRACK_SALT;
    let dedup: string | null = null;
    if (salt) {
      const ua = (req.headers.get("user-agent") ?? "").slice(0, 120);
      const day = new Date().toISOString().slice(0, 10);
      dedup = createHash("sha256").update(`${salt}:${clientIp(req)}:${ua}:${slug}:${type}:${day}`).digest("hex");
    }

    const row = { slug, type, source, dedup_hash: dedup };
    const { error } = dedup
      ? await client.from("events").upsert(row, { onConflict: "dedup_hash", ignoreDuplicates: true })
      : await client.from("events").insert(row);
    if (error) {
      console.error("[/api/track] insert failed:", error.message);
      return Response.json({ ok: true, persisted: false }, { headers: CORS });
    }
    return Response.json({ ok: true, persisted: true }, { headers: CORS });
  } catch (err) {
    console.error("[/api/track] failed:", err instanceof Error ? err.message : "unknown");
    return Response.json({ ok: true, persisted: false }, { headers: CORS });
  }
}

// Aggregates only — no emails, no hashes, nothing row-level ever leaves this endpoint.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return Response.json({ ok: false, error: "bad slug" }, { status: 400 });
  const client = sb();
  const empty = { ok: true as const, persisted: false, views: 0, demoStarts: 0, demoVerdicts: 0, demoCtas: 0, signups: 0 };
  if (!client) return Response.json(empty);
  try {
    const count = (type: string) =>
      client.from("events").select("id", { count: "exact", head: true }).eq("slug", slug).eq("type", type);
    const [v, ds, dv, dc, s] = await Promise.all([
      count("view"), count("demo_start"), count("demo_verdict"), count("demo_cta"), count("signup"),
    ]);
    return Response.json({
      ok: true, persisted: true,
      views: v.count ?? 0, demoStarts: ds.count ?? 0, demoVerdicts: dv.count ?? 0, demoCtas: dc.count ?? 0, signups: s.count ?? 0,
    });
  } catch {
    return Response.json(empty);
  }
}
