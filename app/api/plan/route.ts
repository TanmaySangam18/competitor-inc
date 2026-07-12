import { core } from "@/lib/core";

export const runtime = "nodejs";

// Planning, over the API. POST { goal } → a coordinated task plan mapped to the org's IC→lead→sign-off
// chain. Keyless + NO side effects — it plans, it doesn't build. Same core the CLI runs. Fail-soft.
export async function GET() {
  return Response.json({
    ok: true,
    capability: "plan",
    usage: 'POST { "goal": string }  →  { ok, plan: { goal, tasks, chain } }',
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
  return Response.json({ ok: true, plan: core.plan(goal, { operate: body?.operate === true }) });
}
