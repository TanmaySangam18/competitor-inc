# Simulation: $1,000 in → first $500 out — where it fails, and the fix

**Setup.** Assume competitor.inc gets a **$1,000 investment** and one job: run a company until it earns a
**real $500**. Idea chosen (dogfooded live): **Turnsgo** — turns lecture recordings into study flashcards
(student niche, our beachhead). This is a *pre-mortem*, grounded by actually driving the product — every
dollar below is **modeled and labelled**, never presented as real revenue. The honesty invariant applies
to this doc too.

## What the product actually did (live dogfood, 2026-07-02)
Ran Turnsgo through the real pipeline in sim mode: onboarding → Demand Radar (**67 / STRONG**, cited from
live sources) → Approve build → crew built the site → set goal **$500 revenue** → ran nightly shifts.
Result on the Growth tab:

> **North star: NOT MEASURED — $0 / $500 revenue.** Funnel: all NOT MEASURED. Constraint: **traffic.**

That is the product working *correctly*: under a direct "make money" test it **refused to fabricate the
$500** and pointed at the real bottleneck. The rest of this doc is why, and what to do.

## The failure map (ranked — this is where $1,000 → $500 breaks)

**F1 — Monetization/backend gap (build ships a static site).** `execution.ts` `build` ships a real
GitHub Pages **static front-end**; there is no auto-provisioned database, user auth, or server API. A
static flashcards app can't hold accounts or take recurring payments → it can't *be* a SaaS that earns.
→ **Fix (now):** sell a money-shape that needs no backend — info product (Felix's $41k PDF), template,
paid waitlist/cohort, service, or a landing page + **Stripe payment link** (we can generate one). →
**Fix (later tier):** real per-tenant backend provisioning (Postgres/Supabase + auth + functions),
namespaced the way we already namespace repos. Build it *after* first revenue, not before.

**F2 — Traffic/distribution (the constraint the product itself flagged).** No real visitors → $0,
regardless of build quality. This is Felix's hidden ingredient: his money rode on an audience he
**already had**. We don't have one yet. → **Fix:** founder-led + organic distribution (campus/NU
beachhead, communities, one OSS lite tool for $0-CAC), and **start building the founder's audience now**
(the open social-accounts gap — see F5).

**F3 — The three keys are off (can't capture money even if earned).** Supabase auth providers, prod
migrations, and Polar checkout `metadata.slug` are not all live → a real signup/sale wouldn't persist or
attribute. → **Fix:** the go-live steps below. Founder-only, ~30 min total.

**F4 — Paid-ads unit economics don't close at this scale.** $1,000 of student-targeted ads ≈ 600–2,000
clicks → at ~1–2% visit→paid and an $8/mo product ≈ **$50–$320/mo**, i.e. *less than $500 while burning
the whole $1,000*. Ads to a cheap consumer product is a losing path here (and ads are Phase-2 +
founder-approval-gated + F1-visa-sensitive anyway). → **Fix:** don't buy ads for the first $500. Hold the
budget for infra/domain/credits.

**F5 — No distribution surface set up.** No X / LinkedIn / campus channel exists yet, so even great
drafted posts have nowhere to go (we draft; the founder posts — accounts are the founder's to create). →
**Fix:** stand up 1–2 accounts this week; the crew already drafts the content.

**F6 — F1 collection.** Even a real $500 can't be *collected* by the founder until work authorization
(OPT/I-765 → EAD) lands. → **Fix:** confirm timing with DSO; until then, fill a committed pipeline and
flip the switch when authorized.

## The corrected path to the first $500 (honest, cheap)
The fastest honest $500 is **not** 63 ad-driven $8 subs. It's **one higher-ACV, backend-free sale**:

| Path | Backend needed? | Units to $500 | Cost of the $1,000 used |
|---|---|---|---|
| One **$499 Validation Sprint** (agency/founder) | No | **1 yes** | ~$0 |
| One **Cohort Lab pilot** ($1.5–2.5k/mo) | No | <1 | ~$0 |
| Info product / template (Felix's PDF model) | No | ~30–60 | ~$0 |
| $8/mo consumer SaaS via ads | **Yes** (accounts) | ~63 subs | ~$1,000, still short |

**So the $1,000 is best spent on ~$0** for the first $500 — domain + credits, not ads — and the real
work is **founder-led selling into the warm circle** (the cohort-target list the scout is compiling).
The lesson from Felix, stated plainly: the agents scale the ops; **the money rides on distribution +
a product people already want.** Build the audience, sell the backend-free thing first, add real
backend provisioning once there's revenue to justify it.

## Final steps to get the product LIVE (founder-only; ~30 min)
1. **Supabase auth** — enable Google + GitHub providers + set Site URL (see `docs/AUTH-SETUP.md`). Unlocks
   sign-in, the Founder account on prod, cloud persistence, entitlement→payment matching.
2. **Migrations** — paste `supabase/PENDING-PROD.sql` into the Supabase SQL editor → Run (idempotent;
   safe even if some are already applied).
3. **Checkout attribution** — add `metadata.slug` to the Polar checkout link so revenue attributes to the
   company.
4. **Vercel seat** — verify identity in the Vercel dashboard / projecttattva1@gmail.com so normal deploys
   resume (workaround deploy path works meanwhile).
5. **Distribution** — stand up 1–2 posting accounts; the crew drafts, you approve, you post.
6. **Go/no-go** — run the golden path once on prod (sign in → build → set goal → checkout test), then sell
   one backend-free offer to the warm list.

**None of this is silently broken — it's your keys + a sequenced backend roadmap.** The core promise
(build, run, make money, agents do the human work) is real for the front-end + distribution + money-link
+ nightly-ops loop today; full software-with-accounts is one honest capability (backend provisioning)
away, and that's the next tier after the first real dollar.
