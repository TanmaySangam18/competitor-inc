import { core } from "@/lib/core";

export const runtime = "nodejs";

// The nervous system, over the API. POST { task } → a governed Decision Record: which roles convene, each
// stance, and whether the safety floor routes it to the founder. Keyless + NO side effects — it convenes
// and governs, it doesn't act. Real model-reasoned stances arrive when a reasoner/key is wired in
// (lib/core/deliberate); until then the record is honestly flagged `simulated`. Same core the CLI runs.
export async function GET() {
  return Response.json({
    ok: true,
    capability: "deliberate",
    usage: 'POST { "task": string }  →  { ok, record: DecisionRecord }',
  });
}

export async function POST(req: Request) {
  let body: { task?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const task = typeof body?.task === "string" ? body.task.trim() : "";
  if (!task || task.length > 500) {
    return Response.json({ ok: false, error: "task must be a non-empty string ≤ 500 chars" }, { status: 400 });
  }
  const record = await core.deliberate(task);
  return Response.json({ ok: true, record });
}
