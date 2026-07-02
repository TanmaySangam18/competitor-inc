# Consolidation Audit — full-codebase sweep (2026-07-02)

**Method:** four parallel audit passes (lib/engine · API+data layer · frontend · docs-vs-reality),
every finding verified with file:line evidence and usage greps before inclusion; coordinator
re-verified the top claims independently. **Playbooks:** the Founder Operating System recurring
audit (KEEP/MERGE/REWRITE/SIMPLIFY/REMOVE) + Fowler's *Refactoring* rule of three (extract on the
third duplicate) + the standing ship-with-backend-deps rule.

**Honest scope note:** the docs pass was time-boxed — ~40 of 67 docs fully read; `docs/launch/*`,
some `PLAN-*`/`PLAYBOOK-*`, and per-route error-shape nuances in engine/execute/cron internals were
not exhaustively swept. Everything below WAS verified.

**Overall verdict:** unusually healthy for a solo-founder codebase moving this fast. The load-bearing
seams are singular (one rate limiter, one model-call hub, one funnel reader, one policy engine; growth
composes gtm instead of copying it; zero orphan components; zero unreachable pages; zero orphan DB
tables; ROOMIE→MODEL rename fully landed in code). The debt concentrates in exactly two places:
**provider-migration seams** (LemonSqueezy→Polar left a second billing writer, wrong legal copy, and
a drifted setup-MCP) and **micro-duplicates at the edges** (15–17 Supabase client copies, 4 clipboard
implementations, 3 HTML escapers, 3 timeout wrappers, 3 slug functions).

---

## CRITICAL

### C1 — Terms page names the wrong merchant of record
- **Files:** `app/terms/page.tsx:61` ("Paid plans are processed by **LemonSqueezy**, our merchant of
  record"); reality = Polar (`app/api/billing/polar/route.ts`, `lib/engine/billing.ts:58`,
  `POLAR_WEBHOOK_SECRET` + Polar checkout URL live in prod).
- **Why:** user-facing *legal* copy misstating the payment processor — direct hit on the MA 93A
  honest-claims posture and the honesty brand. `docs/AUTONOMY-AUDIT.md:129` even counts this line as
  a compliance win — update both.
- **Fix:** name Polar in terms; correct AUTONOMY-AUDIT. **Impact:** honest disclosure to paying users.

### C2 — "Add your keys →" deep link lands on the wrong Settings section
- **Files:** `app/dashboard/page.tsx:744` links `/dashboard/settings#connect-accounts`;
  `app/dashboard/settings/page.tsx:39` hard-codes `useState<Section>("brand")` and nothing reads
  `window.location.hash` — `id="connect-accounts"` (line 339) isn't in the DOM on arrival. Same
  class of miss: `components/EntitlementNotice.tsx:31` (intends billing, lands on brand).
- **Why:** this CTA fires at the exact moment a founder is unblocking a live build — the
  key-connection funnel silently dumps them on Brand Voice.
- **Fix:** a small `useEffect` mapping URL hash → section (+scroll). **Impact:** restores the most
  conversion-critical deep link.

## HIGH

### H1 — Service-role Supabase client hand-rolled 17× across 14 route files (+ `/t/[slug]`)
- **Files:** waitlist(×2), interest(×2), track, metrics, proof, feedback, growth, demand, engine,
  billing/webhook, billing/polar, telegram/webhook, telegram/decisions, cron, `app/t/[slug]/page.tsx:24`.
- **Evidence:** 17 `createClient(url, key, { auth: { persistSession: false } })` sites; already
  drifting — `/t/[slug]` alone falls back to the ANON key (silently downgrading to RLS) while every
  API route fail-softs to null. `app/api/track/route.ts:22-27` has the right local helper shape.
- **Fix:** promote track's helper to `lib/engine/service.ts` (`serviceClient(): SupabaseClient|null`),
  migrate all sites. **Impact:** −~60 lines; one env-read path; kills real behavioral drift.

### H2 — Two live-wired billing writers to the same `entitlements` table
- **Files:** legacy `app/api/billing/webhook/route.ts` (LemonSqueezy HMAC; 503s without its secret;
  only smoke-test pokes it) + `lib/engine/entitlement.ts:26-56` (`entitlementFromEvent`), alongside
  canonical `app/api/billing/polar/route.ts` + `lib/engine/polar.ts`.
- **Fix:** delete the LS route + `entitlementFromEvent` (keep shared `isEntitled`/`entitlementNotice`)
  once founder confirms LS is fully dead. **Impact:** one billing path, one writer to the money table.

