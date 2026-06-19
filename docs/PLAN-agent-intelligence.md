# Plan — Polsia scorecard, the real mission, and making the agents smarter

> Reads "what does X do" as **post-launch/real behavior** (founder's standing rule). Honest by design —
> same standard we hold the user's ideas to at the Validation Gate. Companion to
> [`COMPETITIVE-polsia.md`](COMPETITIVE-polsia.md) and [`PLAYBOOK-revenue-10k.md`](PLAYBOOK-revenue-10k.md).

---

## 1 · Polsia scorecard (out of 10)

| Question | Score | Why |
| --- | --- | --- |
| **How identical are we?** (vision/category) | **7 / 10** | Same premise: AI agent crew builds + runs your company, nightly autonomous loop, live activity feed, Claude-based, oversight. Same shape. |
| **How identical?** (what it *does today*) | **3 / 10** | They execute for real (deploy, ads, Stripe) at $10M ARR; we simulate the execution. |
| **How different are we?** (philosophy) | **8 / 10** | Genuinely different bet: validate-first (they build blind), Glass-Box *verifiable* proof, auto-refund on failure, human-in-the-loop approval, **0% revenue share vs their 20%**, own-your-data. |
| **How advanced are we vs them?** (today) | **3 / 10** | We're ahead on UX/craft + the trust architecture; behind on the hard part — real autonomous execution, integrations, and scale/traction. |

**The honest read:** we **win on trust, design, and honesty**; we **lose on real execution, scale, and
traction**. Our entire edge is counter-positioning on the trust gap that's giving Polsia a 2.1/5
Trustpilot — and that edge only becomes real once Phase 1–3 (real, *verified* execution) ships.

---

## 2 · The challenge: "build a company as big as Anthropic in 3 months on $100?"

**Straight answer: no — and no tool can, Polsia included.** Company *scale* like Anthropic is a function
of capital (billions), compute (massive), frontier research, distribution, talent, and years of time.
An agent system doesn't conjure those from $100. Believing otherwise is exactly the over-promise that
earned Polsia its trust problem — and we are the *honest* one.

**But here's the winnable version of the challenge** (reframed through the founder playbook —
default-alive, validate-first, smallest real thing):

> With **$100 and ~3 months**, competitor.inc (once real) can realistically: **validate an idea → ship a
> real MVP → get the first paying customers → drive toward the founder's actual goal, ~$10K MRR.**

That's not a consolation prize — it's the only thing that matters at this stage, and it's genuinely
achievable. "Be Anthropic" is the wrong yardstick; "**default-alive + $10K MRR + a product people pay
for**" is the right one (and is the founder's own go/no-go).

**The $100 math (real mode):**
- Inference: **~$0 marginal** (BYOK / cheap frontier models — our deliberate design).
- Hosting: **$0** (free tiers). Domain: **~$12**.
- Leaves **~$85** for a small **paid ad smoke-test** → real impressions, real clicks, real signups.
- Outcome either way is a *win*: strong signal → build; weak signal → you saved months and $99k, pivot.
  That's "Prove it before you build it," applied to the founder's own $100.

---

## 3 · Is ML needed? Is Agentic AI needed?

- **Agentic AI — YES, it's the whole engine of "going real."** Plain definition: LLM agents that
  **plan → act via tools → observe → verify → loop**, with human-approval gates. Going real = giving the
  5-agent crew real tools (GitHub, deploy, ads, email, Stripe) inside that loop. This *is* Phase 1–3.
- **Custom ML training — NO, not now** (and a money-trap on $100). The reasoning comes from **frontier
  LLMs via API**; we don't train models, we **orchestrate them well**. Most "AI company builders"
  (Polsia included) are agentic orchestration over frontier models — not custom ML.
- **A learning-from-data layer — LATER, and it's a moat, not a prerequisite.** Once real shifts produce
  real outcomes (which ads convert, which experiments win), a lightweight ranking/learning layer can make
  the agents prioritize what works. This is the "accumulating data" power (7 Powers) — add it once there's
  data, not on day one.

**Verdict: go hard on agentic AI now; skip custom ML; bank the learning layer as a later moat.**

---

## 4 · How the agents get smarter "as we go" (the intelligence roadmap)

Proven agentic patterns (Anthropic's "build simple, composable agents"; ReAct reason+act; reflection;
orchestrator–workers). Sequenced cheapest-first:

1. **Tool use (function calling)** — agents take *real* actions (deploy, open a PR, draft+place an ad,
   send email, create a Stripe product). The single biggest jump from "talks" to "does."
2. **Plan → act → verify loop** — an action is only `done` if its proof artifact is *verified* real
   (URL returns 200, commit exists). Else auto-refund. This is the trust moat, codified.
3. **Memory** — per-company context that persists across nights (decisions, what worked) — matching the
   "retains context" feature Polsia's CEO-agent is praised for.
4. **Orchestration** — a planner/CEO agent (Apex) decomposes a goal and assigns specialists; workers run
   in parallel; results are merged. Keep it simple before clever.
5. **Learning from outcomes** — feed real metrics back so agents weight high-converting moves up. (The
   only place lightweight ML/heuristics earn their keep.)
6. **Guardrails everywhere** — Approval Inbox for consequential actions, budget caps, SSRF guard, verify-
   before-done. Smarter agents make guardrails *more* important, not less.

**Playbooks driving the decisions:** Levels (ship small, validate, default-alive) · Walling (niche, price,
churn → $10K) · 7 Powers (counter-position + data moat) · agentic-AI best practice (simple, verifiable,
human-gated loops).

---

## 5 · Recommended next move (Levels lens: smallest real thing that proves the edge)

**Phase 1** — turn on a real model + **one** real, *verifiable* action (GitHub build → real commit/PR) +
**verify-before-done**. It converts our trust *story* into trust *fact* and is the cheapest proof that
beats Polsia where it's weakest. Needs only a model key + a GitHub token from the techie friend.

*This plan is high-level on purpose — it's the map. Each phase becomes its own scoped build.*
