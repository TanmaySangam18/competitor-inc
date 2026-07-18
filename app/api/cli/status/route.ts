import { NextRequest, NextResponse } from "next/server";
import { verifyState } from "@/lib/core/oauth";
import { listUserConnections } from "@/lib/engine/user-connections-db";
import { serviceClient } from "@/lib/engine/service";

// POST /api/cli/status — verify a pairing token + list the caller's OWN vault entries (names/meta
// only — never token material). Doubles as the CLI's pairing check.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const st = body?.token ? verifyState(body.token, process.env.CONNECTIONS_SECRET ?? "") : null;
  if (!st || st.provider !== "cli") return NextResponse.json({ ok: false, error: "invalid or expired pairing code" }, { status: 401 });
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: "server db not configured" }, { status: 503 });
  try {
    const connections = await listUserConnections(svc, st.userId);
    return NextResponse.json({ ok: true, connections });
  } catch {
    return NextResponse.json({ ok: false, error: "vault read failed (is migration 0033 applied?)" }, { status: 500 });
  }
}
