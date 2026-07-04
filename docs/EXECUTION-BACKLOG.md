# Execution Backlog — AI exec team (live)

_Owner: the AI co-founder/exec team. This is a commitment list, not suggestions. Updated as work lands._
_Last updated: 2026-07-04._

## What I'm Owning Next (Not Asking — Doing) — priority order

1. **Agent spend wiring** — route the executor's real-money actions (domains, hosting, ads, SaaS,
   APIs) through the Wallet (`decideSpend` → policy floor → execute → log txn attributable to
   agent+task). The Wallet engine + UI + schema are DONE; this connects it to real execution.
2. **Wallet spend API + Supabase persistence** — `/api/wallet` (config CRUD, txn log) writing through
   the service role; the settings card is currently local-first, mirror it to `wallets` /
   `wallet_transactions` (migration 0018).
3. **Compounding organic growth** — deepen the highest-intent playbook content + internal linking so
   the (now-correct) SEO base ranks and funnels to the demo. No founder posts, no ad spend.
4. **Conversion instrumentation review** — confirm the demo→signup funnel events answer "where do
   visitors drop," so launch traffic teaches us something.
5. **Weekly operating cadence** — run the growth/ops review; surface decisions + numbers proactively.

## Decisions made (as the exec team) — 2026-07-04
- **Social platforms (ROI-scoped, NOT all):** TIER 1 = X + Reddit + Hacker News + Product Hunt (where
  first-time/indie founders discover tools; the honest-AI-cofounder contrarian angle lands there).
  Auto-heartbeat = Bluesky + Mastodon (already wired, policy-checked, zero founder effort). Compounding
  = SEO/playbooks (mine). SKIP = TikTok / Instagram / Facebook / Threads (wrong audience+format for a
  B2B founder tool; content cost > ROI). Handle: @competitorinc. I prep profiles/bios/content; founder
  creates accounts (identity) + posts (their voice) = escalations.
- **Paid ads + ad-creative tooling (Montage/etc.): DEFERRED.** Pre-OPT, pre-revenue, our own playbook
  is demand-first/organic before paid. Committing to a creative tool now is premature spend. Trigger to
  revisit: ≥ proven demand + budget; then AI generates/tests/iterates creative + landing variants on the
  pixel data, spending within the Wallet's `ads` budget + approval rules (exactly what the Wallet enables).

## Recently Shipped (rolling)
- Business Wallet: engine + 17 tests + schema (0018) + Settings UI (limits/budgets/pause/revoke/
  preview/txn-log) (2026-07-04, deployed).
- SEO: unified canonical/OG domain via lib/site.ts; sitemap 18→38 URLs (2026-07-03, deployed).
- Honest undo (reversibility classifier) + performance-weighted budget allocation (2026-07-03).
- Office budget governance (Allocator + Enforcer) + Brain audit badges (2026-07-03).
- Bento landing, 2D delegation, Company Brain, Slack ChatOps, digest/scorecard schema (2026-07-03).

## The Only Things That Are Genuinely Yours (Real Escalations)
Everything else I plan, reason, and execute. These require YOUR authority:

1. **OPT / work authorization** — the paid-flip trigger. When it lands, tell me; I flip it same day.
2. **Payment processor + KYC for the Business Wallet** — real card funding and merchant/KYC
   (Polar/Stripe) legally require you. I build the whole wallet around it; you complete verification.
3. **One launch post in your name** — I can't publish as you. Kit is ready; you hit publish.
4. **`NEXT_PUBLIC_SITE_PUBLIC=1` + prod migrations** — env/DB actions on your account (I supply exact
   values/SQL; you paste — I can't run your prod DB blind).
5. **Any spend of your money** and **legal/compliance sign-off** (Terms changes, data-processing).
6. **Personal-preference calls** — brand name/voice finalations, pricing changes to your model.
