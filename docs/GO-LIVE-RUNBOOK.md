# Go-live runbook — redesign + instrumentation wave (2026-07-03)

Everything below is founder-side; the code is shipped and QA-green. Total time: ~15 minutes.

## 1. Prod Supabase migrations (blocking real funnel data)

No CLI/psql access exists from the dev machine, so apply via the dashboard:

1. Open Supabase → your prod project → **SQL Editor**.
2. Paste + run each pending file from `supabase/migrations/`, **in order**. Per the last audit,
   0009–0012 were never applied to prod; 0013–0017 are newer. Safe to re-run: everything is
   `if not exists` / `drop … if exists` guarded.
   - `0009_growth_goal.sql`
   - `0010_events.sql`
   - `0011_revenue_events.sql`
   - `0012_growth_experiments.sql`
   - `0013_interest.sql`
   - `0014_video_kind.sql`
   - `0015_backend_provisioning.sql`
   - `0016_landing_demo_events.sql` ← new (hero-demo event types)
   - `0017_scorecard_and_digests.sql` ← new (scorecard history + weekly digests)
3. Verify: `select count(*) from public.events;` runs without error, and
   `select * from information_schema.tables where table_name in ('scorecard_snapshots','weekly_review_digests');` returns 2 rows.

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
5. Friday only: check `CRON_SUMMARY_EMAIL` inbox for the weekly review digest.

## Known limitations (honest)
- Scorecard **snapshot writes** still use the cookie-bound client — trend history stays empty until
  they move to the service client (tracked follow-up). The digest works without it (Rocks/Issues/constraint).
- Slack signature verification requires the raw body; if Slack's URL check fails, see the note in
  `app/api/slack/webhook/route.ts` before debugging elsewhere.
- Lockin's 10-signup goal remains gated on the founder posting one draft from docs/LOCKIN-LAUNCH-KIT.md.
