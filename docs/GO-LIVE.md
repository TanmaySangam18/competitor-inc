# GO-LIVE — the founder's swoop-in (Block 0)

Everything in Blocks 1–8 is built, gated, and QA-green on the `build-to-keys` branch (PR #2). The app
runs **fully simulated with zero config** — these steps take it live and flip on the real pieces. Each
capability is **OFF until its key is set**; nothing consequential ever runs without your credentials.

> First: **merge PR #2 into `main`.** Then do the steps below in your own accounts.

## The 5 steps

1. **Vercel** — create a project ($0 Hobby), import `TanmaySangam18/competitor-inc`, enable auto-deploy on `main`.
2. **Supabase** — create a project ($0), open the SQL editor, and run **ALL migrations in
   `supabase/migrations/` in filename order** — `0001_init.sql` through `0014_video_kind.sql` (14 files — or paste `supabase/PENDING-PROD.sql` in one go;
   an earlier version of this doc stopped at 0005, which would ship WITHOUT entitlements, approvals,
   the RLS tightening, and the entire revenue loop).
3. **Env vars in Vercel** (table below) — at minimum Supabase + one model key.
4. **Deploy** (push to `main` or `npx vercel --prod`), point a domain, set `NEXT_PUBLIC_SITE_URL`.
5. **IP assignment** — get your contributor's signed IP-assignment so you own 100%. (Code is already yours in GitHub.)

## Which key lights up which block

| Set this | Lights up | Block |
|---|---|---|
| `MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (Claude-for-Startups credits) | **Makes the AI real** — agents reason instead of simulating; real validation, chat, shifts | 4, all |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real auth + cross-device persistence | core |
| `SUPABASE_SERVICE_ROLE_KEY` (server-only — **god mode, never expose/commit**) | **Waitlist capture** (signups stop evaporating), **demand tests**, nightly cron, memory writes | 1, 3, 5 |
| `CRON_SECRET` (+ Vercel Cron) | Nightly autonomous shift — **the agents take over** | engine |
| `EMBEDDINGS_API_KEY` (+ optional `EMBEDDINGS_BASE_URL`/`MODEL`) | **Semantic agent memory** — the crew gets sharper per company | 5 |
| `RESEND_API_KEY` + `RESEND_FROM` (+ `CRON_SUMMARY_EMAIL`) | Real email + the morning summary | exec |
| `GITHUB_TOKEN` | Forge builds real repos (verify-before-done) | exec |
| `VERCEL_DEPLOY_HOOK_URL` (+ `VERCEL_PROJECT_URL`) | Real deploys | exec |
| `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID` | Payment links (you keep 100%) | exec |
| `BLUESKY_HANDLE` + `BLUESKY_APP_PASSWORD` | Free organic posting (approval-gated) | dist |
| `NEXT_PUBLIC_CHECKOUT_URL` | Operator checkout (Polar — Merchant of Record) | rev |
| `ADS_WEBHOOK_URL` | Ad spend routing (SSRF-guarded) | exec |
| `OBSERVABILITY_URL` (+ `OBSERVABILITY_KEY`) | Eval/trace sink on autonomous ops | 6 |
| `NEXT_PUBLIC_SITE_PUBLIC=1` | **The launch flip** — allows search indexing + the playbooks sitemap | 7 |
| `NEXT_PUBLIC_OPERATE=0` | Freezes the Operate surface for a lean launch (optional) | — |

Full annotated list: [`.env.example`](../.env.example). Provider naming is `MODEL_*` (not `ROOMIE_*`).

## The minimum to be "alive and earning"
Supabase (URL + anon + **service role**) + a **model key** + `CRON_SECRET` + `NEXT_PUBLIC_SITE_PUBLIC=1`
+ `NEXT_PUBLIC_CHECKOUT_URL`. That gives you: real AI · captured signups · live demand tests · the nightly
autonomous crew · indexable SEO playbooks · Founding checkout. Add the rest as you grow.

## What's built per block (all gated, all QA-green)
1. Server-side waitlist + referral capture · 2. Behavioral conversion pass (honest) · 3. Real demand-test
instrumentation (`/t/<slug>`) · 4. Dynamic per-company crew engine · 5. pgvector agent memory · 6. Evals/
observability wrapper · 7. SEO/distribution surface + 9 playbooks · 8. This checklist.

## Honest notes
- **Approval Inbox stays** — "1% human" = fast approvals on consequential moves, not zero control. That's the wedge.
- The validation gate stays an **"AI estimate"** until you run a real demand test (`/t/<slug>` + your traffic).
- The **trust-spark** (first cold DMs, HN/Reddit) is still **you** — agents carry the scalable rest.
- Run `npm run qa` after merge — it should end `SMOKE PASSED ✓`.
