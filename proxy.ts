import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next 16 renamed the `middleware` file convention to `proxy` (same request-interception API). This refreshes
// the Supabase auth session cookie on the authed surfaces, so server-side reads (esp. the /api/execute
// keystone) always see a valid user instead of falsely refusing on an expired token. No-op when Supabase is
// unconfigured (offline/sim) so the local product is unchanged.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  if (!URL || !ANON) return res; // unconfigured → do nothing
  try {
    const supabase = createServerClient(URL, ANON, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser(); // refreshes the session + writes refreshed cookies onto `res`
  } catch {
    /* never block a request on a refresh hiccup */
  }
  return res;
}

// Scope to the authed surfaces only — never run on public/marketing/static routes.
export const config = {
  matcher: ["/dashboard/:path*", "/house/:path*", "/api/execute", "/api/enrich", "/api/proof"],
};
