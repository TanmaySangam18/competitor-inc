import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isCampusEmail, campusGateEnabled } from "@/lib/org/campus-access";
import { isFounderEmail } from "@/lib/engine/founders";

// Next 16's request-interception layer (renamed from `middleware`). Two jobs:
//  1) MAINTENANCE GATE — while the backend is rebuilt, public pages show /maintenance. Default: Vercel
//     PRODUCTION = down; dev / CI / preview = up (so work, tests, and previews aren't blocked). Toggle in
//     Vercel: MAINTENANCE=0 → go live · MAINTENANCE=1 → force on. APIs + assets stay reachable.
//  2) Supabase session refresh + the campus gate on the AUTHED surfaces (unchanged) — so server-side reads
//     (esp. the /api/execute keystone) always see a valid user. No-op when Supabase is unconfigured.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function inMaintenance(): boolean {
  // LIVE by default (2026-07-15 go-live, founder-approved): the safety gate is 8/8 and the simulation
  // drills pass, so public pages are viewable. The site is a keyless demo (no real build/send/charge fires
  // without connected keys) and the authed product stays campus-gated, so view-public is low-risk.
  // Re-hide switch: set MAINTENANCE=1 in Vercel to force the whole site back to /maintenance instantly.
  return process.env.MAINTENANCE === "1";
}

const AUTHED_API = new Set(["/api/execute", "/api/enrich", "/api/proof"]);
const isAuthedSurface = (p: string) => p.startsWith("/dashboard") || p.startsWith("/house") || AUTHED_API.has(p);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Maintenance — public pages only (APIs and /maintenance are excluded here; assets via the matcher).
  if (inMaintenance() && !pathname.startsWith("/api/") && pathname !== "/maintenance") {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next({ request: req });

  // 2) Session refresh + campus gate — only on the authed surfaces (don't call getUser on every public page).
  if (!isAuthedSurface(pathname) || !URL || !ANON) return res;
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

    // Defense-in-depth NU gate: block an authed non-campus, non-founder user on every authed surface when
    // the gate is on — 403 for APIs, redirect for pages. Anonymous requests fall through.
    if (campusGateEnabled()) {
      const email = data?.user?.email;
      if (email && !isCampusEmail(email) && !isFounderEmail(email)) {
        if (pathname.startsWith("/api/")) {
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

// All routes except Next internals, the favicon, and the maintenance page itself. APIs ARE matched so the
// authed-API session refresh still runs; the maintenance gate above skips anything under /api.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|maintenance).*)"],
};
