import { getServerSupabase } from "@/lib/supabase/server";
import { recentCycles } from "@/lib/engine/cycle-store";

export const runtime = "nodejs";

// Recent supervised operating cycles for the "watch the org run" surface (/watch). Reads through the
// SESSION-bound client, so RLS returns only the signed-in owner's cycles; not signed in / no DB ⇒ [].
// Read-only, fail-soft — never 5xx the client.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
  try {
    const sb = await getServerSupabase();
    const cycles = await recentCycles(sb, limit);
    return Response.json({ cycles });
  } catch (e) {
    console.error("[/api/cycles] error:", e instanceof Error ? e.message : "unknown");
    return Response.json({ cycles: [] });
  }
}
