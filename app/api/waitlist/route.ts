import { createClient } from "@supabase/supabase-js";
import { codeFrom } from "@/lib/engine/refcode";
import { notifyFounder } from "@/lib/engine/notify-founder";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Server-side waitlist capture. Persists a real signup (email + referral) to Supabase and returns
// the person's position + referral count for the "move up the line" mechanic.
//
// GATED + fail-soft, by design:
//  - No Supabase service role set → returns { persisted: false }. The /join page keeps its localStorage
//    copy, exactly as before. The product still works; signups just aren't captured centrally yet.
//  - Any DB error → we still return ok (never block a signup on our infra hiccup); we just don't persist.
// Lights up the moment Block 0 sets NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

const REFERRAL_BUMP = 5; // every friend who joins moves you up this many spots (honest, fixed)

// Public count endpoint — no email, just the total. Fail-soft (returns 0 when DB not configured).
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ count: 0 });
  try {
    const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { count } = await sb.from("waitlist").select("id", { count: "exact", head: true });
    return Response.json({ count: count ?? 0 });
  } catch {
    return Response.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  if (rateLimited(`waitlist:${clientIp(req)}`)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const ref = typeof b.ref === "string" && b.ref ? b.ref.slice(0, 16) : null;

  if (!email.includes("@") || email.length < 3 || email.length > 200) {
    return Response.json({ error: "invalid email" }, { status: 400 });
  }
  const code = codeFrom(email);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ ok: true, code, persisted: false });
  }

  try {
    const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Is this a brand-new signup? (so we only email the founder once, not on every returning-visitor sync)
    const prior = await sb.from("waitlist").select("email").eq("email", email).maybeSingle();
    const isNew = !prior.data;

    // Idempotent: re-joining with the same email is a no-op insert (lets returning visitors refresh
    // their position without creating duplicates).
    const { error: insErr } = await sb
      .from("waitlist")
      .upsert({ email, code, ref }, { onConflict: "email", ignoreDuplicates: true });
    if (insErr) {
      console.error("[/api/waitlist] insert failed:", insErr.message);
      return Response.json({ ok: true, code, persisted: false });
    }
    if (isNew) {
      void notifyFounder(
        "competitor.inc — new waitlist signup 🎉",
        `<p><b>${email}</b> just joined the waitlist${ref ? ` (referred by ${ref})` : ""}.</p>`
      ).catch(() => {});
    }

    // Service role bypasses RLS, so these counts are safe server-side (never exposed to the client API).
    const total = await sb.from("waitlist").select("id", { count: "exact", head: true });
    const refs = await sb.from("waitlist").select("id", { count: "exact", head: true }).eq("ref", code);
    const signups = total.count ?? 1;
    const referrals = refs.count ?? 0;
    const position = Math.max(1, signups - referrals * REFERRAL_BUMP);

    return Response.json({ ok: true, code, persisted: true, position, referrals });
  } catch (err) {
    console.error("[/api/waitlist] failed:", err instanceof Error ? err.message : "unknown");
    return Response.json({ ok: true, code, persisted: false });
  }
}
