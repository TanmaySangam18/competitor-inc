# Plan — Dynamic, persistent, private specialist-crew engine

> The "run **any** company inside a **focused** niche" engine. Founder-approved architecture
> (2026-06-24). Resolves the niche-vs-"build & run anything" tension: the niche is the *customer*
> (first-time founders); the **engine** makes the product horizontal across whatever they build.
> **Post-launch build** — this doc is the freeze-safe design. Counter-positions Polsia on every axis.

## The decision
On idea-entry, the system **generates a bespoke specialist crew for that one company**, that crew
**persists and accumulates private memory** to run the company over time, **ephemeral sub-agents** handle
one-off tasks, and **everything is private to that user**. Not 5 fixed generic agents — a crew shaped to the
company.

## How it works
1. **Generate per company (template-fill, not free-form).** Read the idea → classify its domain → produce a
   crew by filling the proven **`AGENTS` template** (`lib/roomie/types.ts` + `lib/roomie/delegation.ts`) with
   domain specifics (e.g., a SaaS idea → onboarding/churn specialist; an e-com idea → ads/fulfillment
   specialist). Template-fill (not open-ended generation) keeps it reliable + on-brand. Reuse per-agent
   **model routing** (strong model for strategy/codegen, cheap for routine).
2. **Persist + private memory.** The crew + its memory live **per company, scoped to that user** — reuse the
   friend's **Supabase write-through sync** (`lib/roomie/sync.ts`). Memory compounds (the crew gets sharper at
   running *that* company) — which is what "run a company" actually needs.
3. **Ephemeral task sub-agents.** For a specific one-off job, spin up a narrow sub-agent → it does the job →
   it dissolves. Keeps the persistent core lean; this is where "dies after use" is correct.
4. **Approval-gated, always.** Consequential actions still route through the Approval Inbox / `/api/execute`.

## Why it wins (counter-position to Polsia)
| Axis | Polsia | competitor.inc engine |
|---|---|---|
| Data | shared across companies | **private to the user** |
| Agents | generic, shared | **bespoke per company** |
| Memory | shared learning | **private, compounding per company** |
| Take | 20% revenue | **0%** |
| Control | act-then-correct | **approval-first** |

## How it slots into the code
- `lib/roomie/types.ts` — a `CrewTemplate` + per-company `Crew` type alongside the static `AGENTS`.
- `lib/roomie/delegation.ts` — a `generateCrew(idea)` that fills the template; keep the static crew as the
  fallback/default.
- `lib/roomie/server.ts` — a model call that classifies the idea + drafts the crew (reuses `callModel` +
  `modelForAgent`).
- `lib/roomie/sync.ts` — persist the crew + its memory per company (user-scoped rows).
- Sub-agents: a thin `runTaskAgent(spec)` that's created + discarded within `runAction`.

## Risks / honest notes
- **Reliability:** template-fill + a verification pass (don't ship a hallucinated crew); cap crew size.
- **Cost:** one generation call per new company — cheap, and aligned with the "AI configures itself" magic;
  routine work stays on cheap models.
- **Privacy is a feature, not just compliance** — "your agents, your data, only yours" is the trust wedge.
- **Cross-user learning:** keep each user's data private, but let the *meta-system* improve crew-generation
  from anonymized patterns over time (the compounding edge without violating privacy).

## Verify (when built)
A SaaS idea and an e-commerce idea produce **different** crews · the crew's memory persists across sessions ·
data is strictly user-scoped (no leakage across accounts) · nothing consequential fires without approval ·
QA gate green.
