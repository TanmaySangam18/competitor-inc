import { conversation } from "@/lib/core";

export const runtime = "nodejs";

// POST /api/room — the team room: a task → a governed deliberation rendered as a watchable conversation.
// Fail-soft + fail-closed on bad input (mirrors /api/deliberate). Keyless: with no model key the stances
// are mandate-derived and the response is flagged simulated; with a key the same shape reasons for real.
export async function POST(req: Request) {
  let body: { task?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const task = typeof body?.task === "string" ? body.task.trim() : "";
  if (!task) return Response.json({ ok: false, error: "task is required" }, { status: 400 });
  if (task.length > 2000) return Response.json({ ok: false, error: "task too long" }, { status: 400 });

  const size = typeof body?.size === "number" && body.size >= 1 && body.size <= 6 ? Math.floor(body.size) : undefined;

  try {
    const convo = await conversation(task, { size });
    return Response.json({ ok: true, conversation: convo });
  } catch {
    // Never 5xx on a deliberation hiccup — the room degrades honestly.
    return Response.json({ ok: false, error: "the room could not convene" }, { status: 200 });
  }
}
