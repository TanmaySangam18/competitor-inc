import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// The canonical @supabase/ssr auth callback. OAuth (Google/GitHub) and magic links redirect here
// with a PKCE `?code=`; we exchange it server-side so the session cookies are set BEFORE the user
// lands on an authed page — no reliance on the destination page racing to initialize the browser
// client. `next` is confined to same-origin relative paths (open-redirect guard).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    try {
      const sb = await getServerSupabase();
      if (sb) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          return NextResponse.redirect(new URL(`/login?auth_error=${encodeURIComponent(error.message)}`, url.origin));
        }
      }
    } catch {
      return NextResponse.redirect(new URL("/login?auth_error=exchange_failed", url.origin));
    }
  }
  // Provider-side denials arrive as ?error_description=… — bounce them to /login visibly, not silently.
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (!code && providerError) {
    return NextResponse.redirect(new URL(`/login?auth_error=${encodeURIComponent(providerError)}`, url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
