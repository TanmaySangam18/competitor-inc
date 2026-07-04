# Execution Backlog — AI exec team (live)

_Owner: the AI co-founder/exec team. This is a commitment list, not suggestions. Updated as work lands._
_Last updated: 2026-07-04._

## What I'm Owning Next (Not Asking — Doing) — priority order

1. **Playbook content depth** — quality pass on the highest-intent free intros (no new slop).
2. **Weekly operating cadence** — run the growth/ops review; surface decisions + numbers proactively.
3. **Wallet persistence + `/api/wallet`** — parked until migration 0018 applied + a wallet funded.
4. **Agent spend-execution plumbing** — parked behind #3 and a first customer.

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
- Signup-completion attribution: landing CTA marks a referral; SignupAttribution fires one real
  `signup` for `home` once auth completes (returning sign-ins never counted). Funnel now end-to-end
  (2026-07-04, deployed).
- Conversion instrumentation: `demo_cta` event on all landing CTAs (closes the demo→intent cliff) +
  /api/track returns every funnel stage + founder Landing-Funnel readout on /house/board with step
  conversion + biggest-drop callout. Needs migration 0019 (demo_cta type) (2026-07-04, deployed).
- Playbooks: contextual "Read next" internal linking + demo-first CTA (2026-07-04, deployed).
- Business Wallet: engine + 21 tests + schema (0018) + Settings UI + fail-safe cron spend gate
  (unfunded wallet blocks all real spend) (2026-07-04, deployed).
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
