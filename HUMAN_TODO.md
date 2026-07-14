# HUMAN_TODO.md — Founder-Only Items

**Rule for the building agent (me):** I may **APPEND** items here with context and a suggested deadline. I
may **NEVER** mark items done, simulate their answers, or build on assumptions about their outcomes. When an
item blocks work, I say so in the milestone report and work on something else. Every item here is legally or
practically the founder's — money, legal signatures, KYC accounts, real market evidence.

_Last synced to the governing spec: 2026-07-13._

---

## Legal & structural
- [ ] Form/confirm business entity, EIN, registered agent; calendar all annual filings.
- [ ] Lawyer engagement: platform ToS with liability split between platform and customers; Acceptable Use
  Policy sign-off (feeds the abuse-prevention screen, REQUIREMENTS §14 / Tier A4).
- [ ] Liability insurance quote — verify the policy language explicitly contemplates autonomous-agent acts.
- [ ] Designate the backup human: legal authority, system access, sealed hardware key + break-glass copy
  (INFRASTRUCTURE §1, §6).
- [ ] Read the model providers' ToS on autonomous use before Phase 2 activation (at least 2 providers).

## Money & banking
- [ ] Open business bank account (KYC); brief the bank on 24/7 autonomous transaction patterns (fraud-flag risk).
- [ ] Stripe account verification; plan a redundant payment rail.
- [ ] Set initial spend caps and Tier-3 money thresholds (per agent / per task / per day / per customer). _(I
  build the enforcement; you set the numbers — Tier B1.)_
- [ ] Pricing decision: usage-based component + per-customer margin-alarm thresholds.

## Market & customers (do BEFORE first real customer)
- [ ] Talk to 10 potential customers; write down, in their words, why they'd pay for this vs. using an AI
  assistant directly. _(I must never invent these — REQUIREMENTS scope fence.)_
- [ ] Pick the wedge: which customer type / company type the platform serves first.
- [ ] Personally sell and onboard customer #1 (concierge is fine).
- [ ] Draft the wind-down commitment: if the platform dies, how customers export and survive (data-export
  guarantee).

## Crown jewels & accounts (INFRASTRUCTURE §1, §7)
- [ ] Domain purchase + registry lock + hardware 2FA on the registrar.
- [ ] Email domain + SPF/DKIM/DMARC before any agent sends mail.
- [ ] Two hardware security keys acquired; one sealed for the backup human.
- [ ] Stand up the vault BEFORE any API keys are created. _(I build the vault CLIENT; you stand up the vault
  service and hold the unseal keys — Tier D.)_
- [ ] Open model-provider accounts (≥2) and cloud org root, then seal root credentials.

## Standing (recurring)
- [ ] Daily: ~10–30 min review session (digest + exception queue + precedents). _(I build the review UI — Tier D.)_
- [ ] Quarterly: run the break-glass drill in simulation (INFRASTRUCTURE §6). _(I build the drill — Tier A3.)_
- [ ] Quarterly: review tier thresholds — reclassify by track record, never bypass.
- [ ] Annually: filings, insurance renewal, ToS re-review.

---

_Agent-appended items go below this line, newest first, each with: date, why it needs a human, what it blocks._

<!-- APPEND-ONLY BELOW -->
