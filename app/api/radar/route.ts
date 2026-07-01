import { rateLimited, clientIp } from "@/lib/engine/ratelimit";
import { runRadar } from "@/lib/engine/radar";

export const runtime = "nodejs";
// Radar crawls several external APIs in parallel; give it room but stay bounded.
export const maxDuration = 30;

// Block V — Demand Radar. POST { idea } → crawl the live web (Hacker News, StackExchange, GitHub) for
// REAL demand signals and return a source-cited report. Nothing fabricated: every number traces to a
// fetched result, and unreachable sources are reported honestly. Rate-limited.
export async function POST(req: Request) {
  if (rateLimited(`radar:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited — try again in a moment" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const idea = typeof (body as { idea?: unknown })?.idea === "string" ? (body as { idea: string }).idea.trim() : "";
  if (idea.length < 3 || idea.length > 400) {
    return Response.json({ ok: false, error: "describe the idea in a sentence" }, { status: 400 });
  }
  try {
    const report = await runRadar(idea);
    return Response.json({ ok: true, report });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "radar failed" }, { status: 500 });
  }
}
