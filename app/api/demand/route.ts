import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Real demand-test API — the live, measured counterpart to the AI-estimate Validation Gate.
//  POST { action: "create", slug, headline, subhead?, goal? }  → founder/agent stands up a test (service role)
//  POST { action: "signup", slug, email }                      → a real stranger signs up (public, fail-soft)
//  GET  ?slug=...                                              → { signups, goal, verdict } for the dashboard
//
// GATED + fail-soft: with no Supabase service role, create/signup return { persisted:false } and GET
// returns zero — the feature is dormant until Block 0 sets the keys, and never throws.

function sb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const slugify = (s: string) => s.slice(0, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const client = sb();

  if (b.action === "signup") {
    const slug = typeof b.slug === "string" ? slugify(b.slug) : "";
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    if (!slug || !email.includes("@") || email.length < 3 || email.length > 200) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }
    if (!client) return Response.json({ ok: true, persisted: false });
    try {
      const { error } = await client
        .from("demand_signups")
        .upsert({ slug, email }, { onConflict: "slug,email", ignoreDuplicates: true });
      if (error) {
        console.error("[/api/demand] signup failed:", error.message);
        return Response.json({ ok: true, persisted: false });
      }
      return Response.json({ ok: true, persisted: true });
    } catch (e) {
      console.error("[/api/demand] signup threw:", e instanceof Error ? e.message : "unknown");
      return Response.json({ ok: true, persisted: false });
    }
  }

  if (b.action === "create") {
    // create stands up a PUBLIC landing page at /t/<slug>, so it's the abuse-sensitive path. There's
    // no auth on the client (the dashboard panel calls it unauthenticated), so guard it per-IP to stop
    // a stranger from spraying junk tests on the domain. Real auth is a Block-0 follow-up.
    if (rateLimited(`demand:${clientIp(req)}`)) {
      return Response.json({ error: "rate limited" }, { status: 429 });
    }
    const slug = typeof b.slug === "string" ? slugify(b.slug) : "";
    const headline = typeof b.headline === "string" ? b.headline.slice(0, 140).trim() : "";
    const subhead = typeof b.subhead === "string" ? b.subhead.slice(0, 280).trim() : "";
    const goal = typeof b.goal === "number" && Number.isFinite(b.goal) ? Math.max(1, Math.min(100000, Math.round(b.goal))) : 25;
    if (!slug || !headline) return Response.json({ error: "invalid" }, { status: 400 });
    if (!client) return Response.json({ ok: true, persisted: false, slug });
    try {
      const { error } = await client.from("demand_tests").upsert({ slug, headline, subhead, goal }, { onConflict: "slug" });
      if (error) {
        console.error("[/api/demand] create failed:", error.message);
        return Response.json({ ok: false, persisted: false, slug });
      }
      return Response.json({ ok: true, persisted: true, slug });
    } catch (e) {
      console.error("[/api/demand] create threw:", e instanceof Error ? e.message : "unknown");
      return Response.json({ ok: true, persisted: false, slug });
    }
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}

export async function GET(req: Request) {
  const slug = slugify(new URL(req.url).searchParams.get("slug") || "");
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
  const client = sb();
  if (!client) return Response.json({ ok: true, persisted: false, signups: 0, goal: 25, verdict: "weak", live: false });
  try {
    const test = await client.from("demand_tests").select("goal").eq("slug", slug).maybeSingle();
    const cnt = await client.from("demand_signups").select("id", { count: "exact", head: true }).eq("slug", slug);
    const signups = cnt.count ?? 0;
    const goal = test.data?.goal ?? 25;
    // Honest verdict against the pre-set threshold: >=goal strong, >=40% mixed, else weak.
    const verdict = signups >= goal ? "strong" : signups >= Math.ceil(goal * 0.4) ? "mixed" : "weak";
    return Response.json({ ok: true, persisted: true, signups, goal, verdict, live: !!test.data });
  } catch (e) {
    console.error("[/api/demand] GET threw:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: true, persisted: false, signups: 0, goal: 25, verdict: "weak", live: false });
  }
}