### H3 — Setup-MCP constants drifted from the app's real env surface
- **Files:** `~/competitor-inc-setup-mcp-server/src/constants.ts:13-69`.
- **Evidence:** `REQUIRED_ENV_VARS` demands `LEMONSQUEEZY_WEBHOOK_SECRET` (dead) and omits
  `POLAR_WEBHOOK_SECRET` + `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (17 call sites
  depend on them); the same `NEXT_PUBLIC_CHECKOUT_URL` var is labeled "LemonSqueezy" at line 17 and
  "Polar" at line 35; `MIGRATION_INTEREST` is a verbatim second copy of `0005_interest.sql`.
- **Why:** this MCP provisions the founder's prod env — it actively steers setup toward the dead provider.
- **Fix:** canonical = what the app reads. Sync the lists, fix labels, reference the repo migration
  file instead of embedding a copy. **Impact:** the setup tool provisions the env the app needs.

### H4 — Duplicate migration prefix `0005` (verified: both files exist)
- **Files:** `supabase/migrations/0005_agent_memory.sql` **and** `0005_interest.sql`.
- **Why:** Supabase keys migrations on the version prefix — a skip/repair landmine that will fire
  exactly during the pending 0009–0012 prod run.
- **Fix:** renumber `0005_interest.sql` → `0013_interest.sql` (+ update the MCP copy per H3).

### H5 — Dashboard monolith: 1,351 lines, 17 components, duplicating money-math internally
- **Files:** `app/dashboard/page.tsx` — net-spend formula duplicated at lines 572 and 1061 (a number
  shown to users, computed in two places); identical stat-card markup at 663-668 and 1092-1097;
  ApprovalCard re-implements clipboard already componentized in PixelSnippet.
- **Fix:** extract `ChatTab`, `OperateTab`, `ApprovalCard`, `ActivityRow`, `Onboarding`, `BarChart`
  to components/ (all self-contained); lift `netSpend(c)` into lib/engine; a tiny `<Stat>` component.
  **Impact:** file → ~500 lines; ends two-place drift on a user-visible money number.

### H6 — Steering docs that actively mislead (each verified against code)
- `docs/MASTER-PLAN.md:489` — billing gate still says LemonSqueezy (billing is live on Polar).
- `docs/ROADMAP.md` §A — instructs LemonSqueezy env setup (`NEXT_PUBLIC_CHECKOUT_URL` now holds Polar).
- `docs/GO-LIVE.md:192-193` — says run migrations **0001→0005 only**; 13 files exist. Following it
  ships prod without entitlements, approvals, RLS tightening, and the revenue loop. Line 212 also
  says "LemonSqueezy/Gumroad".
- `docs/TAKE-OWNERSHIP.md:44-46` — tells founder to set `ROOMIE_*` env vars; code reads zero of them
  (`MODEL_*` only). Following it leaves the app silently simulated.
- `README.md:288` — "Founding $99 once" tier that was killed; live pricing = $39 Operator / $299
  Founder / $499 Sprint (`app/page.tsx:622-692`).
- **Fix:** apply the `docs/BUILD-IN-PUBLIC.md` pattern — explicit SUPERSEDED banner naming the
  replacement (NEXT-BLOCKS / launch/runbook / FEATURE-LEDGER) — plus correct README pricing.

### H7 — Stripe payments path: split-brain money flow + an over-promise
- **Files:** `lib/engine/execution.ts:51,199-222` (env-gated Stripe payment-link creation, dispatched
  at `execution.ts:400`); `app/dashboard/settings/page.tsx:308,332` Payments card ("Stripe payment
  links… Hosted plans turn this on for you").
- **Evidence:** internally consistent code (not stale branding), BUT: Stripe merchant is on hold (F1),
  the card is operator-level only (no `self: true`), and if the env vars were ever set it would create
  Stripe links while entitlements only listen to Polar — a split-brain revenue path.
- **Fix:** re-point the `payments` action at Polar checkout links (or delete it), and soften the
  tooltip until a merchant path exists. **Impact:** keeps the one over-promising card honest.

## MEDIUM

- **M1 Clipboard ×4** — `dashboard:1305`, `join:111`, `DemandTestPanel:75`, `PixelSnippet:15`; the
  dashboard copy lacks the `?.` guard the other three have (throws on insecure contexts). Fix: one
  `useCopy()` hook (keep the guarded variant).
- **M2 HTML escapers ×3** — `execution.ts:34` (escapes quotes) vs `notify.ts:135` + `alerts.ts:13`
  (don't); notify's output feeds Telegram HTML with attacker-influenced approval titles. Fix: export
  the 5-char version as canonical.
- **M3 Fetch-timeout wrappers ×3** — `execution.ts:24` (8s), `server.ts:60` (30s), plus an inline
  third in `execution.ts:71-76` that ignores the wrapper 45 lines above it. Fix: one in `lib/engine/net.ts`.
- **M4 Slug logic ×3 + regex ×4** — `provider.ts:53` vs `execution.ts:38` vs `demand/route.ts:21`
  (same name, different semantics) and `/^[a-z0-9-]{2,80}$/` pasted in track(×2)/growth/demand. Slug
  is the attribution key joining events/demand_signups/revenue_events — drift can orphan revenue
  attribution. Fix: `lib/engine/slug.ts` (`companySlug`, `sanitizeSlug`, `SLUG_RE`).
- **M5 `checkEntitled` vs `getEntitlement`** — `billing.ts:27-38` vs `41-57`; identical query, the
  latter a strict superset; one consumer each. Fix: keep `getEntitlement`, make `checkEntitled` a
  one-liner over it.
- **M6 Dead / test-only exports (all grep-verified)** — whole modules `lib/engine/seats.ts` and
  `lib/engine/outreach.ts` (production callers: zero; consistent with "Lead Desk ON HOLD" but shipped
  weight); `GTM_SOURCES` (gtm.ts:146, zero refs anywhere — delete); `realExecutionEnabled`
  (execution.ts:59), `customerNotifyLive` (notify.ts:41), `RATE_LIMIT` (ratelimit.ts:40) — test-only.
  Fix: delete GTM_SOURCES now; decide seats/outreach deliberately (KEEP-dormant with a banner, or cut).
- **M7 `/api/import/verify` unwired** — session-gated ownership verification with zero UI callers
  (ImportPanel only posts `/api/import`); smoke-test only. Wire the "verify ownership" step or remove
  until the v2 private-until-paid gate lands.
- **M8 Right-to-delete comment overclaims** — `app/api/enrich/route.ts:27-31` claims it "records a
  suppression so we never enrich them again"; no suppression write exists (client-side flag only), and
  the `.from("enrichment")` purge targets a table no migration creates (intentional fail-soft no-op —
  verified — but the comment says more than the code does, on a compliance path). Fix: correct the
  comment now; add `privacy_prefs` (migration 0014) when enrichment persistence lands.
- **M9 Doc contradictions** — stale Polsia figures in 4+ docs vs canonical `docs/intel/polsia-deep-dive.md`
  ($8.52M declining / ~51% recurring / ~4% active / $31M raised — NOT bootstrapped); pricing fork
  ("$99 once") across PLAYBOOK*/PLAN-beachhead/GROWTH-MODEL/HANDOFF vs canonical PATH-TO-10K; north-star
  fork (REVENUE-RUN: PPU vs NEXT-BLOCKS: 10k signups vs MASTER-CHECKLIST: 2k waitlist) — founder picks
  one; FEATURE-INVENTORY claims auth/billing//live are missing (all built — FEATURE-LEDGER is canonical);
  HANDOFF points at the friend's stale deployment. Fix: SUPERSEDED banners + refresh `docs/README.md`
  index with a canonical-vs-historical split (it lists ~15 of 67 docs and omits every canonical one).

## LOW

- **L1** `ROOMIE = "competitor.inc (roomie)"` is user-visible bot branding (`campaign.ts:8`,
  CampaignPanel); localStorage namespace is `"cofounder:*"` — the *rival's* name (rename only with a
  deliberate migration); `StorageMigrator`/`storage.ts` migration has served its purpose — sunset window.
- **L2** Operate tab: `NEXT_PUBLIC_OPERATE !== "0"` = ON by default (dashboard:92) while
  `launch/runbook.md:47` + TAKE-OWNERSHIP say set `0` for lean launch — a deploy-time env decision,
  not dead code.
- **L3** `app/join/page.tsx:10` comment still says "(LemonSqueezy)" for the founder checkout var.

## Negative findings (verified clean — record so nobody re-audits)
Zero unused components (all 27 have importers) · zero unreachable pages (every route has an inbound
link; `/house` hidden entry works exactly as designed via `SecretHouseDoor.tsx` triple-click) · zero
orphan DB tables (all 16 migrated tables touched by code) · zero `ROOMIE_*` env reads · model calls
centralized in `server.ts` only · one shared rate limiter across 13 routes · growth/gtm/funnel are
composed, not duplicated · `/api/interest` looks orphaned in TS greps but is called by the static
`public/lockin/index.html` — do not delete.

## Suggested fix order (one cleanup PR each)
1. **Honesty PR (30 min):** C1 terms→Polar, C2 hash-routing effect, L3 comment, H7 tooltip soften.
2. **Billing-seam PR:** H2 delete LS route/normalizer, H4 renumber 0005_interest→0013, H3 sync MCP
   constants, M8 fix enrich comment.
3. **Dedup PR:** H1 serviceClient(), M1 useCopy(), M2 escapeHtml, M3 fetchWithTimeout, M4 slug.ts,
   M5 entitlement read, M6 deletions.
4. **Monolith PR:** H5 extractions (mechanical, no behavior change).
5. **Docs pass:** H6 + M9 SUPERSEDED banners + README pricing + docs/README canonical index.
