import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isCampusEmail, campusGateEnabled } from "@/lib/org/campus-access";
import { isFounderEmail } from "@/lib/engine/founders";

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
    const { data } = await supabase.auth.getUser(); // refreshes the session + writes refreshed cookies onto `res`

    // Defense-in-depth NU gate (Phase 4): the OAuth callback blocks a non-campus sign-in, but a session
    // ISSUED BEFORE the gate was turned on would otherwise keep reaching /dashboard. When the gate is on,
    // block an authed non-campus, non-founder user on every authed surface — 403 for APIs, redirect for
    // pages. Anonymous requests fall through (the page/route handles its own sign-in redirect).
    if (campusGateEnabled()) {
      const email = data?.user?.email;
      if (email && !isCampusEmail(email) && !isFounderEmail(email)) {
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return NextResponse.json({ ok: false, error: "campus_only" }, { status: 403 });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        url.searchParams.set("campus_only", "1");
        return NextResponse.redirect(url);
      }
    }
  } catch {
    /* never block a request on a refresh hiccup */
  }
  return res;
}

// Scope to the authed surfaces only — never run on public/marketing/static routes.
export const config = {
  matcher: ["/dashboard/:path*", "/house/:path*", "/api/execute", "/api/enrich", "/api/proof"],
};
