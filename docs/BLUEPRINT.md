# competitor.inc — Living Blueprint

**Status:** living document. Owned by the founder + the loop-partner (Claude). Scout 2 promotes items
into the backlog here weekly. Last major revision 2026-07-02.

**One line:** the AI co-founder that **proves an idea before you build it, and proves what it earned
after.** Validation-first at the front, verifiable-revenue-proof at the back — the two things every
rival skips.

---

## 1. The positioning (Dunford)

- **To founders:** "Prove it before you build it. Prove what it earned after."
- **To cohort owners (accelerators, university E-centers, studios):** "A validation lab for your whole
  cohort — plus evidence of outcomes for your funders."
- **The category truth (verified 2026-07-02 across Polsia, Paperclip, Guildly, Appy, Cofounder):**
  everyone governs *spend and process*; nobody governs *truth* (should this be built?) or *outcome*
  (did it make money?). Agent execution is commoditizing fast (Paperclip ~72k⭐ OSS). **Provable
  outcomes are the scarce asset. That axis is ours and it is still empty.** Stop headlining the
  orchestration/crew layer — it is now a red ocean.

## 2. The moat (what we protect and deepen)

1. **Validation Gate + Demand Radar + Mom-Test kit** — honest go/tweak/kill before any code.
2. **Verifiable proof** — proof-of-work standard (live URL / passing build / real metric), the
   Revenue Loop's experiment ledger, and now **attribution** (which marketing made money).
3. **The honesty invariant** — every number carries a basis (real/estimate/missing); we never
   fabricate a signup, a receipt, or a ROAS. Property-tested in code. This is existential brand.
4. **Human governance** — the policy engine + Approval Inbox; money never runs unattended (founder
   directive, enforced by tests).

## 3. Target market (fastest realistic path to $10K MRR)

**Beachhead = cohort owners**, not universities-as-such and not self-serve. Math: 5 × $2k/mo = $10k;
self-serve would need ~8k signups in 8 weeks with no budget (a lottery). Cohort owners have budgets,
aggregate our ICP (first-time founders), and — uniquely — need *outcome evidence for their funders*,
which only our proof layer produces. Northeastern is warm deal #1 of a repeatable segment, not the
market itself. **F1/OPT reality:** build the machine + fill a committed pipeline now; flip revenue
when work authorization lands (confirm timing with DSO — I-765/EAD, not just the I-20).

## 4. Pricing (blended, learned from the market)

| Tier | Price | Role | Learned from |
|---|---|---|---|
| Validate | $0 | PLG top-of-funnel, never paywalled | us |
| Operator | $39/mo | self-serve build-with-crew | us |
| Founder | $299/mo | done-with-you, limited slots | Polsia concierge |
| Validation Sprint | $499 once | costly-ask wedge / agency white-label | Mom Test |
| **Cohort Lab** | **$1.5–2.5k/mo** | 25–100 seats + program-director evidence dashboard — the $10K vehicle | new |
| Credit packs | $10–50 | à-la-carte extra tests/radar/shifts | Polsia (~½ their rev is non-sub) |

## 5. What to adopt from each "university" (patterns/ideas only — never assets)

- **Polsia** — instant "oh-moment" onboarding; public live dashboard as marketing (ours honest by
  construction); credit packs; founder-story PR. (Counter: their auto-act + fabricated-reviews + churn.)
- **Paperclip** — open-source as $0-CAC distribution (ship one sharp OSS tool → "powered by" funnel);
  BYO-agent humility (sit *above* orchestrators as the validated-goal + proof layer, don't out-plumb).
- **Guildly** — plan-first → one-click-approve UX polish (we have it; theirs is cleaner).
- **Appy** — live where the buyer works (Telegram now, Slack for programs); $X free credits trial.
- **Replit** — code ownership as visceral trust proof (shipped: "Open your code").
- **Cofounder** — validate-before-build as the explicit foil to their build-first.

## 6. Attribution & marketing intelligence — DECISION: core, reframed (2026-07-02)

Triggered by a live prospect wanting organic-marketing intelligence + broader attribution (which
campaigns made money, ROAS, ROI, channel performance, scale/pause calls, paid+organic over time).

**Verdict: YES, core — but it is the reporting view of the Revenue Loop, not a new product.** We
already capture `source` on every event and real amounts on every Polar row. Attribution is the
per-channel rollup + honest verdicts on top. It *strengthens* the moat (it is literally "which
marketing made money" = provable outcome), and it is our wedge for this prospect.

**Shipped this session (real, tested):** `lib/engine/attribution.ts` (pure, 9 tests) — classifies
sources into channels, computes per-channel view→signup→conversion (REAL from pixel), verdicts
(scale/optimize/pause/watch), ROAS/ROI when spend connected; `/api/attribution` (aggregates only, no
PII); AttributionPanel in the Growth tab with a labelled EXAMPLE mode for demos + honest empty state.

**The honesty guardrail (non-negotiable):** organic attribution (channel→signup→conversion) is REAL
today with zero ad spend and zero F1/budget exposure. **ROAS/ROI require ad-spend data = Phase 2
(Meta Marketing API), which is founder-approval-gated and only after 3+ real customers ask.** We show
what the pixel truly sees now and mark money legs "missing" until an account is connected — we never
invent a ROAS. This is exactly the honesty that beats the ecommerce attribution incumbents (Triple
Whale/Northbeam) for the *founder* buyer who has no analytics team.

**Demo framing for the prospect:** "Organic attribution is live and real from our first-party pixel —
here's which channel converts. ROAS/ROI light up the moment you connect an ad account; we'll never
show you a return we can't prove." Then toggle the labelled example to show the full paid+organic shape.

## 7. Operating mode — loop-partner + two scouts (live)

- **Loop-partner (Claude):** treat every plan as a living system — question assumptions, surface the
  highest-impact next move, refine without waiting for prompts. This doc is the shared state.
- **Scout 1 — Market & Competitor Intelligence** (scheduled Mon/Wed/Fri 8am): public-only monitoring of
  rivals' features/pricing/positioning/launches + one new entrant + cost/architecture patterns →
  `docs/intel/scout-reports.md`, one recommendation per run.
- **Scout 2 — Product & Innovation Builder** (scheduled Sat 9am): reads Scout 1 + this blueprint, pulls
  1–2 adjacent-industry lessons, re-ranks top-3 next moves by (value×impact)/effort, challenges one
  assumption → `docs/intel/roadmap-scout.md`; recommends, never builds. Money/ads items always flagged
  founder-approval-gated.

## 8. Backlog (Scout 2 maintains; founder prioritizes)

- Program-director evidence dashboard (Cohort Lab) — re-skin of the House board for cohorts.
- Open-source lite tool for $0-CAC distribution (Mom-Test kit generator or Demand Radar lite).
- Cohort-owner target list (100) + outreach drafts → Approval Inbox.
- Attribution Phase 2: Meta Marketing API reader → real ROAS (gated: 3+ customers + founder approval).
- Site scroll/wayfinding polish (progress + scrollspy) if it still reads long after the redesign.

## 9. Standing guardrails (do not violate)

Never fabricate signups/revenue/receipts/ROAS. Money never auto-runs (founder approval always).
Public-info-only competitive research. Every feature ships with its backend-dependency list (implemented
vs stub). Name the playbook behind each decision.
