import { getServerSupabase } from "@/lib/supabase/server";
import { loadMandate, saveMandate, UNSIGNED } from "@/lib/engine/mandates-db";
import { defaultMandate, type CustomerMandate, type MandateAct } from "@/lib/org/customer-mandate";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// The customer's standing mandate (Consent Rails). Everything goes through the caller's RLS session —
// only the owner can read or write their mandate; there is deliberately NO service-role path here (the
// cron reads with the service role elsewhere; signing is exclusively the human's own authenticated act).

const KNOWN: MandateAct[] = ["build_software", "deploy", "publish_content", "outreach", "spend_platform_budget", "collect_revenue"];

export async function GET(req: Request) {
  const companyId = (new URL(req.url).searchParams.get("companyId") ?? "").trim();
  if (!companyId) return Response.json({ ok: false, error: "companyId required" }, { status: 400 });
  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: true, configured: false, mandate: UNSIGNED });
  const { data } = await auth.auth.getUser();
  if (!data?.user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });
  const mandate = await loadMandate(auth, companyId).catch(() => UNSIGNED); // outage never widens authority
  return Response.json({ ok: true, configured: true, mandate });
}

export async function POST(req: Request) {
  if (await overLimit(`mandate:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as
    | { companyId?: string; action?: string; monthlySpendCapCents?: number; scopes?: string[] }
    | null;
  const companyId = (body?.companyId ?? "").toString().trim();
  const action = (body?.action ?? "").toString();
  if (!companyId || !["sign", "revoke", "kill", "unkill", "update"].includes(action)) {
    return Response.json({ ok: false, error: "companyId + valid action required" }, { status: 400 });
  }

  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  const user = data?.user;
  if (!user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });

  const current = await loadMandate(auth, companyId).catch(() => UNSIGNED);
  let next: CustomerMandate;
  if (action === "sign") {
    next = defaultMandate();
  } else if (action === "revoke") {
    next = { ...current, signedAt: null }; // unsigned ⇒ deny-by-default everywhere
  } else if (action === "kill") {
    next = { ...current, killSwitch: true }; // one write halts everything
  } else if (action === "unkill") {
    next = { ...current, killSwitch: false };
  } else {
    // update — scopes filtered to the ABSORBABLE set only (the irreducible floor can't be scoped in),
    // cap clamped to a sane ceiling. Only meaningful on an already-signed mandate.
    if (!current.signedAt) return Response.json({ ok: false, error: "sign the mandate first" }, { status: 400 });
    const scopes = Array.isArray(body?.scopes)
      ? (body!.scopes.filter((s): s is MandateAct => (KNOWN as string[]).includes(s)))
      : current.scopes;
    const cap = Number.isFinite(body?.monthlySpendCapCents)
      ? Math.max(0, Math.min(1_000_000, Math.floor(body!.monthlySpendCapCents!)))
      : current.monthlySpendCapCents;
    next = { ...current, scopes, monthlySpendCapCents: cap };
  }

  try {
    await saveMandate(auth, user.id, companyId, next);
  } catch (e) {
    console.error("[/api/mandate] save failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false, error: "could not save (is migration 0027 applied?)" }, { status: 500 });
  }
  return Response.json({ ok: true, mandate: next });
}
