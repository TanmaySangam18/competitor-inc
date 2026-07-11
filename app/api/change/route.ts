import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { loadMandate, UNSIGNED } from "@/lib/engine/mandates-db";
import { decideMandate } from "@/lib/org/customer-mandate";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";
import { FULLSTACK_BUILDS } from "@/lib/engine/fullstack-build";
import { runChange } from "@/lib/engine/change-desk";

export const runtime = "nodejs";

// The Change Desk (R9): a subscriber asks for a real code change to an existing product. A change is a
// `build_software` (+ `deploy`) act, so it goes through the customer's mandate (Consent Rails) first — the
// RLS mandate load also proves the caller owns this company. Then the engine loads the product's memory,
// dispatches an incremental build with the recall brief, and records the change as an ADR (service role).
export async function POST(req: Request) {
  if (await overLimit(`change:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { companyId?: string; product?: string; request?: string } | null;
  const companyId = (body?.companyId ?? "").toString().trim();
  const product = (body?.product ?? "").toString().trim();
  const request = (body?.request ?? "").toString().trim();
  if (!companyId || !product || !request) {
    return Response.json({ ok: false, error: "companyId, product, and request are required" }, { status: 400 });
  }

  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  const user = data?.user;
  if (!user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });

  // Consent Rails: the RLS session only loads a mandate the caller owns, so an `auto` here means BOTH
  // "you own this company" AND "you authorized changes." A change touches code + deploy — gate on both.
  const mandate = await loadMandate(auth, companyId).catch(() => UNSIGNED);
  for (const act of ["build_software", "deploy"] as const) {
    const gate = decideMandate(act, mandate);
    if (gate.decision !== "auto") {
      // Honest: not a failure — it needs the human. Surface the reason; the UI routes to the mandate card.
      return Response.json({ ok: false, needsYou: true, act, reason: gate.reason }, { status: 200 });
    }
  }

  // Builds are platform-configured (founder's token + flag until a customer connects their own). If not
  // configured on this deployment, say so plainly — never pretend a build was queued.
  const token = process.env.GITHUB_TOKEN;
  if (!FULLSTACK_BUILDS || !token) {
    return Response.json({ ok: true, queued: false, reason: "builds are not configured on this deployment yet" }, { status: 200 });
  }

  // The ADR write is service-role (owners have no insert policy on product_docs). Authorized above.
  const svc = serviceClient();
  if (!svc) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });

  const result = await runChange({ client: svc, userId: user.id, companyId, product, request, token });
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
