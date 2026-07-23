import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { governAction } from "@/lib/core/govern";
import { assertSafeBaseUrl } from "@/lib/engine/net";
import { scanTarget, battlecard, type WatchDelta } from "@/lib/core/market-watch";

// Market-watch persistence + the governed scan runner (migration 0035, ADR-0024). The scan is a
// READ of public pages → governed as mcp_read (T1; growth AUTO). Every target URL passes the same
// SSRF wall as any user-supplied URL (assertSafeBaseUrl), and the robots gate inside scanTarget.

export interface WatchRow {
  url: string;
  name: string;
  snapshot: string;
  deltas: WatchDelta[];
  scanned_at: string | null;
}

export async function listWatch(sb: SupabaseClient, userId: string): Promise<WatchRow[]> {
  const { data } = await sb.from("market_watch").select("url, name, snapshot, deltas, scanned_at").eq("user_id", userId);
  return (data ?? []).map((r) => ({
    url: String(r.url), name: String(r.name), snapshot: String(r.snapshot ?? ""),
    deltas: (Array.isArray(r.deltas) ? r.deltas : []) as WatchDelta[], scanned_at: r.scanned_at ?? null,
  }));
}

export type WatchScanOutcome =
  | { name: string; url: string; ok: true; firstScan: boolean; deltas: WatchDelta[]; card: string }
  | { name: string; url: string; ok: false; error: string };

/** Scan one target for one owner: govern → SSRF wall → robots-gated fetch → diff → persist → card. */
export async function runWatchScan(
  sb: SupabaseClient,
  userId: string,
  target: { name: string; url: string },
  opts: { fetchImpl?: typeof fetch; now?: () => Date } = {},
): Promise<WatchScanOutcome> {
  const g = governAction({ type: "mcp_read", agent: "growth", reversible: true, hasCredential: true }, { input: `market-watch: ${target.url}` });
  if (g.decision.verdict !== "AUTO") return { ...target, ok: false, error: `governed: ${g.decision.verdict} — ${g.decision.reason}` };
  try {
    assertSafeBaseUrl(target.url);
  } catch (e) {
    return { ...target, ok: false, error: `unsafe url: ${e instanceof Error ? e.message : "rejected"}` };
  }

  const { data: prev } = await sb.from("market_watch").select("snapshot").eq("user_id", userId).eq("url", target.url).maybeSingle();
  const result = await scanTarget(target, String(prev?.snapshot ?? ""), opts.fetchImpl ?? fetch);
  if (!result.ok) return { ...target, ok: false, error: result.error };

  const scannedAt = (opts.now?.() ?? new Date()).toISOString();
  const { error } = await sb.from("market_watch").upsert({
    user_id: userId, url: target.url, name: target.name,
    snapshot: result.snapshot, deltas: result.deltas, scanned_at: scannedAt, updated_at: scannedAt,
  });
  if (error) return { ...target, ok: false, error: `persist: ${error.message}` };

  return { ...target, ok: true, firstScan: result.firstScan, deltas: result.deltas, card: battlecard(target, result.deltas, scannedAt) };
}
