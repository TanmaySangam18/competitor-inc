# Go-live runbook — redesign + instrumentation wave (2026-07-03)

Everything below is founder-side; the code is shipped and QA-green. Total time: ~15 minutes.

## 1. Prod Supabase migrations (blocking real funnel data)

**Probed prod 2026-07-03 — precise status (no more guessing):**
- ✅ Service role IS configured in prod; `events` (0010) and `interest` (0013) tables exist and persist.
- ❌ **`0016` is NOT applied** — confirmed live: a `demo_verdict` POST to prod was rejected by the old
  type CHECK (`persisted:false`, no row written). So demo metrics silently drop until 0016 runs.
- ❌ **`0017` is NOT applied** — it's brand new this session (scorecard_snapshots + weekly_review_digests).

**Pending set (run in order, all idempotent):** `0016_landing_demo_events` · `0017_scorecard_and_digests`
· `0018_business_wallet` · `0019_demo_cta_event` · `0020_build_in_public_consent` · `0021_operating_cycles`
(NEW 2026-07-05 — powers the `/watch` nightly history; the page works without it, just shows the empty
state). No CLI/psql from the dev machine, so apply via the
dashboard — Supabase → prod project → **SQL Editor** → paste + run each file. Everything is
`if not exists` / `drop … if exists` guarded, so re-running the older ones (0009–0015) if you're unsure
is a harmless no-op. (0019 finalizes the events type CHECK to include demo_start/demo_verdict/demo_cta,
so if you only run one of the events migrations, run 0019.)

Verify after: a `demo_cta` event persists, and
`select table_name from information_schema.tables where table_name in
('scorecard_snapshots','weekly_review_digests','wallets','wallet_transactions');` returns 4 rows.

## 2. Env vars to confirm on Vercel

| Var | Purpose | State |
|---|---|---|
| `TRACK_SALT` | pixel dedup (any random string) | required for dedup |
| `CRON_SECRET` | nightly heartbeat auth | set (per audit) |
| `CRON_SUMMARY_EMAIL` | morning summary + Friday digest recipient | set to your email |
| `RESEND_API_KEY` | email sending | needed for digest email |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | digest + approvals to phone | optional |
| `SLACK_SIGNING_SECRET` / `SLACK_BOT_TOKEN` / `SLACK_DIGEST_CHANNEL` | Slack ChatOps | see docs/SLACK-CHATOPS-SETUP.md |

## 3. Deploy

Preferred: fix the seat block once — Vercel dashboard → team settings → members → verify your seat
(the TEAM_ACCESS_REQUIRED email). Then `vercel --prod` works from the repo directly.

Workaround (verified previously): clean-copy deploy so local junk never ships:
```bash
cd /Users/durgasaitanmaysangam/competitor-inc
TMP=$(mktemp -d) && git archive HEAD | tar -x -C "$TMP" && cp -R .vercel "$TMP/.vercel"
cd "$TMP" && vercel --prod --yes
```

## 4. Post-deploy verification (5 minutes)

1. Open the prod URL — hero demo: type an idea, watch the run, see the verdict.
2. Supabase → Table editor → `events`: expect `view` rows for slug `home`, plus
   `demo_start` (source `tti:…s`) and `demo_verdict` (source `verdict:…`) rows.
3. `/nu` — loads, and `view` rows appear for slug `nu`.
4. Dashboard → Brain tab renders; Delegation floor shows suits + the construction site.
5. Dashboard → **"Watch the org"** (new nav link) → `/watch`: type a goal → the 8-role crew (ceo,
   engineering, marketing, support, growth, finance, legal, ops) spawns, each verified by a different
   role, and desk items appear (incl. finance/legal/ops packets). Nightly history fills in once 0021 is
   applied + a company runs a supervised cycle (`SUPERVISED_CYCLE=1`).
6. Friday only: check `CRON_SUMMARY_EMAIL` inbox for the weekly review digest.

## Known limitations (honest)
- Scorecard **snapshot writes** still use the cookie-bound client — trend history stays empty until
  they move to the service client (tracked follow-up). The digest works without it (Rocks/Issues/constraint).
- Slack signature verification requires the raw body; if Slack's URL check fails, see the note in
  `app/api/slack/webhook/route.ts` before debugging elsewhere.
- Lockin's 10-signup goal remains gated on the founder posting one draft from docs/LOCKIN-LAUNCH-KIT.md.
