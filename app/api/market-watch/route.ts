import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { listWatch, runWatchScan } from "@/lib/engine/market-watch-db";
import { battlecard } from "@/lib/core/market-watch";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

// /api/market-watch (ADR-0024) — GET: your targets + current battlecards (RLS-scoped).
// POST { targets: [{name, url}] }: scan now (≤5 per call — a watch, not a crawler). Every URL passes
// the SSRF wall and the robots gate; every scan is governed as an mcp_read before any network.

export async function GET() {
  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "auth unavailable" }, { status: 503 });
  const { data } = await sb.auth.getUser();
  if (!data?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const rows = await listWatch(sb, data.user.id);
  return NextResponse.json({
    ok: true,
    targets: rows.map((r) => ({
      name: r.name, url: r.url, scannedAt: r.scanned_at, deltas: r.deltas,
      card: battlecard({ name: r.name, url: r.url }, r.deltas, r.scanned_at ?? "never"),
    })),
  });
}

export async function POST(req: NextRequest) {
  if (await overLimit(`market-watch:${clientIp(req)}`)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "auth unavailable" }, { status: 503 });
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { targets?: unknown } | null;
  const raw = Array.isArray(body?.targets) ? body.targets : [];
  const targets = raw
    .map((t) => (t && typeof t === "object" ? t as { name?: unknown; url?: unknown } : {}))
    .map((t) => ({ name: String(t.name ?? "").trim().slice(0, 80), url: String(t.url ?? "").trim() }))
    .filter((t) => t.name && t.url);
  if (targets.length === 0) return NextResponse.json({ ok: false, error: "no targets" }, { status: 400 });
  if (targets.length > 5) return NextResponse.json({ ok: false, error: "≤5 targets per scan — this is a watch, not a crawler" }, { status: 400 });

  // Writes go through the service role after session auth; RLS owner-reads stay the customer's view.
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: "not configured (no service role)" }, { status: 503 });
  const results = [];
  for (const t of targets) results.push(await runWatchScan(svc, user.id, t)); // sequential — polite by design
  return NextResponse.json({ ok: true, results });
}
