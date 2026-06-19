# Launch Readiness Review — competitor.inc

> **The playbook:** Google's **Launch Readiness Review (LRR)** — the SRE practice of cross-checking
> a product against a fixed set of readiness dimensions *before* it ships, with **evidence for every
> claim** rather than vibes. Complemented by **Amazon's Working-Backwards / PR-FAQ** (are we shipping
> the *right* thing?) and **Gawande's _Checklist Manifesto_** (grep every instance; don't eyeball).
>
> This document is the filled-in review: every promise competitor.inc makes in its README, mapped to
> the code that backs it, with a verified status and a citation. Re-run it before each launch.

- **Reviewed build:** clean snapshot on `main` (`f56b216`) + the `/delegation` addition.
- **Date of review:** 2026-06-19
- **Verdict:** ✅ **GO for a simulated/offline demo launch.** Conditional items (below) are required
  before flipping on real auth/payments/model keys, but none block the offline launch the README promises.

---

## 1 · Why LRR (and not just "run the tests")

Tests prove the code does what the code says. A **Launch Readiness Review** proves the *product does
what the marketing says* — it walks the README's public promises and demands a pointer to the line of
code (or the test, or the build artifact) that makes each one true. It is the antidote to the most
common pre-launch failure: a feature that is "done" in the deck but a 404 in production.

The LRR has a small, fixed set of dimensions. We use these seven:

1. **Correctness** — does the happy path work end-to-end?
2. **Failure handling & graceful degradation** — what happens when a dependency is missing or returns garbage?
3. **Security & privacy** — secrets, SSRF, injection, log hygiene, data isolation.
4. **Capacity & cost** — does the unit economic story hold? Are there caps?
5. **Operations** — cron/heartbeat, idempotency, isolation, observability.
6. **Product truth (Working Backwards)** — does the built thing match the promise to the user?
7. **Consistency (Checklist Manifesto)** — no stray old-brand refs, no doc/code drift, every route gated.

---

## 2 · The run (empirical backbone)

The canonical gate is `npm run qa` = `tsc --noEmit && vitest run && next build && node scripts/smoke.mjs`.
Run on this build:

| Stage | Result |
| --- | --- |
| `tsc --noEmit` | ✅ exit 0 — no type errors |
| `vitest run` | ✅ **30 passed / 30** across 4 files (`provider`, `property`, `server` + fuzz) |
| `next build` | ✅ compiled; **12 routes** prerendered (incl. new `/delegation` as static `○`) |
| `scripts/smoke.mjs` | ✅ **SMOKE PASSED** — every route `200`, unknown route `404`, API shapes valid, **60 fuzz payloads → zero 5xx** |

> One non-blocking build warning: `metadataBase` is unset, so OG/Twitter images resolve against
> `http://localhost:3000`. See finding **F-4**.

---

## 3 · Cross-check matrix — every promise → its proof

Legend: ✅ verified in code · 🟡 verified with a caveat / residual risk · ⛔ gap.

### 3.1 Correctness — the happy path

| README promise | Backed by | Status |
| --- | --- | --- |
| Validation Gate runs 4 experiments → confidence % + honest verdict (`strong/weak/mixed`) | [`provider.ts` `scoreIdea()`](../lib/roomie/provider.ts) · [`types.ts:24`](../lib/roomie/types.ts) · API [`route.ts:33`](../app/api/roomie/route.ts) | ✅ |
| Build-the-winner ships an MVP with a real proof-of-work URL | [`useRoomie.ts:180`](../lib/roomie/useRoomie.ts) (`decideBuild`) | ✅ |
| Overnight shifts produce 3–5 logged actions, each with cost + proof | [`server.ts:158`](../lib/roomie/server.ts) (`runShift`) · sim [`provider.ts`](../lib/roomie/provider.ts) | ✅ |
| Named crew with scoped playbooks (Apex/Forge/Pitch/Guard/Surge) | [`types.ts:121`](../lib/roomie/types.ts) (`AGENTS`) | ✅ |
| Chat with the co-founder, streamed | [`route.ts:56`](../app/api/roomie/route.ts) + `streamText` [:76](../app/api/roomie/route.ts) | 🟡 *post-hoc* token streaming, not true model streaming (README discloses this) |
| Approval Inbox for consequential actions; Auto-refund on failed tasks | `runShift` routes spend/outreach/deploy/delete to approvals [`server.ts:164`](../lib/roomie/server.ts) · refund math [`useRoomie.ts:230`](../lib/roomie/useRoomie.ts) | ✅ |
| Autopilot / nightly heartbeat | in-app interval [`useRoomie.ts:266`](../lib/roomie/useRoomie.ts) · cron [`app/api/cron/route.ts`](../app/api/cron/route.ts) | ✅ |
| Public `/live` board · `/how-it-works` | routes present, smoke `200` | ✅ |

