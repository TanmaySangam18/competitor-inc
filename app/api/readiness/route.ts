import { readiness } from "@/lib/core";

export const runtime = "nodejs";

// GET /api/readiness — the Definition-of-Done gate, computed live against the real control-plane modules.
// Keyless, no side effects. The honest go/no-go for lifting maintenance to a real customer.
export async function GET() {
  return Response.json({ ok: true, ...(await readiness()) });
}
