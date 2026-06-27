# Loop Engineering — deep dive + how it sharpens competitor.inc (2026-06-26)

> A framework that surfaced June 2026 (Boris Cherny — Claude Code's creator; Addy Osmani; Peter Steinberger;
> grounded in Anthropic's "building effective agents / effective harnesses / context engineering" corpus).
> It maps almost 1:1 onto competitor.inc — and tells us exactly where to sharpen.

## The thesis
**"Stop prompting agents. Start building systems that prompt agents."** The progression: prompt operators
(2024) → parallel managers (2025) → **system/loop designers (2026)**. The scarce skill is no longer phrasing
requests — it's **defining what "good" and "done" mean.** Cherny: *"I don't prompt Claude anymore. I have
loops running that prompt Claude… My job is to write loops."*

## The core mechanics
1. **A loop = a generator wired to a verifier — and the verifier is the bottleneck.** The generator (model)
   runs cheaply and repeatedly; the **verifier decides whether output ships or the loop retries**. A weak
   verifier doesn't fail loudly — it *"confidently produces garbage hundreds of times."* So: **never let an
   agent self-verify**; use a **separate, read-only evaluator.** *"Writing the verifier is the new prompt engineering."*
2. **Reliability comes from constraints, not model size.** *"The model is a commodity; the reward function is
   yours."* A closed loop with measurable passes (e.g., Lighthouse ≥95, headline <12 words) converges; an open
   loop without bounds "degrades into slop." Define "done" measurably *before* writing instructions.
3. **The cycle:** discover → plan → execute → **verify** → repeat until a stop condition (+ hard caps like
   "stop after 5 rounds"). Claude Code's **`/goal`** is cited as the completion-condition pattern.
4. **Four compounding ingredients:** **triggers** (cron/webhooks) · **shared file structure** (artifacts /
   **signals** / contracts / logs) · **tools/connectors** · an **agent-ready codebase** (an `AGENTS.md` index
   ~100 lines, a `dev local` script at near-zero token cost, **verifiable** tests).
5. **Compounding multi-loop pattern:** a support loop logs "signals" → an SEO loop reads them and writes content
   → a product loop reads growth signals and prioritizes. Each loop reads/writes the same shared folders.

## How it maps to competitor.inc (and where to sharpen)
| Loop-engineering principle | competitor.inc today | Sharpen → |
|---|---|---|
| Generator/verifier separation; no self-verify | `verifyProof()` (verify-before-done) | Make verification an **independent evaluator role** (Guard/Apex reviews others' work read-only; agents never grade their own) |
| Reward function = the moat | the outcome-learning loop (PLAN-deep-tech-autonomy) | This is literally **our moat** — log which actions drove signups/revenue = the reward function |
| Define "done" measurably | demand-test goal; growth-model KPIs | Bake "define 'done' measurably" into agent responsibilities + the demand-test thresholds |
| Triggers / scheduling | the nightly cron shift | already a loop trigger ✅ |
| Persistence | pgvector agent memory (Block 5) | already there ✅ |
| Tools/connectors | the gated execution layer | already there ✅ |
| Agent-ready codebase | `npm run qa` is our verifier; no index | add a root **`AGENTS.md`** (structure + qa + the gated/approval rules) |
| Stop conditions / `/goal` | autopilot pauses at ≥3 approvals | bounded ✅; can add explicit caps |

## The honesty reconciliation (important)
Loop engineering's "remove the human from doing the work" is about the **work**, not control. The same framework
says **"attach run data to human handoff"** and **"use the least autonomous tool."** So the human becomes the
**high-stakes evaluator/verifier** — which is *exactly* our Approval Inbox. Loop engineering **reinforces** our
human-in-control wedge; it doesn't contradict it. "1% human" = the human is the consequential-action verifier,
and the AI runs the rest of the loop.

## What we do now (this build) vs later
- **Now:** an independent-verifier responsibility in the agents' JDs (generator/evaluator separation) + a root
  `AGENTS.md`. Cheap, high-value, on-brand (verify-before-done).
- **Later (post-keys):** the compounding multi-loop "signals/contracts/logs" system = the autonomous operating
  loop + the outcome-learning reward function (the moat).

## Sources
aibuilderclub.com/blog/loop-engineering-guide-2026 · anthropic.com/engineering/effective-harnesses-for-long-running-agents ·
anthropic.com/engineering/effective-context-engineering-for-ai-agents · anthropic.com/research/building-effective-agents ·
hyper.ai (Loop Engineering paper) · X posts (Cherny / Osmani / Steinberger).
