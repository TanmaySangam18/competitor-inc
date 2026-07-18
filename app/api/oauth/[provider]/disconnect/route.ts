import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getProvider } from "@/lib/core/oauth";
import { deleteUserConnection } from "@/lib/engine/user-connections-db";
import { serviceClient } from "@/lib/engine/service";

// POST /api/oauth/[provider]/disconnect — revocation is a first-class right (BYOK custody). Deletes the
// encrypted row for the signed-in user. (Provider-side app deauthorization is theirs to do on the
// provider's page; we say so rather than pretending we revoked upstream.)

export async function POST(_req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await ctx.params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 404 });
  const auth = await getServerSupabase();
  if (!auth) return NextResponse.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  if (!data?.user) return NextResponse.json({ ok: false, error: "sign in required" }, { status: 401 });
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: "server db not configured" }, { status: 503 });
  await deleteUserConnection(svc, data.user.id, p.id);
  return NextResponse.json({ ok: true, note: "token deleted here; to deauthorize the app on the provider side, use their settings page" });
}
