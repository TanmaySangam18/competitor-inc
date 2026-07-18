import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { getProvider, providerArmed, verifyState, exchangeCode } from "@/lib/core/oauth";
import { saveUserConnection, vaultReady } from "@/lib/engine/user-connections-db";

// GET /api/oauth/[provider]/callback — the provider sends the user back with ?code&state. Verify the
// HMAC state (CSRF + user binding + 10-min age), exchange the code, store the token ENCRYPTED on the
// signed-in user's row, land back on /connect with an honest banner either way.

const back = (origin: string, q: string) => NextResponse.redirect(new URL(`/connect?${q}`, origin));

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await ctx.params;
  const origin = req.nextUrl.origin;
  const p = getProvider(id);
  if (!p || !providerArmed(p) || !vaultReady()) return back(origin, "error=oauth_not_armed");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) return back(origin, "error=missing_code");

  const st = verifyState(state, process.env.CONNECTIONS_SECRET!);
  if (!st || st.provider !== p.id) return back(origin, "error=bad_state");

  const auth = await getServerSupabase();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  const user = data?.user;
  if (!user || user.id !== st.userId) return back(origin, "error=session_mismatch"); // state bound to a different session

  const redirectUri = `${origin}/api/oauth/${p.id}/callback`;
  const token = await exchangeCode(p, code, redirectUri);
  if (!token.ok) return back(origin, `error=${encodeURIComponent(token.error)}`);

  const svc = serviceClient();
  if (!svc) return back(origin, "error=server_db_missing");
  try {
    await saveUserConnection(svc, { userId: user.id, provider: p.id, connectionId: p.connectionId, token: { access_token: token.accessToken }, meta: token.meta });
  } catch {
    return back(origin, "error=store_failed"); // token NOT stored — say so, never pretend connected
  }
  return back(origin, `connected=${p.id}`);
}
