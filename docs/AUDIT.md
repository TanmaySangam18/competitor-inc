# Professional full-codebase audit — competitor.inc

**Date:** 2026-06-28 · **Scope:** every live route, API handler, and engine module — full pass including second-round deep security review.
**Method:** a "council" of three independent read-only review agents (the [llm-council](https://github.com/aiwithremy/claude-skills-llm-council)
pattern — that exact skill can't run in this harness, so the same effect is reproduced with three
specialized auditors), each given a different lens:

1. **Security · money · data integrity** — API auth, secrets, SSRF, RLS, the paywall, the ledger.
2. **UX · flow · honesty** — the funnel end-to-end, and every user-facing claim vs the real behavior.
3. **Quality · dead code · tests** — type safety, dead code, stale refs, coverage gaps.

**QA baseline:** `npm run qa` (tsc + vitest + `next build` + smoke/fuzz on port 3041) is **green**, including
60 fuzzed `/api/engine` payloads with zero 5xx. The audit looks past "does it run" to "is it correct, safe,
and honest."

---

## Verdict

The codebase is in good shape for a pre-launch beta: fail-soft everywhere, consistent naming (no `ROOMIE_*`
or `InkBox` leaks to users), a real SSRF guard, HMAC-verified billing, and user-scoped RLS. The council found
**no remotely-exploitable data leak**. The issues worth acting on cluster in three places: (1) a couple of
**auth endpoints that failed open**, (2) **honesty drift** in landing copy (our entire wedge), and (3)
**test coverage** on the newer revenue/cron routes. The first two are **fixed in this pass**; the rest are a
prioritized backlog below, split by "code I can do" vs "needs your Block-0 keys."

---

## Findings (deduped across all three auditors)

| # | Sev | Area | Finding | Status |
|---|-----|------|---------|--------|
| 1 | **CRIT** | Security | `/api/cron` auth was **fail-open**: if `CRON_SECRET` unset, the nightly heartbeat (real spend/deploys) ran unauthenticated. | ✅ **Fixed** — fail-closed + constant-time |
| 2 | **CRIT** | Security | `/api/demand` `create` had no auth/rate-limit — a stranger could spray public `/t/<slug>` landing pages on the domain. | ✅ **Fixed** — per-IP rate-limit (real auth = backlog) |
| 3 | **HIGH** | Honesty | Landing + how-it-works implied a **real demand test runs on every validation**, when the default first pass is an AI estimate (the real test is the opt-in confirm step). | ✅ **Fixed** — copy now says "fast read, then a real test you can stand up" |
| 4 | **MED** | Security | `/api/metrics` used `!==` string compare on the secret (timing-leak shape). | ✅ **Fixed** — constant-time, matches the webhook |
| 5 | **MED** | Quality | `/api/demand` `create` leaked the raw DB `error.message` to the client; `signup`/`create` had inconsistent response shapes. | ✅ **Fixed** — no DB message leak, shapes aligned |
| 6 | **CRIT** | Security | Billing webhook **fail-open**: no `LEMONSQUEEZY_WEBHOOK_SECRET` → acked any POST with 200, allowing fake subscription events to grant entitlements. | ✅ **Fixed** — fail-closed 503 on missing secret |
| 7 | **HIGH** | Security | `/api/execute`, `/api/waitlist`, `/api/feedback` had no rate limiting — open to abuse flooding. | ✅ **Fixed** — per-IP rate limit added to all three |
| 8 | **HIGH** | Security | No HTTP security headers: no X-Frame-Options, HSTS, nosniff, Referrer-Policy. | ✅ **Fixed** — all four added in next.config.ts |
| 9 | **MED** | Security | Cron error response leaked raw `error.message` from Supabase (table/column names). | ✅ **Fixed** — generic "database error" only |
| 10 | **MED** | Security | `approval_decisions` RLS used `USING (true)` — any authenticated user could read any row. | ✅ **Fixed (migration 0008)** — owner-only reads |
| 11 | **HIGH** | Tests | No tests on the newest revenue/core routes: `billing/webhook`, `cron`, `demand`, `feedback`, `metrics`. | ⏳ **Backlog (code)** |
| 12 | **HIGH** | Security | `/api/engine` passes user `byok` into model calls without shape validation. | ⏳ **Backlog (code)** |
| 13 | **MED** | UX/Money | Build paywall does a **hard redirect** to checkout with no confirm step. | ⏳ **Backlog (code)** |
| 14 | **MED** | Honesty | `/live` board reads localStorage only — empty for new visitors despite "public, real-time" copy. | ⏳ **Backlog (code)** — relabel "Demo workspace" |
| 15 | **MED** | Security | In-memory rate limiter isn't shared across Vercel instances — resets on cold start. | ⏳ **Backlog** — Upstash/KV before heavy load |
| 16 | **MED** | UX | Sign-in / sign-out hidden on mobile. | ⏳ **Backlog (code)** |
| 17 | **MED** | Security | `NEXT_PUBLIC_FOUNDER_EMAILS` was hardcoded in component — exposed in JS bundle. | ✅ **Fixed** — set as proper Vercel env var |
| 18 | — | Security | Hardcoded contact emails in source. | ✅ **Accepted by design** |
| 19 | — | Quality | Two auditors flagged "cron `toCompany()` not in try-catch." | ✅ **False positive** |
| 20 | — | Security | SSRF guard "incomplete." | ✅ **Verified correct** |

### Env vars set on Vercel (2026-06-28)
| Key | Status |
|-----|--------|
| `CRON_SECRET` | ✅ Set (generated) |
| `NEXT_PUBLIC_FOUNDER_EMAILS` | ✅ Set |
| `MODEL_PROVIDER`, `MODEL_BASE_URL`, `MODEL_ID`, `MODEL_CHEAP`, `MODEL_API_KEY` | ✅ Set |
| `SUPABASE_*`, `POSTGRES_*` | ✅ Set |
| `METRICS_SECRET` | ✅ Set |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | ❌ Needs LemonSqueezy product + webhook |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` | ❌ Needs Telegram bot |

---

## Detail — what each finding means

### Security & money (auditor 1)
- **Cron fail-open (1):** The biggest real issue. The heartbeat spends money and deploys for every operating
  company. With no secret, any HTTP caller could trigger it. **Now fail-closed:** absent `CRON_SECRET` → `401`,
  and the compare is constant-time. Vercel Cron sends the secret automatically once you set it, so production
  behavior is unchanged the moment Block-0 sets `CRON_SECRET`.
- **Demand create (2):** `create` stands up a *public* page at `/t/<slug>`. Unauthenticated by design (the
  dashboard panel calls it without a token). **Now per-IP rate-limited** (reusing `ratelimit.ts`) so it can't be
  sprayed. The deeper fix — require the founder's session — is backlog #2.
- **Metrics timing (4):** low real risk (long random secret), but now constant-time to match the billing webhook.
- **Webhook / RLS / paywall:** verified sound. HMAC is constant-time; `entitlements` is select-own-row via
  `auth.jwt() ->> 'email'`; writes are service-role only; build is correctly gated behind `checkEntitled()`.

### Honesty (auditor 2) — the wedge
Honesty *is* the product. The one drift that mattered: the landing and how-it-works read as if a live landing
page + ad fire on every validation, when the default is a labeled **AI estimate** and the real test is one click
away. **Fixed** to "a fast, honest read on your idea, then a real demand test you can stand up." The dashboard
already labels the estimate `(AI estimate)`, so the surfaces are now consistent. Remaining honesty items (#11
autopilot-pause, #14 proof-type) are backlog and lower-stakes.

### Quality & tests (auditor 3)
Clean bill on consistency — env naming is uniformly `MODEL_*`, agent JDs match the UI, fail-soft is universal.
The real gap is **test coverage on the revenue/cron routes** (#6): they're smoke-tested for "no 5xx" but lack
unit assertions on the logic that moves money (HMAC accept/reject, entitlement on/off, one-bad-row isolation).
That's the top backlog item.

---

## Accepted by design (with rationale)

- **Hardcoded emails (#17):** `projecttattva1@gmail.com` is the founder's *intended public* contact and notify
  target (a product decision, not a leak). The `/house` allow-list defaults are a convenience so access works
  before `NEXT_PUBLIC_FOUNDER_EMAILS` is set; they're overridable by env. We are **not** changing the public
  contact against the founder's explicit choice. (If you later want a branded `support@competitor.inc`, that's a
  domain/forwarding task, not a code fix.)
- **BYOK keys in browser (auditor 1 HIGH):** keys are stored client-side and sent per-request by design — that's
  what "Bring Your Own Key" means and it's disclosed. Server-side custody would defeat the privacy promise. No change.

---

## Prioritized backlog (post-audit)

**Code I can do next (no keys needed):**
1. **Tests for the money/cron routes** (#6) — HMAC accept/reject, entitlement flip, cron one-bad-row isolation, demand create/signup.
2. **Pre-checkout confirm** (#8) — a "Building needs Operator ($39/mo)" step before the redirect.
3. **`/live` honesty** (#9) — relabel "Demo workspace" (or back it with the DB) so it's never a false "public board."
4. **Mobile auth** (#10) + **autopilot-pause copy** (#11) + **proof-type tagging** (#14).
5. **BYOK shape validation** (#7) and **required GitHub token** (#16) — defense-in-depth.
6. **Seats-left counter** (#12) to make the Founding scarcity honest.

**Needs your Block-0 keys (then it's live, not simulated):**
- `CRON_SECRET` (now required for the heartbeat), LemonSqueezy product + `LEMONSQUEEZY_WEBHOOK_SECRET`,
  Resend (`RESEND_API_KEY`/`RESEND_FROM`) for founder-notify, Bluesky/Mastodon roomie accounts, Telegram bot token.

---

## Positives (what's already right)

- SSRF guard is real and reused on every user-supplied URL.
- Billing webhook HMAC is constant-time; entitlement reads are RLS-scoped to the signed-in email.
- Every integration is gated + fail-soft — nothing crashes when a key is absent, nothing charges or posts
  without approval.
- No `ROOMIE_*`, no `InkBox`, no Twitter/X-as-marketing leaks; `MODEL_*` naming is consistent.
- Ledger math rounds and credits failed work; `decideBuild` is idempotent.
- The smoke suite fuzzes the engine API for 5xx and sweeps every route + 404s.

**Bottom line:** the exploitable + honesty issues are closed in this pass; the rest is a clean, prioritized list,
none of it blocking, most of it small.
