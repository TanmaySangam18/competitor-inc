import { NextRequest, NextResponse } from "next/server";
import { verifyState } from "@/lib/core/oauth";
import { CONNECTIONS } from "@/lib/core/connections";
import { saveUserConnection, vaultReady } from "@/lib/engine/user-connections-db";
import { serviceClient } from "@/lib/engine/service";

// POST /api/cli/store — the CLI stores one key into the caller's ENCRYPTED vault (ADR-0011).
// Auth = the pairing token (HMAC user-bound, 10-min box, provider "cli" — same primitive as OAuth
// state). The value is encrypted before it touches the DB and is never logged or echoed back.

export async function POST(req: NextRequest) {
  if (!vaultReady()) return NextResponse.json({ ok: false, error: "vault not armed (CONNECTIONS_SECRET)" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { token?: string; connectionId?: string; envName?: string; value?: string } | null;
  const token = body?.token ?? "", connectionId = body?.connectionId ?? "", envName = body?.envName ?? "", value = body?.value ?? "";
  if (!token || !connectionId || !envName || !value) return NextResponse.json({ ok: false, error: "token, connectionId, envName, value required" }, { status: 400 });
  if (value.length > 4096) return NextResponse.json({ ok: false, error: "value too long" }, { status: 400 });

  const st = verifyState(token, process.env.CONNECTIONS_SECRET ?? "");
  if (!st || st.provider !== "cli") return NextResponse.json({ ok: false, error: "invalid or expired pairing code" }, { status: 401 });

  const conn = CONNECTIONS.find((c) => c.id === connectionId);
  if (!conn) return NextResponse.json({ ok: false, error: "unknown connection id" }, { status: 404 });
  if (!conn.env.includes(envName)) return NextResponse.json({ ok: false, error: `${envName} is not a key of ${conn.name}` }, { status: 400 });

  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: "server db not configured" }, { status: 503 });
  try {
    await saveUserConnection(svc, { userId: st.userId, provider: `key:${connectionId}`, connectionId, token: { [envName]: value }, meta: { via: "cli", env: envName } });
  } catch {
    return NextResponse.json({ ok: false, error: "store failed — nothing saved" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
