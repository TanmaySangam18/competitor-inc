import type { SupabaseClient } from "@supabase/supabase-js";

// Persistent per-company agent memory (pgvector-backed). Fully gated + fail-soft:
//  - No embeddings key  → embed() returns null. remember() still stores the note text (recall by
//    vector just won't include it); recall() returns [] (no semantic search).
//  - No Supabase client → remember()/recall() are no-ops.
// Nothing here throws; it lights up the moment Block 0 sets Supabase + an embeddings key.
//
// Embeddings use any OpenAI-compatible /embeddings endpoint (OpenAI, Together, a self-host, …):
//   EMBEDDINGS_API_KEY  (required to turn it on)
//   EMBEDDINGS_BASE_URL (default https://api.openai.com/v1)
//   EMBEDDINGS_MODEL    (default text-embedding-3-small → 1536 dims, matching the migration)

export async function embed(text: string): Promise<number[] | null> {
  const key = process.env.EMBEDDINGS_API_KEY;
  if (!key || !text.trim()) return null;
  const base = process.env.EMBEDDINGS_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small";
  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      console.error("[memory] embed failed:", r.status);
      return null;
    }
    const j = await r.json();
    const v = j?.data?.[0]?.embedding;
    return Array.isArray(v) ? v : null;
  } catch (e) {
    console.error("[memory] embed threw:", e instanceof Error ? e.message : "unknown");
    return null;
  }
}

// Store one memory for a company. Returns whether it persisted.
export async function remember(
  sb: SupabaseClient | null,
  companyId: string,
  night: number,
  kind: string,
  content: string,
): Promise<boolean> {
  if (!sb || !companyId || !content.trim()) return false;
  const embedding = await embed(content); // null when no key — the note still persists
  try {
    const { error } = await sb.from("agent_memory").insert({
      company_id: companyId,
      night,
      kind: kind.slice(0, 40),
      content: content.slice(0, 2000),
      embedding,
    });
    if (error) {
      console.error("[memory] remember failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[memory] remember threw:", e instanceof Error ? e.message : "unknown");
    return false;
  }
}

// Recall the most relevant prior memories for a company, by semantic similarity to `query`.
// Returns [] when memory or embeddings aren't configured.
export async function recall(
  sb: SupabaseClient | null,
  companyId: string,
  query: string,
  k = 5,
): Promise<string[]> {
  if (!sb || !companyId) return [];
  const v = await embed(query);
  if (!v) return []; // no embeddings key → no semantic recall
  try {
    const { data, error } = await sb.rpc("match_agent_memory", { p_company: companyId, p_query: v, p_count: k });
    if (error) {
      console.error("[memory] recall failed:", error.message);
      return [];
    }
    return (data ?? []).map((row: { content: string }) => row.content).filter(Boolean);
  } catch (e) {
    console.error("[memory] recall threw:", e instanceof Error ? e.message : "unknown");
    return [];
  }
}
