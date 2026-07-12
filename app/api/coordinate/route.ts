import { core } from "@/lib/core";

export const runtime = "nodejs";

// The coordination loop, over the API. POST { goal } → plan + a governed decision per task + a summary
// (proceed vs escalate-to-founder). Keyless + NO side effects — it plans + governs, it doesn't act. Same
// core the CLI runs. Fail-soft.
export async function GET() {
  return Response.json({
    ok: true,
    capability: "coordinate",
    usage: 'POST { "goal": string }  →  { ok, coordination: { goal, plan, decisions, summary } }',
  });
}

export async function POST(req: Request) {
  let body: { goal?: unknown; operate?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  if (!goal || goal.length > 500) {
    return Response.json({ ok: false, error: "goal must be a non-empty string ≤ 500 chars" }, { status: 400 });
  }
  const coordination = await core.coordinate(goal, { operate: body?.operate === true });
  return Response.json({ ok: true, coordination });
}
