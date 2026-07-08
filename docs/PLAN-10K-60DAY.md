# Plan — competitor.inc to $10K MRR in 60 days (then replicate for 40k)

**Decided 2026-07-08.** Keep competitor.inc's thesis (AI co-founder for founders → the 40k-student
mission); use the two strategy reports (`~/Downloads/*.pdf`) as the EXECUTION framework only. Every
strategy must be *legitimate* — real paying users, no fabricated traction (the honesty brand is the moat).

## Honest framing
$10K MRR in 60 days is an aggressive **forcing function**, not a promise. The case studies the reports
lean on (Sleek, SiteGPT, LaunchFast) are survivorship-biased outliers. Realistic read: a stretch; **$3–5K
real MRR in 60 days would already be enormous validation.** Build to maximize the true shot; never pad the
number. North-star metric stays **PPU (Proven Paying Users = paid ∩ verified outcome)**, not signups.

## The binding constraint is NOT the product — it's distribution
The product is built + governed. The reports' loudest lesson ("coding is the easy part; everything is
distribution") is exactly competitor.inc's #1 open crack: no public presence yet. Claude **drafts**;
the founder **posts/sells** (can't post or sell as the founder). Where 60 days is won or lost.

## Gates (status)
- **Legal / earning:** ✅ Confirmed (2026-07-08) the founder can earn on OPT. Charging is unblocked. [[path-to-paid-f1]]
- **Payments live:** ⛔ needs the founder to create 3 Polar products + set 3 checkout-URL env vars (below).
- **No-fake-proof:** HARD LINE — never fabricate a signup/receipt/number. [[crack-audit-and-no-fake-proof]]

## Pricing — founder tiers, higher-ticket (decided)
Rationale: $10K from *students* at student prices needs ~256–500 paying users (unrealistic organically in
60d). So monetize **higher-willingness founders** first; **~30–40 paying founders at ~$250 avg = $10K.**
Students remain the beachhead for distribution + the mission (generous free + student discount). This IS
the reports' "fewer, higher-ticket, no broad free tier" lesson applied to our thesis — not a pivot.

| Tier | Price | What they get | Polar env var |
|---|---|---|---|
| **Free** | $0 | Validate + build + **preview** (the aha). No card. | — |
| **Builder** | ~$49/mo | Self-serve: your crew builds; you operate. Real deploys. | `NEXT_PUBLIC_CHECKOUT_URL_BUILDER` |
| **Operator** | ~$199/mo | Crew **builds AND runs** it (operating loop, GTM drafts → your desk, weekly reports). | `NEXT_PUBLIC_CHECKOUT_URL` (operator) |
| **Concierge** | ~$499/mo | Done-with-you: crew + founder oversight run your company hands-on. | `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER` |

Student discount (≈50% w/ `.edu`) on Builder/Operator. Billing rails already exist (`lib/engine/billing.ts`
multi-tier Polar, `entitlements` table). Today's gate is **binary** (entitled→build); slice A adds
tier-awareness.

## Founder-only actions (I can't do these — surfaced now so they run in parallel with my builds)
1. **Create 3 Polar products** ($49 / $199 / $499 recurring monthly) → copy the 3 checkout URLs → set them as
   Vercel Production env vars (`_BUILDER`, operator `NEXT_PUBLIC_CHECKOUT_URL`, `_FOUNDER`). **This flips charging on.**
2. **Post** the launch/distribution assets I draft (PH, Show HN, Reddit, LinkedIn, campus). Founder-led.
3. **First 5 founder conversations** (Mom Test) — real demand signal before scaling outreach.

## My build slices (each QA-gated: tsc + tests + build + smoke; ship = git HEAD → prod)
- **A — Tier model + pricing page.** `/join` shows the 4 tiers; add `tierOf(plan)` + feature gates
  (Operator unlocks the operating loop; Builder = build only). Fail-soft: renders + routes to
  waitlist/founding-member until checkout URLs are set. Files: `entitlement.ts`, `billing.ts`, `app/join`.
- **B — Free lead-magnet ("engineering as marketing").** Sharpen the free *validate idea → see your AI crew
  + a real build preview* as the top-of-funnel magnet with a **shareable result** (viral loop). Reports'
  #1 organic channel (SiteGPT/Sleek).
- **C — Distribution kit (drafts).** PH launch, Show HN, 3 Reddit posts (r/SaaS, r/Entrepreneur, founder
  subs), 5 LinkedIn posts, cold-email templates for founders, Northeastern campus outreach. → founder posts.
- **D — Activation + retention loop.** Onboarding to first "aha" (built preview) in <10 min; day-7 / day-21
  founder check-in emails (Resend); weekly value email ("your crew shipped X"). Founder-gated sends.
- **E — Revenue/KPI board.** PPU, MRR, activation %, free→paid, churn, CAC — honest, no vanity. Wire the
  $10K goal + weekly review trigger. (Mostly exists — funnel/growth/analyst.)

## 60-day cadence (compressed from the reports)
- **Wk 1:** slice A + B live; founder creates Polar products → **charging ON**; 5 founder convos.
- **Wk 2:** public launch (PH/HN/Reddit) + campus push; onboarding→first-aha; slice D.
- **Wk 3–4:** content (2 blog + daily LinkedIn), cold outreach to founders, referral incentive; ~10 paying.
- **Wk 5–8:** double down on what converts; weekly funnel review + pivot; retention loop; aim 30–40 paying.

## KPIs (weekly, PPU-anchored)
PPU · MRR (goal $10K by day 60; interim $3K by day 30) · activation (% reaching a built preview) ·
free→paid conversion (target ≥3–5% of activated) · churn (<5%/mo) · CAC (~$0 organic). Rising churn or
flat activation → founder review.

## Playbooks backing this
Levels+Walling ship→revenue [[founder-playbook]] · NU beachhead / narrow ICP [[nu-beachhead]] · conversion
gating value-before-capture [[conversion-gating-playbook]] · PPU north-star [[positioning-and-ppu]] ·
no-fake-proof [[crack-audit-and-no-fake-proof]].
