# docs/ — what's here (and what you actually need)

**Just deploying the app? You don't need anything in this folder.**
Follow [`../launch/runbook.md`](../launch/runbook.md) (~30 min) plus the main
[`../README.md`](../README.md) → "Run it locally" section. That's the whole job.

## Canonical docs (the current truth — start here)

| Question | Canonical doc |
|---|---|
| What features exist, and are they real or stub? | [`FEATURE-LEDGER.md`](FEATURE-LEDGER.md) |
| What's wired end-to-end in PROD right now? | [`INTEGRATION-AUDIT.md`](INTEGRATION-AUDIT.md) |
| What do we build next, in what order? | [`NEXT-BLOCKS.md`](NEXT-BLOCKS.md) |
| The revenue plan + pricing ($39/$299/$499)? | [`PATH-TO-10K.md`](PATH-TO-10K.md) |
| The next-dollar plan + founder unlocks? | [`REVENUE-RUN.md`](REVENUE-RUN.md) (north star = **PPU**) |
| Polsia facts (funding, ARR, churn — verified)? | [`intel/polsia-deep-dive.md`](intel/polsia-deep-dive.md) |
| Codebase health / duplicates / debt? | [`CONSOLIDATION-AUDIT.md`](CONSOLIDATION-AUDIT.md) |
| The 28-block master build plan (status-tracked)? | [`MASTER-PLAN.md`](MASTER-PLAN.md) |
| Ads / Meta Pixel phase 2 (gated on 3+ customers)? | [`PLAN-REVENUE-LOOP-PHASE2`](PLAN-revenue-loop-phase2.md) — budget = founder-approval-only |
| Demoing from a laptop? | [`DEMO-RUNBOOK.md`](DEMO-RUNBOOK.md) |
| Turning on real auth + database? | [`SUPABASE-SETUP.md`](SUPABASE-SETUP.md) — run ALL migrations 0001–0013 |
| GTM agent design (Blond frameworks)? | [`BLOND-GTM-AGENT.md`](BLOND-GTM-AGENT.md) · Lockin launch: [`LOCKIN-LAUNCH-KIT.md`](LOCKIN-LAUNCH-KIT.md) |

## Background & strategy (still-valid thinking)

[`AUTONOMY.md`](AUTONOMY.md) · [`AUTONOMY-AUDIT.md`](AUTONOMY-AUDIT.md) · [`POSITIONING.md`](POSITIONING.md) ·
[`COMPANY-BLUEPRINT.md`](COMPANY-BLUEPRINT.md) · [`THE-NEW-GAME.md`](THE-NEW-GAME.md) ·
[`LAUNCH-PLAYBOOK.md`](LAUNCH-PLAYBOOK.md) · [`DESIGN.md`](DESIGN.md) · [`CHATOPS.md`](CHATOPS.md) ·
[`ROADMAP-V2.md`](ROADMAP-V2.md) · [`LLM-ENGINE-COMPARISON.md`](LLM-ENGINE-COMPARISON.md) ·
[`QA-REMEDIATION-LOG.md`](QA-REMEDIATION-LOG.md) · [`FOUNDER-PLAYBOOK.md`](FOUNDER-PLAYBOOK.md) (private)

## Historical / superseded (banner at the top says what replaced each)

Kept as decision history — do NOT follow their numbers or instructions:
`ROADMAP.md` (→ NEXT-BLOCKS) · `GO-LIVE.md` (migration list was stale; fixed in place) ·
`FEATURE-INVENTORY.md` (→ FEATURE-LEDGER) · `HANDOFF.md` (handoff done) · `MONEY-PLAN.md`,
`PLAYBOOK.md`, `PLAYBOOK-path-to-10k.md`, `PLAYBOOK-revenue-10k.md`, `PLAN-beachhead-and-launch.md`
(→ PATH-TO-10K; "$99 Founding" tier is dead) · `GROWTH-MODEL.md`, `MASTER-CHECKLIST.md` (goals → PPU) ·
`COMPETITIVE-polsia.md`, `COMPETITIVE-landscape.md`, `POLSIA-DECODE.md`, `POLSIA-PLAYBOOK-DECODE.md`,
`FOUNDER-JOURNEY.md` (Polsia numbers → intel/polsia-deep-dive.md) · `BUILD-IN-PUBLIC.md` (motion
abandoned: big-bang launch) · dated point-in-time audits (`AUDIT*.md`, `STRESS-TEST.md`,
`SECURITY-REVIEW.md`, `FUNNEL-AUDIT.md`, `AGENT-AUDIT.md`, `SPRINT-AND-STRESS-TEST.md`).
