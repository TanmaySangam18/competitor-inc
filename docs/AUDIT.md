# Professional full-codebase audit — competitor.inc

**Date:** 2026-06-27 · **Scope:** every live route, API handler, and engine module on `build-to-keys`.
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
| 6 | **HIGH** | Tests | No tests on the newest revenue/core routes: `billing/webhook`, `cron`, `demand`, `feedback`, `metrics`. Smoke hits them, but no unit assertions on HMAC, entitlement flip, or per-company shift isolation. | ⏳ **Backlog (code)** |
| 7 | **HIGH** | Security | `/api/engine` passes user `byok` (provider/apiKey/baseUrl) into model calls without shape validation. Fuzz shows **no 5xx** (fail-soft holds), so it's hardening, not a live bug. | ⏳ **Backlog (code)** |
| 8 | **MED** | UX/Money | Build paywall does a **hard redirect** to checkout with no "this needs Operator ($39/mo)" confirm step — a surprise for someone who validated free. | ⏳ **Backlog (code)** |
| 9 | **MED** | Honesty | `/live` "public live board" reads **localStorage only** — a new visitor sees an empty/demo board, not real companies. Copy says "public, real-time." | ⏳ **Backlog (code)** — relabel "Demo workspace" until backed by the DB |
| 10 | **MED** | UX | Sign-in / sign-out are hidden on mobile (`sm:` only) in the landing nav. | ⏳ **Backlog (code)** |
| 11 | **MED** | Honesty | Autopilot "pauses on approval" isn't explained — someone could leave it on overnight and find it stalled. | ⏳ **Backlog (copy)** |
| 12 | **MED** | UX | Founding "first 150 — then it's gone" scarcity has **no seats-left counter** to back it. | ⏳ **Backlog (code)** |
| 13 | **MED** | Security | Free-tier caps (validate 3/day, shift 12/day) are **client-side** and bypassable via the BYOK toggle. Documented as best-effort; hard cap is server-side per-user. | ⏳ **Backlog (code)** — gate paid model to authed users |
| 14 | **MED** | Honesty | "Proof" badge renders any `proof.value` string — not enforced to be a clickable URL / real metric. Copy promises "a live URL, a passing build, a real metric." | ⏳ **Backlog (code)** — type-tag proof, render verifiable vs narrative differently |
| 15 | **LOW** | Quality | ~13 engine modules lack unit tests (`db.ts` mappers + `useEngine.ts` store are the ones that matter). | ⏳ **Backlog (code)** |
| 16 | **LOW** | Quality | `buildOnGitHub(spec, token = process.env.GITHUB_TOKEN)` default could silently fall back to the operator's token if a caller forgets to pass the user's. | ⏳ **Backlog (code)** — make `token` required |
| 17 | — | Security | Hardcoded contact/founder emails in source (`page.tsx` footer, `house/page.tsx` allow-list, `notify-founder.ts` fallback). | ✅ **Accepted by design** — see note |
| 18 | — | Quality | Two auditors flagged "cron `toCompany()` not in try-catch." | ✅ **False positive** — it *is* inside the per-company try-catch; one bad row can't abort the run |
| 19 | — | Security | SSRF guard "incomplete." | ✅ **Verified correct** — the 4-octet regex + private-range check is sound |

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
