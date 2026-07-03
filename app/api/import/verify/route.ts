import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";
import { normalizeHost, ownershipToken, verifyOwnership } from "@/lib/engine/ownership";

export const runtime = "nodejs";

// ⏳ STAGED (2026-07-03): correct + tested, but intentionally NOT yet wired into ImportPanel — it's the
// backend for the v2 "private-until-paid / operate an imported product" gate. Kept (not deleted) so
// the UX can adopt it when that gate ships; smoke covers it. Not dead code — deferred by decision.
//
// v2 — Import ownership verification (PDR §5). Self-only: the SUBJECT is the signed-in user, never a
// request param, so a user can only ever verify a domain for themselves. Two calls:
//   POST { url }              → the token + setup instructions (DNS TXT or a well-known file).
//   POST { url, check: true } → actually probe DNS + the file and report verified true/false.
// Operating an imported project is what this gates; reading/auditing it stays open (that's /api/import).
async function subjectEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = await getServerSupabase();
    const { data } = (await sb?.auth.getUser()) ?? { data: null };
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (rateLimited(`verify:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const url = typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url.trim() : "";
  const check = (body as { check?: unknown })?.check === true;
  if (!url) return Response.json({ ok: false, error: "no url" }, { status: 400 });

  const host = normalizeHost(url);
  if (!host) return Response.json({ ok: false, error: "that doesn't look like a domain" }, { status: 400 });

  const subject = await subjectEmail();
  if (!subject) {
    // Honest: ownership is meaningless without an identity. We don't hand out a token to a guest.
    return Response.json({ ok: true, signedIn: false, host, error: "sign in to verify this domain" });
  }

  const token = ownershipToken(subject, host);
  const instructions = {
    dns: `Add a TXT record for "_competitor-inc-verify.${host}" with value: ${token}`,
    file: `Or host this exact text at https://${host}/.well-known/competitor-inc-verify : ${token}`,
  };

  if (!check) {
    return Response.json({ ok: true, signedIn: true, host, token, instructions });
  }

  const result = await verifyOwnership(url, subject);
  return Response.json({ ok: true, signedIn: true, ...result, instructions });
}
