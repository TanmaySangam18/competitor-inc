# Next Blocks — ordered roadmap (2026-06-30)

**Ordering playbook: Sam Blond's demand-first prioritization** (the most successful operator in this
exact space — CRO who scaled Zenefits $0→$70M and Brex $0→$400M; full sourced brief in
`scratchpad/sam-blond-brief.md`). His ranked rules drive the order below:

- *"Demand is the bottleneck, not conversion — focus on demand until you have too much."* → demand work before funnel polish.
- *9 Easy Sales Concepts*, where he flags **#2 demand** and **#9 obsess-over-implementation** as highest-impact, and **#5 "distribution is as important as the announcement."**
- *"Only blast after brand recognition"* → real cold-send infra comes late, after warm channels + brand.

Meta-frame (standing): **Levels** (ship fast, charge) + **Walling** (revenue → $10K MRR). Goal anchors:
**one company clearing $1,000** (the validation), measured in **PPU — Proven Paying Users** (the locked
north star, per REVENUE-RUN.md / the positioning decision; signup counts are an input, never the goal —
the earlier "10,000 signups" anchor here is retired).

Legend: ⛔ founder-blocked · 🟢 buildable now · 🔬 needs a go/no-go · ✅ done

---

## B0 — Founder unlocks (do in parallel, NOW — they gate everything downstream)
*Blond: remove the constraint first. Our revenue constraint is work-auth, not product; our demand
instrumentation needs Supabase live.*

- ⛔ **OPT / EAD application** — the single unlock that turns the working checkout into banked revenue. ~60-day window.
- ⛔ **Delete the broken GitHub PAT** (github.com/settings/tokens?type=fine-grained) — security hygiene.
- ⛔ **Email Prof. Theo** — draft ready.
- ⛔ **Confirm Supabase keys in prod** — lights up the live signup counter (>0), the feedback widget, and the real `/live` data. Without it, the demand instrumentation reads zero.
- ⛔ **Decide the $99 "founding seats" question** — keep it (add to BOTH pricing surfaces) or kill it (already removed from settings). Pricing must be one truth everywhere.

## B1 — Make demand measurable: GTM P2 — Growth Analyst ("Gauge") 🟢
*Blond #2, highest-impact: track **new opportunities created / week**. P1 named the bottleneck; P2 makes
the North Star a live number.*

- New-opportunities-per-week tracker + conversion-rate-by-channel, fed from the activity log.
- Bottleneck-over-time (does the demand→conversion call change as nights run?).
- Surfaces a weekly "what's the constraint + what to do" brief in the Glass Box.

## B2 — Distribution & the surprise launch 🟢 (+ ⛔ founder go-signal)
*Blond #5: "distribution is as important as the announcement." Founder-playbook: big-bang SURPRISE
launch, not build-in-public.*

- Final full-app QA sweep (the deferred unified-header pass can ride here).
- Execute the launch-venue stack **in evidence order** (from the GTM brief): niche subreddits → Show HN → directories (BetaList/Uneed/etc.) → **Product Hunt last** (after a launch-day list).
- Each venue post drafted by the crew, **founder posts + does live replies** (human-only by rule).

## B3 — Convert & retain: GTM P3 — CRM Architect ("Ledger") + CS lifecycle 🟢
*Blond #9, highest-impact: "obsess over implementation — the first 30 days determine LTV/churn." Only
worth doing once demand is flowing (B1/B2).*

- Pipeline stages + scoring thresholds + workflow automations (stage transitions, tasks, reminders).
- First-30-day implementation checklist per new customer (Guard/CS) with churn-risk flags.
- *Dependency: a lightweight CRM data model (new tables) — confirm before touching the schema.*

## B4 — Real-world actions: GTM P4 + social + ownership 🔬
*Blond: "do not blast people who've never heard of you" — real outbound infra comes AFTER brand +
warm channels. Gated on founder accounts + a cost/ToS go/no-go.*

- ⛔ Connect real X / LinkedIn accounts (the #1 open distribution crack) — founder-supplied.
- 🔬 Real send integrations (email/LinkedIn) behind the existing approval gates.
- 🔬 Enrichment + trigger data (funding/intent signals) for the cold tier.
- **Ownership verification** for imported products (operate-for-real, not just audit).

## B5 — Polish & scale 🟢 (lowest demand-impact — Levels: ship core first, polish after users)
- Unified site-wide header component (BUG-04 + nav consistency) — if not folded into B2's QA sweep.
- Move "Re-test demand" + "Draft blitz" into a secondary actions menu (dashboard density) — A/B with real users.
- BUG-20: playbook "coming soon" notify capture.
- GTM comp/quota + hiring-scorecard module (for customers scaling a real sales team).

---

## Done this session (for reference)
- ✅ Sprint 1: revenue blocker (billing→Polar), pricing consistency, reset-freeze, silent-validation fixes.
- ✅ Sprint 2: signup validation, /live clickable proof, integration connect paths, deep-link, demo buttons.
- ✅ Sprint 3 (low-risk): nav CTA consolidation, icon-only feedback button.
- ✅ GTM **P1 MVP**: encoded GTM plan (ICP concentric circles + source-quality channels + demand
  bottleneck) live in the dashboard, verified in preview.

## The critical path, in one line
**B0 (unblock) → B1 (measure demand) → B2 (launch + distribute) → B3 (convert + retain) → B4 (scale outbound) → B5 (polish).**
Everything in B1–B3 is buildable now; B0 and the B4 connections are the founder's to unblock.