### 3.2 Failure handling & graceful degradation

| Promise | Backed by | Status |
| --- | --- | --- |
| Runs fully offline with no keys (simulated engine + localStorage) | `callEngine` falls back to local provider [`useRoomie.ts:74`](../lib/roomie/useRoomie.ts) · `modelAvailable` gate [`server.ts:69`](../lib/roomie/server.ts) | ✅ |
| Real model failure degrades to simulated (never 5xx to the user) | try/catch → sim in `runValidate`/`runChat`/`runShift` [`server.ts:111,130,191`](../lib/roomie/server.ts) | ✅ |
| Corrupted localStorage doesn't wedge the UI | guarded `load()` [`useRoomie.ts:21`](../lib/roomie/useRoomie.ts) | ✅ |
| Malformed API 200 doesn't corrupt state | array/shape guards [`useRoomie.ts:143,226`](../lib/roomie/useRoomie.ts) | ✅ |
| No overlapping autopilot shifts | `inFlightRef` mutex [`useRoomie.ts:88,212`](../lib/roomie/useRoomie.ts) | ✅ |
| API never 5xx on garbage input | fuzz: 60 payloads, zero 5xx ([`smoke.mjs:70`](../scripts/smoke.mjs)) | ✅ |

### 3.3 Security & privacy

| Promise | Backed by | Status |
| --- | --- | --- |
| API key is server-only, never reaches the client | `import "server-only"` + key read in module [`server.ts:1,14`](../lib/roomie/server.ts) | ✅ |
| BYOK key sent per-request, never persisted server-side | forwarded in body, used transiently [`server.ts:75`](../lib/roomie/server.ts); no write path | ✅ |
| SSRF guard on user-supplied BYOK base URL | `assertSafeBaseUrl` [`server.ts:41`](../lib/roomie/server.ts) — https-only; blocks loopback, `10/8`, `127/8`, `0.0.0.0`, `169.254`, `172.16–31`, `192.168`, `::1`, `fc/fd/fe80`, `localhost`, GCP metadata host | 🟡 covers **literal IPs + known hostnames**; a DNS name that *resolves* to a private IP is not re-checked (DNS-rebinding residual risk). See **F-3** |
| Logs scrub secrets (message only, never raw error/body) | [`route.ts:68`](../app/api/roomie/route.ts) | ✅ |
| Input validation rejects malformed bodies with 400 | [`route.ts:28–66`](../app/api/roomie/route.ts) | ✅ |
| Per-user data isolation (RLS) | [`supabase/migrations/0001_init.sql:55–81`](../supabase/migrations/0001_init.sql) — RLS enabled on companies/activities/approvals, all keyed to `auth.uid()` | ✅ |
| Own your data / one-click export | export action in dashboard settings | ✅ |
| 3D office uses no third-party assets (license-clean to sell) | [`DelegationScene.tsx`](../app/delegation/DelegationScene.tsx) — procedural three.js geometry only, **no `.glb`** | ✅ |

### 3.4 Capacity & cost (the unit-economic story)

| Promise | Backed by | Status |
| --- | --- | --- |
| Marginal inference cost ~$0 (BYOK / sim default) | default = simulated; BYOK = user's bill [`server.ts:73`](../lib/roomie/server.ts) | ✅ |
| Free-tier caps keep our cost bounded | `FREE_CAPS {validate:3, shift:12}`/day; BYOK uncapped [`usage.ts:10,40`](../lib/roomie/usage.ts) | ✅ |

### 3.5 Operations

| Promise | Backed by | Status |
| --- | --- | --- |
| Nightly cron wired | [`vercel.json`](../vercel.json) `0 7 * * *` → `/api/cron` | ✅ |
| Cron authenticated | `CRON_SECRET` bearer check [`app/api/cron/route.ts:11`](../app/api/cron/route.ts) | ✅ |
| Per-company isolation (one bad row ≠ whole run fails) | per-row try/catch in the cron loop | ✅ |
| Idle (not crash) when Supabase unset | early return with note [`app/api/cron/route.ts:21`](../app/api/cron/route.ts) | ✅ |
| Collision-safe IDs | `crypto.randomUUID()` everywhere ([`useRoomie.ts:61`](../lib/roomie/useRoomie.ts), [`server.ts:22`](../lib/roomie/server.ts)) | ✅ |

