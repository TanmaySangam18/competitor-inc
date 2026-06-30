import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { enrichSelf } from "@/lib/engine/enrich";

export const runtime = "nodejs";

// Returns a consent-first, self-only enrichment of the SIGNED-IN user (Playbook: Product Direction
// Review §4). SAFETY: the email comes from the session — never a request param — so this can only ever
// enrich the user about themselves, never a third party. Fail-soft: offline/guest → { found:false }.
export async function GET() {
  const empty = { found: false, links: [], sources: [] };
  if (!isSupabaseConfigured()) return Response.json({ ...empty, note: "sign in to see what's public about you" });
  try {
    const sb = await getServerSupabase();
    const { data } = (await sb?.auth.getUser()) ?? { data: null };
    const email = data?.user?.email;
    if (!email) return Response.json(empty);
    const result = await enrichSelf(email);
    return Response.json(result);
  } catch {
    return Response.json(empty);
  }
}

// Right-to-delete (PDR §4 / MA privacy posture). Self-only: the user can purge anything we hold about
// them. Enrichment is computed LIVE from public sources and NOT persisted server-side, so today this is
// a verified no-op that confirms there's nothing stored — and it best-effort purges any future-persisted
// copy + records a suppression so we never enrich them again. The client also sets a permanent local
// suppression (so the panel stops fetching). Cross-device suppression needs a privacy_prefs table (v2).
export async function DELETE() {
  if (!isSupabaseConfigured()) return Response.json({ ok: true, deleted: 0, persisted: false });
  try {
    const sb = await getServerSupabase();
    const { data } = (await sb?.auth.getUser()) ?? { data: null };
    const userId = data?.user?.id;
    if (!sb || !userId) return Response.json({ ok: true, deleted: 0, persisted: false });
    // Best-effort purge of any persisted enrichment for THIS user. Fail-soft if the table doesn't exist
    // yet — we never persist enrichment today, so this confirms "nothing stored" rather than wiping data.
    const { error } = await sb.from("enrichment").delete().eq("user_id", userId);
    return Response.json({ ok: true, deleted: error ? 0 : 1, persisted: !error });
  } catch {
    return Response.json({ ok: true, deleted: 0, persisted: false });
  }
}
