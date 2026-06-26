# Plan — Deep-tech & autonomy: the "agents take over on key-set → signups → $10K" roadmap

> Internal. The founder's vision: a **highly agentic, near-autonomous** company-builder where the in-house
> crew takes over the moment keys are set, makes competitor.inc a talked-about name, brings in signups, and
> reaches **$10K/mo**. This doc is the honest technical roadmap + a gap analysis to get there.

## 0 · Two honest reframes first (so we build the right thing)

**"1% human interference" ≠ "no human."** Our entire wedge is human-in-control (the Approval Inbox) — the
exact thing the burned-by-Polsia crowd wants. So "1%" must mean **1% of the *labor*, not 1% of the
*control*.** The agents do ~99% of the *doing*; the founder does ~1% — the **judgment + approvals** on the
consequential, irreversible moves. That's the **autonomy ladder's winning rung** (high work-autonomy,
human-approved consequences). Pitch it as: *"the most autonomous AI company-builder that's still
accountable to a human."* Autonomy **and** control — not autonomy vs control.

**"Deep tech" — honestly.** competitor.inc isn't hard-science deep tech, and **we should not train our own
models or add ML for show** (expensive, not the moat). The *defensible, technically-deep* story is:
a **proprietary multi-agent orchestration** + **a learning loop on real outcome data** (which agent
actions / playbooks actually produced signups & revenue → the system gets better at generating crews) +
**persistent private memory per company**. That's a genuine data + orchestration moat — investor-credible,
and it compounds — without burning cash on model training.

## 1 · The stack to make it genuinely agentic + autonomous

| Layer | Tech | Why |
|---|---|---|
| **Reasoning** | Claude (Opus/Sonnet/Haiku) via the multi-provider engine; free-tier (NIM/Groq) + WebLLM for $0 tiers | already wired; routes by moment |
| **Real coding agent** | **Claude Agent SDK** for Forge (real repos, tools, iterate) | makes "it builds real products" literally true |
| **Per-company crew** | **dynamic + persistent + private specialist generation** (see PLAN-dynamic-agents.md) | the "run any company" engine; the differentiator |
| **Memory / RAG** | **Supabase `pgvector`** — embeddings of each company's history, docs, decisions | agents recall context + get sharper over time (private per company) |
| **Tools** | **MCP** integrations (the agents' hands) + the gated execution layer | real actions, approval-gated |
| **Autonomy loop** | a **scheduler/cron** running the nightly shift + continuous re-validation (friend's fork has the start) | the agents "take over" and keep working |
| **Trust / evals** | **observability + evals** (LangSmith free tier or Langfuse OSS) on every agent run | you can trust autonomous actions; catch drift |
| **The moat** | an **outcome-learning loop** — log which actions/playbooks drove signups+revenue, feed it back to improve crew-generation | compounding data advantage; the "deep tech" story |

**Don't build:** your own LLM, bespoke ML models, anything that adds "AI" without moving signups/revenue.

## 2 · Gap analysis — what's missing / to change to hit "$10K on autopilot"

**Missing (build, in priority):**
1. **The autonomous operating loop** — the scheduler that runs the crew's nightly GTM + ops tasks on its
   own (gated by approval). Partially present (cron heartbeat + continuous re-validation on the fork); needs
   the full "crew takes over" loop wired to real channels.
2. **The dynamic-crew engine** (PLAN-dynamic-agents.md) — bespoke persistent private crew per company.
3. **Persistent agent memory** (pgvector) — so the crew learns the company and improves.
4. **The real demand-test loop** — live page + real ads/organic + real signups + measured verdict (so the
   gate earns "real," not just "AI estimate").
5. **Distribution wiring** — Bluesky posting ✅ built; add SEO/content generation + the **viral waitlist +
   referral loop** (the engine that actually brings the 2,000 signups); ads-exec ✅ gated.
6. **Evals/observability** — before trusting autonomous public actions.

**To change / be honest about:**
- Keep the **Approval Inbox** — do **not** remove it for "full autonomy." It *is* the wedge. "1% human" =
  fast approvals, not zero.
- The gate stays **"AI estimate"** until the real demand-test loop exists (honesty).
- Consider gating **Operate-on-by-default** for v1 (onboarding clutter).
- The trust-spark (cold DMs, HN/Reddit) stays **human** — agents can't authentically cold-start (spam/bans).
  So "$10K via agents" = agents carry the scalable ~85%; the founder does the ~15% trust/judgment.

## 3 · The honest verdict on the two goals
- **"Agents take over on key-set → signups → $10K":** achievable for the *scalable* work (content, SEO,
  ads-exec, the waitlist/referral loop, support, measurement) once items 1–5 ship + keys are set — with the
  founder still doing the irreducible trust-spark + approvals. The leverage ratio (what % the agents carried)
  is the real proof.
- **"A talked-about name in Boston / anywhere":** that's *distribution + a shareable story* (the honesty
  reveal), executed founder-led + agent-scaled — not a tech feature. Build the autonomy; *earn* the talk.

## 4 · Sequence (post live-reconcile)
real demand-test loop + waitlist/referral engine → autonomous operating loop → pgvector memory → dynamic-crew
engine → evals + the outcome-learning loop (the moat). Each gated, approval-first, honest.
