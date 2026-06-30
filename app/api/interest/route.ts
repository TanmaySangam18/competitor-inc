import { createClient } from "@supabase/supabase-js";
import { notifyFounder } from "@/lib/engine/notify-founder";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Generic interest/signup capture for standalone apps we launch (e.g. /lockin). Real capture, honest
// fallback: with no Supabase service role set it returns { persisted:false } (the app still confirms to
// the user, we just can't store centrally yet). Lights up the moment SUPABASE keys are configured.
// Same-origin only in practice (served from this deployment). Validated + rate-limited.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const app = (url.searchParams.get("app") || "").slice(0, 40);
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !serviceKey) return Response.json({ count: 0, persisted: false });
  try {
    const sb = createClient(dbUrl, serviceKey, { auth: { persistSession: false } });
    let q = sb.from("interest").select("id", { count: "exact", head: true });
    if (app) q = q.eq("app", app);
    const { count } = await q;
    return Response.json({ count: count ?? 0, persisted: true });
  } catch {
    return Response.json({ count: 0, persisted: false });
  }
}

export async function POST(req: Request) {
  if (rateLimited(`interest:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const app = typeof b.app === "string" ? b.app.trim().slice(0, 40) : "unknown";
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 500) : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !serviceKey) {
    // Honest: we accept it client-side but can't persist centrally yet.
    return Response.json({ ok: true, persisted: false });
  }
  try {
    const sb = createClient(dbUrl, serviceKey, { auth: { persistSession: false } });
    const prior = await sb.from("interest").select("email").eq("email", email).eq("app", app).maybeSingle();
    const isNew = !prior.data;
    const { error: insErr } = await sb
      .from("interest")
      .upsert({ email, app, note }, { onConflict: "email,app", ignoreDuplicates: true });
    if (insErr) {
      console.error("[/api/interest] insert failed:", insErr.message);
      return Response.json({ ok: true, persisted: false });
    }
    if (isNew) {
      void notifyFounder(
        `${app} — new signup 🎉`,
        `<p><b>${email}</b> just signed up for <b>${app}</b>.${note ? ` Note: ${note}` : ""}</p>`
      ).catch(() => {});
    }
    const { count } = await sb.from("interest").select("id", { count: "exact", head: true }).eq("app", app);
    return Response.json({ ok: true, persisted: true, count: count ?? 1 });
  } catch (err) {
    console.error("[/api/interest] failed:", err instanceof Error ? err.message : "unknown");
    return Response.json({ ok: true, persisted: false });
  }
}
