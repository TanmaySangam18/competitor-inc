# ADR-0023 — The SEO Factory: pillar + 15, behind an honesty gate

**Date:** 2026-07-23 · **Status:** accepted · **Origin:** Ploy.ai teardown + task #76 (AI SEO pipeline)

## Context

Ploy Web proved the agent-run SEO/landing factory sells. Task #76 ("pillar + 15 subtopic articles,
honesty-gated") had the same shape queued for months. The danger of copying Ploy naively: an SEO
factory without a truth wall is a **fabrication factory with distribution** — invented stats compound
in search results. We also explicitly refuse Ploy Grow's visitor de-anonymization → outreach motion
(own-opted-in-audience rail; see the teardown memory).

## Decision

`lib/core/seo-factory.ts`, pure and $0:

- **`planCluster(topic)`** — one pillar + exactly 15 supporting pieces across fixed editorial angles
  (what-is, how-to, cost, alternatives, checklist, …). Deterministic: planning is structure, not
  cognition; drafting happens inside an org-run where the model key lives.
- **`honestyGate(article)`** — the wall every draft passes BEFORE the pipeline ships it:
  - the AI byline (`AI_BYLINE`) is appended when absent — disclosure is not optional;
  - receipt-less claims are **violations that block**: audience stats (N users/customers), money
    claims ($X revenue/saved), testimonials — each must cite `[receipt: …]` in its own paragraph;
  - superlatives/guarantees ("guaranteed", "#1", "world's best") block regardless of receipts.
- **`draftBrief(item, company)`** — the drafting prompt carries the rails inside it, so even the
  writer step knows the gate it must pass.

Execution path: the **seo-sprint playbook** (ADR-0022) compiles this into a loop objective; articles
ship through the standard pipeline (build → review → deploy → receipt). No new blog surface was added
— publishing lands on the product the pipeline already ships (platform-consolidation rule: displace,
don't sit beside).

## Consequences

- Task #76 is live as a bounded, testable core + playbook — not a content sludge machine.
- A blocked draft is fixed or dropped, never quietly published; violations name the exact claim.
- Gate patterns are deliberately conservative; false positives cost a rewrite, false negatives cost
  the brand. Extend patterns before loosening them.
