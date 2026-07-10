import { serviceClient } from "@/lib/engine/service";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// The client polls this with the ids of its still-pending approvals; we return only those that were
// decided out-of-band (e.g. tapped in Telegram). The client then applies each via resolveApproval — so
// effects run exactly once in the app, not duplicated server-side. GATED + fail-soft: no Supabase ⇒
// empty. Decisions hold no PII and approval ids are unguessable uuids.
//  GET /api/telegram/decisions?ids=<uuid>,<uuid>  →  { decisions: { "<id>": "approved" | "rejected" } }
export async function GET(req: Request) {
  if (await overLimit(`tgdec:${clientIp(req)}`)) return Response.json({ decisions: {} }, { status: 429 });
  const raw = new URL(req.url).searchParams.get("ids") || "";
  const ids = raw.split(",").map((s) => s.trim()).filter((s) => /^[0-9a-fA-F-]{6,40}$/.test(s)).slice(0, 50);
  if (ids.length === 0) return Response.json({ decisions: {} });

  const sb = serviceClient();
  if (!sb) return Response.json({ decisions: {} });
  try {
    const { data } = await sb.from("approval_decisions").select("approval_id, decision").in("approval_id", ids);
    const decisions: Record<string, string> = {};
    for (const row of data ?? []) decisions[row.approval_id as string] = row.decision as string;
    return Response.json({ decisions });
  } catch (e) {
    console.error("[/api/telegram/decisions] failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ decisions: {} });
  }
}
