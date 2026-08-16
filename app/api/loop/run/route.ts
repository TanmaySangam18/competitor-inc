import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";
import { tickLoop, defaultDeps } from "@/lib/loop/loop-driver";
import { runNow, makeCooldown } from "@/lib/loop/on-demand";
import { killSwitch } from "@/lib/core/killswitch";

export const runtime = "nodejs";

// RUN NOW — the outer loop, on demand (lib/loop/on-demand.ts).
//
// Until this existed, tickLoop had exactly one caller: Vercel Cron, once a day. Someone who signed up at
// noon saw nothing until the next morning. This is the same loop, same guards, triggered by the person
// who is actually sitting there.
//
// Authenticated: a loop tick spends real model budget on the tenant's keys, so it is never anonymous.
// The cooldown lives in module scope so it survives across requests on a warm instance (see the honest
// note in on-demand.ts about cold starts).

const cooldown = makeCooldown();

export async function POST(req: Request) {
  if (await overLimit(`loop-run:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  if (!data?.user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });

  // The tenant is derived from the session, never taken from the body: a user may only advance their
  // own loop. RLS would stop a cross-tenant read anyway; this stops it one layer earlier.
  const tenant = data.user.id;

  const sb = serviceClient();
  if (!sb) return Response.json({ ok: false, error: "not configured" }, { status: 503 });

  const result = await runNow(tenant, {
    tick: (t) => tickLoop(t, defaultDeps(sb, process.env.SLACK_LOOP_CHANNEL)),
    halted: (t) => killSwitch.isHalted({ agent: "loop-driver", customer: t }),
    ...cooldown,
  });

  // 429 when cooling down so a client can honour Retry-After; every other outcome is a 200 with an
  // honest transcript, including "nothing to do right now", which is a real answer and not an error.
  const status = result.stoppedBecause === "cooling-down" ? 429 : 200;
  const headers = result.retryAfterSeconds ? { "Retry-After": String(result.retryAfterSeconds) } : undefined;
  return Response.json(result, { status, headers });
}

// GET is a capability probe, matching the house pattern on /api/execute: it says what this endpoint
// does without doing it, so a client can render the button before anyone is signed in.
export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "POST /api/loop/run",
    what: "Advances your loop now instead of waiting for the nightly tick.",
    requires: "an authenticated session",
    limits: { maxTicksPerCall: 3, cooldownSeconds: 60 },
    neverBypasses: ["the kill switch", "a step that needs a human"],
  });
}
