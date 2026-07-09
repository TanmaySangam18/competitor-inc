import crypto from "node:crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { createOrgRun, runProgress } from "@/lib/engine/org-run";
import { insertOrgRun, loadOrgRun } from "@/lib/engine/org-runs-db";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Enqueue + read a durable org run. POST creates a run for the signed-in owner (the cron then advances it
// laptop-off; the client can also drive it via /api/org-run/advance). GET returns its progress (RLS scopes
// it to the owner). Writes go through the service role; the caller's identity comes from the cookie session.
export async function POST(req: Request) {
  if (rateLimited(`orgrun:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { goal?: string; companyId?: string } | null;
  const goal = (body?.goal ?? "").toString().trim();
  const companyId = (body?.companyId ?? "").toString().trim() || null;
  if (goal.length < 4) return Response.json({ ok: false, error: "goal required" }, { status: 400 });

  const auth = await getServerSupabase();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  const user = data?.user;
  if (!user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });

  const svc = serviceClient();
  if (!svc) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });

  const run = createOrgRun(crypto.randomUUID(), goal.slice(0, 400), { operate: true });
  try {
    await insertOrgRun(svc, user.id, companyId, run);
  } catch (e) {
    console.error("[/api/org-run] enqueue failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false, error: "could not enqueue (is migration 0026 applied?)" }, { status: 500 });
  }
  return Response.json({ ok: true, id: run.id, progress: runProgress(run) });
}

export async function GET(req: Request) {
  const id = (new URL(req.url).searchParams.get("id") ?? "").trim();
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });
  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: true, found: false });
  const loaded = await loadOrgRun(auth, id).catch(() => null); // RLS: only the owner's run resolves
  if (!loaded) return Response.json({ ok: true, found: false });
  return Response.json({ ok: true, found: true, status: loaded.run.status, progress: runProgress(loaded.run) });
}
