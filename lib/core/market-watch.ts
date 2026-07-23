// lib/core/market-watch.ts — COMPETITOR AND MARKET WATCH (ADR-0024, the last "planned" tile earns real code).
//
// Scan named competitor sites, diff what changed (pricing / features / positioning), keep a sell-against
// battlecard current. Built compliance-first per the 2026-07-23 legal audit:
//   · PUBLIC marketing pages only, robots.txt respected (a disallow is honored, out loud) ·
//   · a DISCLOSED user-agent, never a disguise · low cadence (the loop's heartbeat, not a crawler) ·
//   · quotes in the battlecard are the competitor's own public words, dated — analysis is labeled ours ·
// $0 by design: plain fetch, deterministic normalize/diff (no model needed to WATCH; the org-run uses
// cognition only to argue strategy). Injectable fetch ⇒ everything tests offline.

export const WATCH_USER_AGENT =
  "competitor-inc-market-watch/1.0 (disclosed bot; public marketing pages only; contact via site)";

export interface WatchDelta {
  kind: "pricing" | "features" | "positioning" | "other";
  change: "added" | "removed";
  line: string;
}

export type ScanResult =
  | { ok: true; snapshot: string; deltas: WatchDelta[]; firstScan: boolean }
  | { ok: false; error: string };

// ── normalize: html → stable, diffable text lines ─────────────────────────────
export function normalizeHtml(html: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withBreaks = noScripts.replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  const text = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 3);
  // dedupe consecutive repeats (nav/footer echoes) while preserving order
  return lines.filter((l, i) => l !== lines[i - 1]).join("\n");
}

// ── robots.txt: a disallow is honored, and we say so ─────────────────────────
/** Minimal, conservative robots gate for the `*` agent. 404 ⇒ allowed (the web's convention);
 *  any other failure ⇒ NOT allowed (we don't crawl what we can't verify). */
export async function robotsAllows(
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ allowed: boolean; reason: string }> {
  const u = new URL(targetUrl);
  try {
    const res = await fetchImpl(`${u.origin}/robots.txt`, { headers: { "user-agent": WATCH_USER_AGENT } });
    if (res.status === 404) return { allowed: true, reason: "no robots.txt — open by convention" };
    if (!res.ok) return { allowed: false, reason: `robots.txt → HTTP ${res.status}; we don't crawl what we can't verify` };
    const body = await res.text();
    // Collect Disallow rules that apply to * (block-scoped: rules under the most recent User-agent lines).
    let appliesToAll = false;
    const disallows: string[] = [];
    for (const raw of body.split("\n")) {
      const line = raw.replace(/#.*$/, "").trim();
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (/^user-agent$/i.test(key)) appliesToAll = value === "*";
      else if (/^disallow$/i.test(key) && appliesToAll && value) disallows.push(value);
    }
    const path = u.pathname || "/";
    const hit = disallows.find((d) => path.startsWith(d));
    return hit
      ? { allowed: false, reason: `robots.txt disallows ${hit} — honored, we never crawl around a no` }
      : { allowed: true, reason: "allowed by robots.txt" };
  } catch {
    return { allowed: false, reason: "robots.txt unreachable — we don't crawl what we can't verify" };
  }
}

// ── diff + classify: what changed, in whose words ────────────────────────────
const PRICING = /\$\s?\d|\/\s?(mo|month|yr|year|seat|user)\b|pricing|price|plan\b|tier\b|free trial/i;
const FEATURES = /feature|launch|new\b|introduc|now available|beta\b|integrat|api\b|agent|automat/i;

export function diffSnapshots(prev: string, next: string): WatchDelta[] {
  const prevLines = new Set(prev.split("\n").filter(Boolean));
  const nextLines = new Set(next.split("\n").filter(Boolean));
  const classify = (line: string): WatchDelta["kind"] =>
    PRICING.test(line) ? "pricing" : FEATURES.test(line) ? "features" : line.length <= 90 ? "positioning" : "other";
  const deltas: WatchDelta[] = [];
  for (const l of nextLines) if (!prevLines.has(l)) deltas.push({ kind: classify(l), change: "added", line: l });
  for (const l of prevLines) if (!nextLines.has(l)) deltas.push({ kind: classify(l), change: "removed", line: l });
  // pricing first (the most sales-urgent), then features, positioning, other — stable within groups
  const order: WatchDelta["kind"][] = ["pricing", "features", "positioning", "other"];
  return deltas.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

// ── the scan: robots → fetch → normalize → diff ──────────────────────────────
export async function scanTarget(
  target: { name: string; url: string },
  prevSnapshot: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ScanResult> {
  const robots = await robotsAllows(target.url, fetchImpl);
  if (!robots.allowed) return { ok: false, error: `${target.name}: ${robots.reason}` };
  try {
    const res = await fetchImpl(target.url, { headers: { "user-agent": WATCH_USER_AGENT, accept: "text/html" } });
    if (!res.ok) return { ok: false, error: `${target.name}: HTTP ${res.status} on ${target.url}` };
    const snapshot = normalizeHtml(await res.text());
    if (!snapshot) return { ok: false, error: `${target.name}: page yielded no readable text` };
    if (!prevSnapshot) return { ok: true, snapshot, deltas: [], firstScan: true }; // baseline — diffs start next scan
    return { ok: true, snapshot, deltas: diffSnapshots(prevSnapshot, snapshot), firstScan: false };
  } catch (e) {
    return { ok: false, error: `${target.name}: network — ${e instanceof Error ? e.message : "unknown"}` };
  }
}

// ── the battlecard: their words dated + our verified counters, clearly split ──
const OUR_COUNTERS = [
  "Every claim we make ships with a verifiable receipt — ask their sales team for theirs.",
  "Governance is structural here: kill switch, T0–T3 policy tiers, append-only audit ledger on every action.",
  "BYOK custody: the customer owns accounts, code, data, and revenue — we can be fired by revoking keys.",
  "The human floor is engineered, not promised: money out, contracts, and consent stay human, always.",
];

export function battlecard(
  target: { name: string; url: string },
  deltas: WatchDelta[],
  scannedAtIso: string,
): string {
  const byKind = (k: WatchDelta["kind"]) => deltas.filter((d) => d.kind === k);
  const section = (title: string, items: WatchDelta[]) =>
    items.length
      ? `## ${title}\n${items.map((d) => `- (${d.change}) "${d.line}"`).join("\n")}\n`
      : "";
  return [
    `# Sell-against: ${target.name}`,
    `Source: their public page ${target.url}, scanned ${scannedAtIso}. Quoted lines are THEIR words on that date; everything under "How we counter" is ours.`,
    "",
    deltas.length ? "" : "_No changes since the last scan — the card below stands._",
    section("Pricing changes", byKind("pricing")),
    section("Feature changes", byKind("features")),
    section("Positioning changes", byKind("positioning")),
    "## How we counter (verified, ours)",
    ...OUR_COUNTERS.map((c) => `- ${c}`),
    "",
    "_Honesty note: this card quotes public marketing pages, robots.txt respected, disclosed user-agent. No login-walled or personal data, ever._",
  ].filter((s) => s !== "").join("\n");
}
