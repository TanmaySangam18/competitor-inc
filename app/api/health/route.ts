import { core } from "@/lib/core";

export const runtime = "nodejs";

// The company-OS vitals, over the API. GET → runs the keyless self-check (org · agents · plan · deliberate
// · coordinate) and reports green/red per system. 200 when all green, 503 when a system is down. No keys,
// no side effects — same core the CLI's `doctor` runs.
export async function GET() {
  const health = await core.checkHealth();
  return Response.json({ ok: health.ok, health }, { status: health.ok ? 200 : 503 });
}
