# ADR-0009 · Site simplification (the legacy page layer dies) + the monochrome ink ripple

Date: 2026-07-18 · Status: accepted

## Context

Founder directive (2026-07-18): remove all unnecessary pages/sections/features — minimal + intuitive,
streamline every page — and add a subtle, modern splash effect at the interaction point on every
tap/click, with zero performance or accessibility cost.

ADR-0008 rebuilt the marketing layer around a small keeper set: `/` (Viktor-flow landing), `/org` +
`/org/[id]`, `/live`, `/connect`, `/services`, `/benchmark`, `/notices` — plus the app surfaces
(`/dashboard`, `/decisions`, `/login`, `/signup`, `/join`, `/house`, `/maintenance`, auth/api). Around
those keepers sat a legacy layer of Ledger-era (ADR-0006-and-earlier) marketing pages, three competing
header/footer systems (SiteHeader/SiteFooter · LedgerShell · bespoke per-page), and a sitemap full of
routes nothing linked to. The test applied to every non-keeper page: **"does a keeper page already
answer this page's question?"** If yes — kill it and redirect permanently to that keeper.

## Decision — pages killed + their redirects

Every kill is a permanent (308) redirect in `next.config.ts`; no 404 is left behind. Deleted page
files AND their now-orphaned components/libs were removed (`scripts/audit-inventory.mjs` → 0
unreachable, 0 unresolved imports).

| Killed page | Redirect | Why (keeper that answers it) |
|---|---|---|
| `/build` | → `/` | Legacy ex-homepage "prove it" demo (MACHINA era); orphaned — only inbound was the `/demo` alias. The landing + `/benchmark` carry the promise now; `/api/engine` (its backend) is untouched. |
| `/demo` | → `/` | Was an alias for `/build`; follows it home. |
| `/blog`, `/blog/[slug]` | → `/` | Ledger-era SEO essays; nothing linked them except the dying LedgerFooter. The landing tells the story. |
| `/compare` | → `/` | Ledger-era vs-Polsia scorecard; the landing's "honest comparison" section answers it (category framing, no name-bashing). |
| `/founder` | → `/` | Complete orphan (zero inbound links, not in sitemap/smoke); the landing + `/org` state the one-human governance. |
| `/how-it-works` | → `/#how` | The landing's 3-step section + FAQ covers it (anchor `id="how"` added to the landing). |
| `/integrations` | → `/connect` | Env-status "rails" page; `/connect` IS the connection map with live status — a strict superset. |
| `/nu` | → `/` | Northeastern campaign landing; the GTM beachhead moved to agencies ([[gtm-beachhead-agencies]]) — stale campaign, dead QR target folds home. |
| `/playbooks`, `/playbooks/[slug]` | → `/` | Ledger-era SEO content + "$3 coming soon" placeholder paywall; no keeper depends on it. `lib/engine/playbooks.ts` deleted with it. |
| `/proof` | → `/benchmark` | Static "Proof Standard" manifesto vs the live evidence engine; the nav already labeled `/benchmark` as "Proof". Copy loses to computation. |
| `/radar` | → `/score` | Both are idea→demand tools. `/score` kept per directive; radar's **cited-evidence read survives**: `DemandRadarPanel` (live HN/StackExchange/GitHub crawl, every signal a clickable source link) is folded into `/score` below the scorecard — the fold was trivial (the panel is self-contained and already embedded by dashboard onboarding + import). |
| `/sell` | → `/` | Complete orphan viral tool ("Sell This"); zero inbound links. |

**Kept (judgment calls, with reasons):** `/decisions` (functional Executive Inbox, embedded by the
coworker desktop app via a special CSP — an app surface, not marketing) · `/signup` (core auth, ~9
inbound links) · `/t/[slug]` (live demand-test campaign engine driven from the dashboard; honest 404
when a test doesn't exist) · `/score` (directive keeper; now also the radar's home) · `/privacy` +
`/terms` (legal, referenced from signup/consent copy) · `/join` (keeper; pricing/waitlist) ·
`/lockin` (static shipped app, rewrites untouched).

Deleted orphans: `components/{ScrollProgress,SecretHouseDoor,JourneyExplorer,NuCapture,SellThis,FounderSection}.tsx`,
`lib/engine/playbooks.ts`, `lib/founder.ts`, `app/blog/posts.ts`, `app/integrations/GateProbe.tsx`,
`app/sell/opengraph-image.tsx`. Note: `SecretHouseDoor` (the triple-click `/house` door) had already
fallen off the landing in ADR-0008 — its last carrier was `/build`. `/house` remains directly
reachable by URL (allow-list + localhost-only unlock unchanged).

## Decision — one chrome everywhere

`SiteHeader` (Home wordmark · Workforce · Live in Slack · Proof · Connect · Services · Sign in) +
`SiteFooter` are now the ONLY public chrome. Converted from bespoke/Ledger chrome: `/connect`,
`/benchmark`, `/services` (also un-frozen from its fixed-viewport shell so the footer fits),
`/notices`, `/join`, `/privacy`, `/terms`, `/score` (bespoke sticky header removed from `Scorecard`).
`LedgerShell` survives ONLY for `/decisions` (embedded app surface); its footer was pruned to live
routes (Home · Dashboard · Terms · Privacy). Sections trimmed in keepers: the landing's receipts grid
now shows 3 of the drills as a teaser (the full set runs live on `/benchmark`, which the section links
to). Sitemap rewritten to the keeper surface (incl. the 56 `/org/[id]` pages + `/score`).

## Decision — the ink ripple (`components/InkRipple.tsx`)

One document-level **passive** `pointerdown` listener, mounted once in `app/layout.tsx` (marketing AND
app surfaces — one consistent feel). On press it spawns a fixed-position span at the exact pointer
coords; a CSS animation (globals.css) scales it 0 → 180px while fading 0.18 → 0 over 450ms; the node
is removed on `animationend`; at most 6 concurrent ripples (oldest dropped first).

- **Monochrome by contract:** fill is `var(--ripple-ink, rgba(10,10,10,0.14))` — ONE variable to
  re-skin later; the default is the ink. No other color source (standing founder rule: no color).
- **Zero a11y/perf cost:** layer + spans are `aria-hidden` + `pointer-events:none`; animation uses
  transform/opacity ONLY (compositor work — no layout, no reflow, no scroll jank) with
  `will-change: transform, opacity`; no effect on focus or hit-testing; zero third-party deps.
- **Reduced motion:** the handler checks `matchMedia("(prefers-reduced-motion: reduce)")` live on
  every press and bails BEFORE creating a node; the global reduced-motion CSS rule is the second
  line of defense.
- **Pointer-only by design:** keyboard activation already has a visible focus ring; synthetic
  centered ripples on Enter/Space would add noise, not feedback. Decided against.
- `e.isTrusted` guard: synthetic events never ripple.

## Consequences

- 24 files deleted, ~14 redirects added; inventory: 511 → 487 source files, 0 unreachable.
- `scripts/smoke.mjs` now asserts every killed path 308s to its exact keeper (manual-redirect
  assertion — a redirect can never silently rot into a 404 or a wrong 200).
- The pre-launch SEO bet (playbooks/blog) is consciously abandoned in favor of the minimal keeper
  surface; the git history keeps the content if a future content motion wants it back.
- `/score` is orphan-by-design (shareable tool + `/radar` redirect target); it is in the sitemap.
