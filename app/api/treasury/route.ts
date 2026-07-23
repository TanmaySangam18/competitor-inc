import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { listEnvelopes, setCap } from "@/lib/engine/treasury-db";
import { envelopeStatus, spendDepartments } from "@/lib/core/treasury";
import { POLICY } from "@/lib/engine/policy";

// The treasury API (ADR-0020): read your department envelopes; SET a cap — the one human act, the
// standing authorization that lets in-budget spend run silently. Session-bound client throughout →
// RLS enforces ownership; withdrawals have no endpoint here by design (human-only, never automated).

const SPEND_DEPARTMENTS = spendDepartments();

async function requireUser() {
  const sb = await getServerSupabase();
  if (!sb) return { sb: null, user: null };
  const { data } = await sb.auth.getUser();
  return { sb, user: data?.user ?? null };
}

export async function GET() {
  const { sb, user } = await requireUser();
  if (!sb) return NextResponse.json({ ok: false, error: "auth unavailable" }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const saved = await listEnvelopes(sb, user.id);
  const byDept = new Map(saved.map((e) => [e.department, e]));
  const envelopes = SPEND_DEPARTMENTS.map((d) => {
    const env = byDept.get(d) ?? { department: d, monthlyCapUsd: 0, spentThisMonthUsd: 0 };
    return { ...env, ...envelopeStatus(env) };
  });
  return NextResponse.json({ ok: true, envelopes, perTransactionCapUsd: POLICY.spend.perTransactionCapUsd });
}

export async function POST(req: NextRequest) {
  const { sb, user } = await requireUser();
  if (!sb) return NextResponse.json({ ok: false, error: "auth unavailable" }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { department?: unknown; monthlyCapUsd?: unknown } | null;
  const department = typeof body?.department === "string" ? body.department : "";
  const cap = typeof body?.monthlyCapUsd === "number" ? body.monthlyCapUsd : NaN;
  if (!SPEND_DEPARTMENTS.includes(department)) {
    return NextResponse.json({ ok: false, error: "unknown or non-spending department" }, { status: 400 });
  }
  if (!Number.isFinite(cap) || cap < 0 || cap > 100000) {
    return NextResponse.json({ ok: false, error: "cap must be a number from 0 to 100000" }, { status: 400 });
  }
  try {
    await setCap(sb, user.id, department, cap);
  } catch {
    return NextResponse.json({ ok: false, error: "could not save the cap" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
