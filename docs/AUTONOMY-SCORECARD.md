# Autonomy Scorecard — how "% autonomous" is actually measured

_Purpose: turn "how far are we?" from a vibe into a governed metric. Ten dimensions of a real autonomous
company, each scored 0–100% with **file-level evidence**, weighted (the hard muscles count double), and a
concrete path to 90%. Updated 2026-07-05. This is the honesty spine of the "% autonomous" claim — we score
ourselves the way we'd want a customer to be able to audit us._

## Two numbers, kept separate (this matters)
- **Machine built (%)** — how much of the autonomous-company *machinery* exists, is wired, and is tested.
  This is what we can move by writing code. **← the number this doc tracks.**
- **Reliably autonomous unsupervised (%)** — how much runs *for days, unwatched, correctly*. This rides
  the **model frontier** and improves largely for free over time; it is NOT something more code alone buys.
  Today, honestly, this is lower than the machine number and gated by model reliability + real integrations.

Conflating the two is how people fake a "98% autonomous" claim. We don't.

## The rubric (weighted; hard muscles ×2)

| # | Dimension | Weight | Score | Evidence |
|---|---|:--:|:--:|---|
| 1 | Agent lifecycle (spawn→work→verify→handoff→terminate, budget refund) | 1 | **85%** | `agent-lifecycle.ts` (+test), state machine + refund |
| 2 | Goal decomposition & supervision (goal→DAG→route→verify→escalate) | 1 | **80%** | `orchestrator.ts`, `supervisor.ts`, `task-queue.ts` (+tests) |
| 3 | Governance spine (5 gates, wallet, approvals, kill-switch, keystone) | 1 | **85%** | `policy.ts`, `wallet.ts`, `app/api/execute` `authorize()` |
| 4 | **Real product build** (idea→code→live URL, with a backend) | 2 | **50%** | `generateSiteFiles` (static + Claude apps), `build-github.ts`, `backend-provider.ts` (SupabaseBackendProvider provisions per-tenant tables). Gap: OpenHands full-app builds not wired |
| 5 | **Long-horizon operation** (scheduled, memory-carry, self-heal) | 2 | **55%** | `app/api/cron` nightly shift (mature) **+ NEW: supervised operating cycle wired to the scheduler** (flag `SUPERVISED_CYCLE=1`), `operating-loop.ts` retry. Gap: cycle execution still simulated; multi-day reliability is frontier-bound |
| 6 | Memory & continuity (recall/remember, night-to-night, knowledge graph) | 1 | **65%** | `memory.ts` (pgvector + recent fallback), `bkg.ts`, wired in cron + cycle |
| 7 | **Connectors / real-world action** (github/email/ads/social/stripe, gated) | 2 | **55%** | `connectors.ts`, `execution.ts` — real executors, all policy+approval gated. Gap: each needs per-company OAuth to run unattended |
| 8 | Company-function coverage (PM/eng/QA/GTM/support/growth/finance/legal/ops) | 1 | **55%** | 6 roles in `types.ts` + `dynamic-crew.ts`; GTM/support/growth = drafts→desk. Gap: finance/legal-assist/ops roles |
| 9 | Cost governance (per-agent routing, spend caps, context compression) | 1 | **65%** | `per-agent-model-routing.ts`, `policy` caps, **+ NEW: `context-compression.ts`** trims context before model calls |
| 10 | Observability & proof (traces, alerts, Glass Box, proof artifacts, audit) | 1 | **60%** | `observability.ts`, `alerts.ts`, `office-audit`, `proof.ts`. Gap: no live "watch the org run" cycle surface |

**Weighted machine-built score (2026-07-05): ≈ 61%** — computed
`(85+80+85 + 50×2 + 55×2 + 65 + 55×2 + 55 + 65 + 60) / 13 = 62.7`, rounded down for honesty on the
simulated-execution caveat in #5. Up from ≈ 53% before this session (this session added #5 cron-wiring
and #9 compression).

> Why higher than the old "~53%" gut number: the codebase gained a real `SupabaseBackendProvider` and a
> mature nightly loop since that estimate. A real rubric finds work the gut under-counted. The **reliably-
> unsupervised** number is still lower and honestly gated — see the top of this doc.

## The concrete path from 61% → 90%
Each item lists what it lifts and **who can do it** — because ~half the remaining gap is NOT more code.

**Code we can write (lifts to ~75%):**
1. **Persist prepared packets → Approval Inbox** so supervised-cycle desk items render on the founder board (#5, #10). _Small._
2. **Wire per-agent context compression into every model call** in `server.ts` (not just the nightly priorContext) (#9). _Small._
3. **Add finance / legal-assist / ops roles** (ripples through the `AgentRole` maps + tests) (#8). _Medium._
4. **A live "watch the org run" surface** reading lifecycle + supervisor outcomes (#10). _Medium._
5. **Implement a second real `BackendProvider` path + wire it into the build** so generated apps ship with real persistence, not just localStorage (#4). _Medium._

**Infra-gated (needs keys/self-host; lifts to ~82%):**
6. **OpenHands wired as the full-app build backend** (`openhands.ts` seam exists) → real multi-file apps, sandboxed, behind verify-before-deploy (#4). _Needs OPENHANDS_API_URL/KEY or self-host._
7. **Per-company OAuth for connectors** so the org acts in real tools unattended (#7). _Needs the OAuth apps + a human clearing each vendor gate once._

**Frontier- & customer-gated (the last ~8%, not pure code):**
8. **Reliable multi-day unsupervised execution** — improves as the models improve; we architected so autonomy widens without re-architecting (#5).
9. **A first real customer + a public verifiable proof** — the thing that turns "machine built" into "trusted and used." This is the launch, not a commit.

## The honest headline
**We can get the *machine* to ~82% with focused build + a couple of keys.** The last stretch to a truly
"90% autonomous company" is earned by the **model frontier improving** and by **real customers running it**
— by design, not by us writing a number into a slide. That restraint is the moat: anyone can *claim* 90%;
we can *show* the scorecard.
