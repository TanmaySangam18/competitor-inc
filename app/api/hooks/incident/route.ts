import crypto from "node:crypto";
import { adaptIncidentPayload, ingestIncident } from "@/lib/loop/incident";
import { createOrgRun } from "@/lib/engine/org-run";
import { insertOrgRun } from "@/lib/engine/org-runs-db";
import { serviceClient } from "@/lib/engine/service";

export const runtime = "nodejs";

// POST /api/hooks/incident — the incident loop's front door (Connect-First Reset §4).
// Sentry (or any monitor) posts here; the payload adapter normalizes it and ingestIncident classifies,
// posts the governed #eng brief, and — within tier — enqueues the root-cause org-run (the EXISTING inner
// loop; the org-run step executor governs every real step it later takes).
//
// Auth: a shared-secret header (x-incident-secret), compared timing-safe — the same trust model as the
// Telegram webhook. Keyless-honest: no INCIDENT_HOOK_SECRET configured ⇒ 503 "hook not armed" (never an
// open endpoint, never a silent pretend-success); wrong/missing secret ⇒ 401.

function secretOk(req: Request, secret: string): boolean {
  const got = Buffer.from(req.headers.get("x-incident-secret") || "", "utf8");
  const want = Buffer.from(secret, "utf8");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  const secret = process.env.INCIDENT_HOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "hook not armed — set INCIDENT_HOOK_SECRET" }, { status: 503 });
  }
  if (!secretOk(req, secret)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const incident = adaptIncidentPayload(body);
  if (!incident) {
    return Response.json({ ok: false, error: "unrecognized payload — need {source,title,severity} or a Sentry webhook shape" }, { status: 400 });
  }

  // Wire the inner-loop enqueue only when it can actually persist: a service DB + an owner for the run
  // (org_runs.user_id is NOT NULL — INCIDENT_RUN_USER_ID names which user's org owns incident fixes).
  // Absent either, ingestIncident reports the honest "not enqueued" note instead of pretending.
  const sb = serviceClient();
  const runUserId = process.env.INCIDENT_RUN_USER_ID;
  const enqueueRun =
    sb && runUserId
      ? async (goal: string) => {
          const run = createOrgRun(`inc-${Date.now().toString(36)}`, goal, { orgPlan: true });
          await insertOrgRun(sb, runUserId, null, run);
          return run.id;
        }
      : undefined;

  const r = await ingestIncident(incident, { enqueueRun });

  return Response.json({
    ok: true,
    action: r.action,
    tier: r.tier,
    posted: r.posted.delivered,
    ...(r.posted.delivered ? {} : { postNote: r.posted.reason }),
    ...(r.runId ? { runId: r.runId } : {}),
    ...(r.runNote ? { runNote: r.runNote } : {}),
    ...(r.mirrored ? { mirrored: r.mirrored.delivered } : {}),
  });
}
