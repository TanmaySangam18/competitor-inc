# ADR-0024 — Market watch: scan, diff, battlecard — compliance-first

**Date:** 2026-07-23 · **Status:** accepted · **Origin:** the last "planned" service tile (founder: "yes, make it 7/7 — honestly")

## Context

"Competitor and market watch" sat `planned` with zero code behind it — the catalog's honesty rule kept
it that way. The same day's legal audit set the design constraints: public-data scraping is defensible
(post-*hiQ*), but ToS/robots and disguised crawling are where the risk lives — so the machinery had to
be compliance-first, not compliance-later. (This also supersedes ADR-0022's note that the
competitor-watch playbook "stays out until it ships" — it ships here.)

## Decision

- `lib/core/market-watch.ts` — the pure core, $0 and offline-testable: `normalizeHtml` (stable text
  lines), `robotsAllows` (a `Disallow` is **honored out loud**; unreachable robots ⇒ we don't crawl
  what we can't verify; 404 ⇒ open by convention), `diffSnapshots` (added/removed lines classified
  pricing → features → positioning), `scanTarget` (robots → fetch with the **disclosed user-agent** →
  normalize → diff; first scan = baseline), `battlecard` (their words **quoted and dated**, our
  counters **labeled ours**, compliance note in the card itself).
- `supabase/migrations/0035_market_watch.sql` — one row per (user, url): latest snapshot + deltas.
  Owner-scoped RLS; the scan path writes via the service role.
- `lib/engine/market-watch-db.ts` — `runWatchScan`: governed as `mcp_read` (kill switch first), every
  URL through the shared SSRF wall (`assertSafeBaseUrl`), then the robots-gated scan, persist, card.
- `app/api/market-watch/route.ts` — GET targets+cards (RLS); POST scan-now, ≤5 targets, sequential —
  "a watch, not a crawler."
- The `competitor-watch` **playbook** (weekly cadence) is now IN the library; the loop's heartbeat is
  the schedule. The service tile flips to `ready`.

## Consequences

- The catalog reads 7/7 `ready` — and every tile is still telling the truth.
- Firecrawl (per the sales-stack verdict) remains an optional upgrade for JS-heavy sites; plain fetch
  is the keyless default. No connection-map entry until that upgrade lands.
- The rails live in code and in the card: no login-walled pages, no personal data, no disguised UA,
  no crawling around a robots `no`. Loosening any of these is a founder-level decision.
