import crypto from "node:crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { runProgress, buildRepo } from "@/lib/engine/org-run";
import { loadOrgRun, saveOrgRun } from "@/lib/engine/org-runs-db";
import { advanceOrgRun } from "@/lib/engine/org-run-step";
import { serverRealExecutor } from "@/lib/engine/real-executor";
import { insertActivities } from "@/lib/engine/db";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// The FAST path: while the founder is watching, the client calls this repeatedly to advance the run ONE
// short step per request (one model call — well under the serverless limit); the cron drives it otherwise.
// Ownership is verified via the caller's RLS-scoped session (only their own run loads) BEFORE any
// service-role write, so a caller can never advance someone else's run.
export async function POST(req: Request) {
  if (await overLimit(`orgadv:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = (body?.id ?? "").toString().trim();
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });

  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const owned = await loadOrgRun(auth, id).catch(() => null); // RLS ⇒ only the owner's run resolves
  if (!owned) return Response.json({ ok: false, error: "not found" }, { status: 404 });

  const svc = serviceClient();
  if (!svc) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });

  const executor = serverRealExecutor({ token: process.env.GITHUB_TOKEN });
  const { run } = await advanceOrgRun(owned.run, {
    executor,
    saveRun: (r) => saveOrgRun(svc, r),
    recordActivity: (a) => (owned.companyId ? insertActivities(svc, owned.companyId, [a]) : Promise.resolve()),
    makeId: () => crypto.randomUUID(),
  });
  return Response.json({ ok: true, status: run.status, progress: runProgress(run), repo: buildRepo(run) });
}
