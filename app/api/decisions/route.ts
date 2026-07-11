import { getServerSupabase } from "@/lib/supabase/server";
import { loadPendingDecisions, recordVerdict } from "@/lib/engine/decisions-db";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// The executive decision queue (Day One). GET = the principal's pending prepared decisions, oldest
// first. POST = their verdict — approve / reject / modify — recorded exclusively through their own RLS
// session (like mandate signing: the human act is the human's authenticated act; no service-role path
// here). Approve marks executable only — execution still passes the mandate+policy double gate.

export async function GET() {
  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: true, configured: false, signedIn: false, decisions: [] }); // honest: no DB, empty inbox
  const { data } = await auth.auth.getUser();
  // Signed-out reads an EMPTY inbox (house fail-soft pattern — RLS scopes rows, so nothing can leak);
  // recording a verdict (POST) stays a strictly authenticated act.
  if (!data?.user) return Response.json({ ok: true, configured: true, signedIn: false, decisions: [] });
  const decisions = await loadPendingDecisions(auth).catch(() => []); // outage reads as empty, never a 500
  return Response.json({ ok: true, configured: true, signedIn: true, decisions });
}

export async function POST(req: Request) {
  if (await overLimit(`decisions:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { id?: string; verb?: string; note?: string; reason?: string } | null;
  const id = (body?.id ?? "").toString().trim();
  const verb = (body?.verb ?? "").toString().trim();
  if (!id || !["approve", "reject", "modify"].includes(verb)) {
    return Response.json({ ok: false, error: "id + verb (approve|reject|modify) required" }, { status: 400 });
  }
  if (verb === "modify" && !(body?.note ?? "").toString().trim()) {
    return Response.json({ ok: false, error: "modify requires a note — the desk needs to know what to change" }, { status: 400 });
  }
  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  if (!data?.user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });

  const verdict =
    verb === "approve" ? ({ verb: "approve" } as const)
    : verb === "reject" ? ({ verb: "reject", reason: (body?.reason ?? "").toString().trim() || undefined } as const)
    : ({ verb: "modify", note: (body!.note as string).trim() } as const);

  const result = await recordVerdict(auth, id, verdict).catch((e: unknown) => ({ ok: false, outcome: e instanceof Error ? e.message : "error" }));
  return Response.json(result, { status: result.ok ? 200 : 409 });
}
