import { screenIntake } from "@/lib/core";

export const runtime = "nodejs";

// POST /api/intake — screen a prospective customer's use-case against the prohibited-use list BEFORE their
// company activates (REQUIREMENTS §14, Tier A4). Keyless, no side effects: returns allow | review | deny +
// the category/terms that triggered it. The lawyer-signed Acceptable Use Policy (HUMAN_TODO) is the legal
// authority; this endpoint is the mechanical first gate that routes borderline cases to a human.
export async function POST(req: Request) {
  let body: { summary?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const summary = typeof body?.summary === "string" ? body.summary : "";
  if (summary.length > 4000) return Response.json({ ok: false, error: "summary too long" }, { status: 400 });
  return Response.json({ ok: true, result: screenIntake({ summary }) });
}
