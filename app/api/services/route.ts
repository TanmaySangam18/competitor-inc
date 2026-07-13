import { listServices } from "@/lib/core";

export const runtime = "nodejs";

// GET /api/services — the catalog a customer can hire the AI company to run. Keyless, read-only: the same
// SERVICES that the CLI (`competitor services`) and the /services page render. Honest status per service.
export async function GET() {
  return Response.json({ ok: true, services: listServices() });
}
