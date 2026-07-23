import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { listPlaybooks } from "@/lib/core/playbooks";
import { startPlaybook } from "@/lib/loop/playbook-run";
import { TENANT_ZERO } from "@/lib/loop/ignition";
import { isFounderEmail } from "@/lib/engine/founders";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

// /api/playbooks (ADR-0022) — GET lists the library (public, same truth as /services). POST starts one:
// a signed-in owner points THEIR loop at a named strategy. Tenant resolution is ownership-shaped:
// a companyId the caller owns (RLS-verified) → that tenant; a founder with no companyId → company #0.
// The playbook itself runs through the loop engine — same governance, no new execution path.

export function GET() {
  return NextResponse.json({
    ok: true,
    playbooks: listPlaybooks().map(({ goal: _goal, ...meta }) => meta), // goal fns don't serialize; metadata does
  });
}

export async function POST(req: NextRequest) {
  if (await overLimit(`playbooks:${clientIp(req)}`)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "auth unavailable" }, { status: 503 });
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { playbook?: unknown; companyId?: unknown } | null;
  const playbookId = typeof body?.playbook === "string" ? body.playbook : "";
  const companyId = typeof body?.companyId === "string" ? body.companyId : undefined;
  if (!playbookId) return NextResponse.json({ ok: false, error: "missing playbook" }, { status: 400 });

  // Resolve the tenant by OWNERSHIP, never by request claim alone.
  let tenant: string;
  let company = { name: "your company", idea: "your product" };
  if (companyId) {
    // RLS returns the row only if the signed-in user owns it.
    const { data: owned } = await sb.from("companies").select("id, name, idea").eq("id", companyId).maybeSingle();
    if (!owned) return NextResponse.json({ ok: false, error: "not your company" }, { status: 403 });
    tenant = owned.id;
    company = { name: String(owned.name ?? company.name), idea: String(owned.idea ?? company.idea) };
  } else if (isFounderEmail(user.email)) {
    tenant = TENANT_ZERO;
    company = { name: "competitor.inc", idea: "the autonomous software company, governed by one human" };
  } else {
    return NextResponse.json({ ok: false, error: "companyId required" }, { status: 400 });
  }

  // Loop writes go through the service role (the loops table is driver-owned); ownership was verified above.
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: "not configured (no service role)" }, { status: 503 });
  const result = await startPlaybook(svc, { userId: user.id, tenant, playbookId, company });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