### 3.6 Product truth (Working Backwards)

The PR-FAQ test: would the README's headline survive a skeptical customer clicking through? Yes —
"validate before you build," "Glass Box," and "human-in-the-loop" each map to a *reachable surface*
(`/dashboard`, the activity log, the Approval Inbox) and now to a literal, watchable office at
[`/delegation`](../app/delegation/page.tsx) where the crew converges and acts when a shift runs. ✅

### 3.7 Consistency (Checklist Manifesto)

| Check | Status |
| --- | --- |
| Every route returns 200 in the smoke sweep (incl. new `/delegation`, added this review) | ✅ [`smoke.mjs:52`](../scripts/smoke.mjs) |
| Brand string present on landing | ✅ |
| No stray old working-title brand in user-facing copy | ✅ (UI says competitor.inc) |
| `package.json` identity matches the rebrand | ⛔ still `"name": "roomiebot"`, `"version": "0.1.0"` — see **F-1** |
| `.env.example` keys all consumed by code | 🟡 `AI_GATEWAY_API_KEY`, `ROOMIE_PRIVATE_BASE_URL` listed but unreferenced — see **F-2** |

---

## 4 · Findings (honest gaps & residual risks)

None block the offline demo launch. Listed worst-first.

- **F-1 · Rebrand drift in `package.json`** — `name: "roomiebot"`, `version: "0.1.0"` despite the README
  claiming a completed rebrand at v0.3.0. Cosmetic, but it's the kind of thing the Checklist Manifesto
  exists to catch. *Fix:* rename to `competitor-inc`, bump version. ([package.json](../package.json))
- **F-2 · Doc/code drift in `.env.example`** — advertises `AI_GATEWAY_API_KEY` and
  `ROOMIE_PRIVATE_BASE_URL`, which no module reads. Either wire them or drop them so deployers aren't
  misled. ([.env.example](../.env.example))
- **F-3 · SSRF guard is literal-IP only** — `assertSafeBaseUrl` blocks private *literals* and known
  metadata *hostnames*, but does not resolve DNS names, so a hostname pointing at a private IP slips
  through (classic DNS-rebinding gap). Acceptable while BYOK base URLs are rare/trusted; before
  promoting BYOK broadly, resolve the host and re-check the resolved address (and/or pin an allowlist).
  ([server.ts:41](../lib/roomie/server.ts))
- **F-4 · `metadataBase` unset** — OG/Twitter preview images resolve to `localhost` in the build. Set
  `metadataBase` in [`app/layout.tsx`](../app/layout.tsx) to the production origin before the public drop.
- **F-5 · Chat is post-hoc streaming** — the reply is resolved, then streamed token-by-token. Already
  disclosed in the README roadmap; flagged here for completeness. ([route.ts:76](../app/api/roomie/route.ts))

---

## 5 · Go / No-Go

| Scenario | Decision |
| --- | --- |
| Ship the **offline/simulated demo** (no keys) | ✅ **GO** — QA green, all routes live, degrades safely. |
| Flip on **real auth + payments** | 🟡 **GO after** F-1, F-4 and a manual run of the Supabase RLS policies against a second user. |
| Promote **BYOK** to all users | 🟡 **GO after** F-3 (resolve-and-recheck the base-URL host). |

---

## 6 · Reusable checklist (run before each launch)

```
[ ] npm run qa ends in "SMOKE PASSED ✓"   (tsc ✓ · vitest ✓ · build ✓ · smoke ✓)
[ ] Every new route added to scripts/smoke.mjs route sweep
[ ] grep the repo for the old working title — zero user-facing hits
[ ] package.json name/version match the current brand + release
[ ] Every key in .env.example is read by code (or removed)
[ ] metadataBase set to the production origin
[ ] Secrets server-only; logs carry messages, never raw bodies/errors
[ ] SSRF guard re-checks resolved IPs if BYOK base URLs are user-facing
[ ] Supabase RLS verified with a second account (cross-tenant read = denied)
[ ] Cron authenticated (CRON_SECRET) and isolated per company
[ ] Working-Backwards check: every headline promise maps to a reachable surface
```

---

*Reviewed with the Launch Readiness Review playbook. Prove it before you ship it.*
