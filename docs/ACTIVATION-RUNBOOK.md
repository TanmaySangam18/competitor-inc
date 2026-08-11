# Activation runbook: turning the deployed site from a brochure into a company

**Written 2026-08-11, after reading the live deployment.** Verified fact, not a guess:
`vercel env ls production` returns exactly **one** variable, `GROQ_API_KEY`. Everything else is absent.
`/connect` on the live site therefore reports **1 of 18 connected**, which is honest and correct.

What that means concretely today:

- **No database.** Sign-in cannot work. Nothing a visitor does persists.
- **No `CRON_SECRET`.** `/api/cron` fail-closes with 401, so the nightly heartbeat has **never run**.
  Every loop, standup, ignition check, and the ADR-0028 rituals (forecast, close, agent review, drills)
  are wired and tested but have never fired in production.
- **No `GITHUB_TOKEN` or Vercel token.** The build path cannot commit or deploy anything.
- **No `RECEIPT_SIGNING_SECRET`.** Receipts cannot be signed, so `/verify` stays in its unarmed state.

Each step below is founder-only by design: it needs secret values, and several are among the six
hard-stops (account creation, terms, authentication, payment). Values never belong in a chat log.

---

## Step 1 — set the environment variables (Vercel Production)

The CLI is already authenticated as `projecttattva1-4009`. Each command prompts for the value, so the
secret goes straight from your clipboard to Vercel and is never echoed.

```bash
cd ~/competitor-inc
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add CRON_SECRET production
npx vercel env add RECEIPT_SIGNING_SECRET production
npx vercel env add GITHUB_TOKEN production
npx vercel env add FULLSTACK_VERCEL_TOKEN production
npx vercel env add SLACK_BOT_TOKEN production
npx vercel env add SLACK_SIGNING_SECRET production
npx vercel env add SLACK_DIGEST_CHANNEL production
npx vercel env add SLACK_LOOP_CHANNEL production
npx vercel env add FOUNDER_USER_ID production
```

Notes that matter:

- **`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must NOT be marked Sensitive.**
  A Sensitive `NEXT_PUBLIC_*` var is not inlined into the client bundle: the server sees it, the browser
  does not, and a gate looks armed while being silently off. This has bitten this project before.
- The four `SLACK_*` values already exist in your local `.env.local`, so this is copy across, not create.
- `CRON_SECRET` and `RECEIPT_SIGNING_SECRET` are yours to invent. Any long random string:
  `openssl rand -hex 32`.
- `FOUNDER_USER_ID` is your Supabase `auth.users` id. Without it, ritual escalations (retire/retune
  recommendations, churn saves, drill nags) stay in the digest text instead of landing in the decision
  queue, and the cron response reports `ritualEscalationsUnrouted` rather than dropping them silently.
- Deliberately NOT set: `NEXT_PUBLIC_CHECKOUT_URL*`. The paywall only enforces once a checkout link
  exists, so leaving it absent keeps the site open. Setting it is R1 and needs Polar products first.

Confirm with `npx vercel env ls production` (names only, no values).

## Step 2 — redeploy, because env vars bind at build time

Setting a variable does nothing to the running deployment. A fresh deploy is required.

```bash
npm run ship
```

That script runs the full QA gate first, so a red build cannot ship, then deploys from a clean
git-archive of HEAD with the `.vercel` link copied in (the documented workaround for the
`TEAM_ACCESS_REQUIRED` / seatBlock error that breaks a plain `vercel --prod`).

## Step 3 — apply the remaining migrations

Open Supabase Studio for project `nfxqlyidxrncfawakhuw`, go to SQL Editor, and paste the whole of:

```
supabase/migrations/LAUNCH_BUNDLE_0032-0035.sql
```

One paste, four migrations: `loops` (the loop engine's durable state, without which `tickLoop` cannot
persist anything), `user_connections` (the per-user key vault), `treasury` (envelope budgets), and
`market_watch`. Every statement is guarded, so re-running is safe if some already exist.

## Step 4 — fire the first heartbeat

This is the moment the company starts running itself. Ignition (ADR-0021) means company #0 births its
own loop on the first tick; nobody presses a start button.

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" https://competitor-inc-zeta.vercel.app/api/cron | jq
```

Expect JSON with `ran`, `ignition`, and the ADR-0028 fields `rituals`, `ritualEscalations`,
`ritualGaps`. On a Monday the forecast fires; on the 1st the close and evidence log fire; on the first
Monday of a quarter the agent review fires. Any day, the most overdue drill is queued for you.

Vercel Cron will then call this on the existing daily schedule without you.

## Step 5 — verify honestly

Reload `/connect`. It should climb well past 1 of 18 and will name whatever is still dark. That page
reads the real environment, so it cannot flatter you.

---

## What is still deliberately not done after all five steps

- **R1, the cash register.** Polar products plus `NEXT_PUBLIC_CHECKOUT_URL*` plus
  `POLAR_WEBHOOK_SECRET`. Account creation, accepting terms, and payout details are four of the six
  hard-stops. Until this exists the company cannot take money, and the forecast will keep reporting no
  committed inflows because that is the truth.
- **Bank readout and payment-processor export**, so the monthly close can complete its three-way match
  instead of naming its unconnected legs.
- **The first backup-restore drill**, which needs your Supabase access. `docs/runbooks/backup-restore-drill.md`.
- **No external user has completed onboarding.** `lib/core/first-run.test.ts` now guarantees the rail
  cannot claim something is connected when it is not, but a guarantee is not the same as a witness.
