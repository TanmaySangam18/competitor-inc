import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getProvider, providerArmed, signState, authorizeUrl } from "@/lib/core/oauth";
import { vaultReady } from "@/lib/engine/user-connections-db";

// GET /api/oauth/[provider]/start — begin the "2 minutes" connect (ADR-0010). Auth required (the token
// must land on a real user's row); provider must be ARMED (founder registered the OAuth app) and the
// vault ready (CONNECTIONS_SECRET set) — otherwise honest errors, never a broken redirect.

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await ctx.params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 404 });
  if (!providerArmed(p)) return NextResponse.json({ ok: false, error: `${p.name} OAuth is not armed (set ${p.clientIdEnv} + ${p.clientSecretEnv})` }, { status: 503 });
  if (!vaultReady()) return NextResponse.json({ ok: false, error: "token vault not armed (set CONNECTIONS_SECRET)" }, { status: 503 });

  const auth = await getServerSupabase();
  if (!auth) return NextResponse.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  const user = data?.user;
  if (!user) return NextResponse.redirect(new URL(`/login?next=/api/oauth/${p.id}/start`, req.nextUrl.origin));

  const secret = process.env.CONNECTIONS_SECRET!;
  const state = signState({ provider: p.id, userId: user.id }, secret);
  const redirectUri = `${req.nextUrl.origin}/api/oauth/${p.id}/callback`;
  return NextResponse.redirect(authorizeUrl(p, state, redirectUri));
}
