import { NextRequest, NextResponse } from "next/server";
import { scanHackathons, winPlan, type RadarHit } from "@/lib/loop/hackathon-radar";

// The Hackathon Radar surface (ADR-0014). GET = scan (keyless, $0 — public listing data, no AI
// needed). POST { hit } = the WIN PLAN for one hit (compliance-gated org-run goal). Upstream failures
// return honest ok:false JSON with 200 — the radar reports weather, it never throws a 5xx tantrum.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const minPrizeUsd = Math.max(0, parseInt(req.nextUrl.searchParams.get("minPrize") ?? "0", 10) || 0);
  const scan = await scanHackathons({ minPrizeUsd });
  if (!scan.ok) return NextResponse.json({ ok: false, error: scan.error });
  return NextResponse.json({ ok: true, count: scan.hits.length, hits: scan.hits.slice(0, 25) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { hit?: RadarHit } | null;
  const hit = body?.hit;
  if (!hit?.url || !hit?.title) return NextResponse.json({ ok: false, error: "hit { title, url, … } required — scan first" }, { status: 400 });
  return NextResponse.json({ ok: true, plan: winPlan(hit) });
}
