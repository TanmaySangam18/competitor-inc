import { serviceClient } from "@/lib/engine/service";
import { codeFrom } from "@/lib/engine/refcode";
import { captureLead, DIRECT_CONTACT } from "@/lib/engine/lead-fallback";
import { notifyFounder } from "@/lib/engine/notify-founder";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

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
  const sb = serviceClient();
  if (!sb) return Response.json({ count: 0 });
  try {
    const { count } = await sb.from("waitlist").select("id", { count: "exact", head: true });
    return Response.json({ count: count ?? 0 });
  } catch {
    return Response.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  if (await overLimit(`waitlist:${clientIp(req)}`)) {
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

  // Every path below that cannot persist routes through here, so a lead is never dropped in silence.
  const rescue = async (why: string) => {
    const got = await captureLead({ email, ref, why });
    if (got.reached) {
      // The founder has it. From the visitor's point of view they ARE on the list, which is true.
      return Response.json({ ok: true, code, persisted: false, reached: true });
    }
    // Nothing caught it. Telling the visitor is the only way the lead survives.
    return Response.json(
      {
        ok: false,
        error: `We could not save that just now. Please email ${DIRECT_CONTACT} directly and you will be added by hand.`,
        detail: got.why,
      },
      { status: 503 }
    );
  };

  const sb = serviceClient();
  if (!sb) return rescue("no database configured");

  try {
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
      return rescue(`insert failed: ${insErr.message}`);
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
    return rescue(err instanceof Error ? err.message : "unknown error");
  }
}
