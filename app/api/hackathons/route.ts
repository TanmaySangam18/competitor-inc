import { NextRequest, NextResponse } from "next/server";
import { scanHackathons, winPlan, type RadarHit } from "@/lib/loop/hackathon-radar";
import { autoHackathon, startHackathonRun, submissionPackage } from "@/lib/loop/hackathon-run";
import { getServerSupabase } from "@/lib/supabase/server";

// The Hackathon service surface (ADR-0014 radar + ADR-0021 run). GET = scan (keyless, $0). POST:
//   { hit }                        → the WIN PLAN (kept shape — compliance-gated org-run goal)
//   { mode:"run", hit? , minPrize? } → START THE BUILD: a real durable org-run for the signed-in user
//                                     (no hit ⇒ auto-pick the strongest open cash-prize hit)
//   { mode:"package", hit, proof }  → the paste-ready submission package (pure; humanSteps carries the
//                                     account/rules/submit acts that are NEVER automated)
// Upstream failures return honest ok:false JSON with 200 — the radar reports weather, never a 5xx tantrum.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const minPrizeUsd = Math.max(0, parseInt(req.nextUrl.searchParams.get("minPrize") ?? "0", 10) || 0);
  const scan = await scanHackathons({ minPrizeUsd });
  if (!scan.ok) return NextResponse.json({ ok: false, error: scan.error });
  return NextResponse.json({ ok: true, count: scan.hits.length, hits: scan.hits.slice(0, 25) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { mode?: string; hit?: RadarHit; minPrize?: number; proof?: { projectName?: string; repoUrl?: string; liveUrl?: string; buildSummary?: string } }
    | null;
  const mode = body?.mode ?? "plan";
  const hit = body?.hit;

  if (mode === "package") {
    if (!hit?.url || !hit?.title) return NextResponse.json({ ok: false, error: "hit { title, url, … } required" }, { status: 400 });
    const p = body?.proof;
    if (!p?.projectName || !p?.buildSummary) {
      return NextResponse.json({ ok: false, error: "proof { projectName, buildSummary, repoUrl?, liveUrl? } required — the package is drafted from REAL receipts" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      package: submissionPackage(hit, { projectName: p.projectName, buildSummary: p.buildSummary, repoUrl: p.repoUrl, liveUrl: p.liveUrl }),
    });
  }

  if (mode === "run") {
    const sb = await getServerSupabase();
    const { data } = sb ? await sb.auth.getUser() : { data: { user: null } };
    if (!sb || !data?.user) return NextResponse.json({ ok: false, error: "sign in first — the build run needs an owner" }, { status: 401 });
    try {
      if (hit?.url && hit?.title) {
        const started = await startHackathonRun(sb, data.user.id, hit);
        return NextResponse.json({ ok: true, hit, ...started });
      }
      const auto = await autoHackathon(sb, data.user.id, { minPrizeUsd: typeof body?.minPrize === "number" ? body.minPrize : undefined });
      return NextResponse.json(auto);
    } catch (e) {
      return NextResponse.json({ ok: false, error: `could not start the run: ${e instanceof Error ? e.message : "unknown"}` });
    }
  }

  // Default (kept shape): the win plan for one hit.
  if (!hit?.url || !hit?.title) return NextResponse.json({ ok: false, error: "hit { title, url, … } required — scan first" }, { status: 400 });
  return NextResponse.json({ ok: true, plan: winPlan(hit) });
}
