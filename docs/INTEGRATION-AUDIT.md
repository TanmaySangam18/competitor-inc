# Full-Stack Integration Audit — competitor.inc (2026-07-01)

Traced every interactive feature end-to-end and verified against **live production** (`competitor-inc-zeta.vercel.app`)
+ the actual prod env config. Legend:

- ✅ **WORKS e2e now** — verified against prod
- 🟡 **WIRED but GATED** — code is complete; blocked on a named missing link (env/account/dashboard/auth)
- ⛔ **STUB / no real backend**

**Prod capability truth** (`GET /api/engine`): `model:true, github:true, deploy:false, email:false, payments:false, ads:false, bluesky:false, mastodon:false, reddit:false`.
**Env set in prod:** Supabase (url+anon+service), MODEL_*, GITHUB_TOKEN, NEXT_PUBLIC_CHECKOUT_URL, POLAR_WEBHOOK_SECRET, CRON_SECRET, METRICS_SECRET, FOUNDER_EMAILS.
**NOT set:** RESEND, STRIPE, BLUESKY, REDDIT, MASTODON, ADS_WEBHOOK, VERCEL_DEPLOY_HOOK_URL, TELEGRAM.

---

## 🔑 The keystone: Auth is the gate on almost everything real
`useAuth` → Supabase OTP (magic link) + OAuth (Google/GitHub). Supabase **is connected** (env set), code is wired.
**Missing link:** OAuth providers must be enabled in the **Supabase dashboard**, and magic-link needs **SMTP** configured there — neither is verifiable from code and no real account has signed in. Until that's confirmed, sign-in likely fails and users stay **guests**. "Continue as guest" ✅ works.
Status: 🟡 **partially wired — missing link = Supabase dashboard provider/SMTP config.**
This matters because **auth gates real builds, approval execution, DB-persisted companies, and paid entitlement** (all below).

---

## Feature-by-feature

### ✅ Fully working end-to-end (verified in prod)
| Feature | Path | Notes |
|---|---|---|
| **Demand Radar** | /radar, ValidationGate, ImportPanel → `/api/radar` → HN+StackExchange+GitHub → cited report | Keyless, no gating. Verified real cited data. |
| **Validation (onboarding)** | idea → `createCompany` (localStorage) → `/api/engine` validate → **real model** → gate | `model:true`. Real-model-backed estimate + Radar on top. |
| **Import audit** | paste URL → `/api/import` → fetch + `auditSite` (model) / `simulatedAudit` fallback → Radar auto-runs | Fully wired; model makes the audit real. |
| **Waitlist + counter** | /join → `/api/waitlist` → Supabase | Verified `count:3` real, persists. |
| **Lockin signup** | /lockin → `/api/interest` → Supabase `interest` | Verified `persisted:true` (table exists), 0 real signups so far. |
| **Feedback widget** | `/api/feedback` → Supabase `feedback` | Verified `{ok:true}` persists. |
| **Demand test** | /t/[slug] → `/api/demand` → Supabase `demand_tests`/`demand_signups` | Verified `persisted:true`. |
| **Chat / Delegation crew** | message → `/api/engine` chat → **real model** (streams) + queues approvals via `x-approval` | `model:true`. Works + consequential asks queue. |
| **GTM Plan + Gauge** | client compute from activity log | By design no backend — genuinely done, not a stub. |
| **Static pages/nav** | /how-it-works, /playbooks(+[slug]), /blog, /proof, /privacy, /terms, /live | Render fine. |
| **Metrics** | `/api/metrics` (METRICS_SECRET set) | Founder-only, locked without secret — correct. |

### 🟡 Wired but GATED — exact missing link named
| Feature | Missing link | What the user sees today |
|---|---|---|
| **Sign In (OAuth + magic link)** | Supabase dashboard: enable Google/GitHub providers + SMTP | Button runs, but sign-in likely doesn't complete → falls back to guest |
| **Real build (Forge)** | **auth session** — `/api/execute` returns `{disabled:"not authorized"}` for guests | ⚠️ "Shipping your site…" banner shows but **no repo is built for guests**. Works only for a signed-in owner (proven: Kindred/Lockin via token). |
| **Approval → real execution** | per-kind creds: outreach→Resend, deploy→Vercel hook, spend→ads webhook, social→accounts; **+ auth** | Approving clears the inbox but the real send/deploy is `disabled`. **"Copy post" is the one honest working path.** |
| **Reddit / Bluesky / Mastodon posting** | `REDDIT_*` / `BLUESKY_*` / `MASTODON_*` env (founder accounts) | Executors exist; OFF. Copy-paste works. |
| **Email (outreach + founder "new signup" alerts)** | `RESEND_API_KEY` + `RESEND_FROM` | Signups persist but no email fires. |
| **Billing round-trip** | checkout redirect ✅ (`NEXT_PUBLIC_CHECKOUT_URL` live); webhook wired (`POLAR_WEBHOOK_SECRET`) — but **post-payment entitlement→unlock loop unverified e2e**; and F1 blocks payout | Upgrade → real Polar checkout works; what happens after a real payment needs a live test |
| **Deploy action** | `VERCEL_DEPLOY_HOOK_URL` | `deploy:false` → deploy approvals are no-ops |
| **Ads / spend** | `ADS_WEBHOOK_URL` | `ads:false` → stays a simulated plan (honest) |
| **Nightly cron** | infra ✅ + CRON_SECRET; but only processes **DB-persisted** (authenticated) companies | Guests' localStorage companies aren't seen by cron |
| **Proof board** | `/api/proof` → "Unauthorized" (auth/secret gated) | Wired; needs auth |
| **Telegram ChatOps** | `TELEGRAM_BOT_TOKEN` + webhook secret | OFF |
| **Ownership verify (import)** | `/api/import/verify` exists | needs a real domain-ownership check pass before operating an imported product |

### ⛔ Stub / frontend-only
| Feature | Note |
|---|---|
| **"Delete" approval action** | Intentional no-op (`{metric:"deletion acknowledged"}`) — destructive, never auto-API. By design, but it's not "real." |
| **Twitter / LinkedIn approvals** | No API executor (X API paid, LinkedIn complex) — **copy-paste only** by design. Not a dead button (Copy works), but no auto-post. |
| **Stripe payments** | `payments:false` — Stripe path exists but unused (Polar is the MoR). Dead unless Stripe keys set. |

---

## The dangerous "looks done vs. is done" dead-ends (ranked)
1. **"Shipping your site…" for guests** — implies a build is happening; nothing builds without an auth session. Highest deception risk. → gate the banner on auth, or actually build for guests via a server token path.
2. **Sign In** — looks functional; likely doesn't complete (Supabase providers/SMTP). Your original catch. → verify Supabase dashboard config.
3. **Approving email/deploy/spend/social** — inbox clears, nothing happens. → show "connect X to send" state instead of a silent no-op.
4. **Billing post-payment** — checkout works; the unlock-after-pay loop is unverified.

## The single highest-leverage fix
**Auth (Supabase dashboard: enable providers + SMTP).** It's the keystone — it unblocks real builds, approval execution, DB-persisted companies, cron data, and paid entitlement in one move.

_No code changed in this audit — map only, per request._
