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
- **A ✅ SHIPPED — Simplified 4-tier pricing page.** `/join` shows Free/Builder/Operator/Concierge, one
  screen, Operator "Most popular", fail-soft CTAs (Polar checkout when env vars set, else waitlist).
- **A.2 ✅ SHIPPED (foundation) — Tier model.** `entitlement.ts` `tierOf`/`tierUnlocksOperate` (tested,
  fail-open) + `getEntitlement` returns tier. **Live operate/money-gate rewire DEFERRED** until the founder's
  Polar products exist (real `plan` strings) so it can be verified end-to-end — then wired.
- **B ✅ SHIPPED — Free "Idea Scorecard" lead magnet (`/score`).** No-signup; real validate engine → glass-box
  verdict (score + evidence + crew) on one screen; shareable `/score?idea=…` link + OG image; CTA → build.
- **C ✅ DRAFTED — Distribution kit.** docs/DISTRIBUTION-KIT.md: ready-to-post PH / Show HN / Reddit ×3 /
  LinkedIn / cold-email / Northeastern campus copy, honest + `/score`-led. → **founder posts.**
- **D ✅ SHIPPED — Activation + retention emails.** lib/engine/lifecycle-email.ts: welcome/day7/day21
  templates + pure `dueLifecycleEmails` selector (tested). Cron sends them DORMANT behind LIFECYCLE_EMAILS=1
  + RESEND + migration 0025 (lifecycle_sends). Founder enables → sends activate. Outward sends founder-gated.
- **E ✅ SHIPPED — MRR → $10K on the founder board.** /api/metrics returns list-price `mrr` + `goal`;
  /house/board shows an MRR block + $10K 60-day progress bar under the PPU North Star (PPU stays the North
  Star; MRR never conflated). Needs METRICS_SECRET to unlock (founder-set).

## Founder switches to flip things live (all founder-side, all reversible env vars)
`NEXT_PUBLIC_CHECKOUT_URL_BUILDER` / `NEXT_PUBLIC_CHECKOUT_URL` / `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER` (charging on)
· `METRICS_SECRET` (board) · `RESEND_API_KEY` + `RESEND_FROM` + `LIFECYCLE_EMAILS=1` + apply migration 0025
(retention emails) · confirm A.2 live tier-gate wiring once the 3 Polar products exist.

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
