> ⚠️ **PARTIALLY SUPERSEDED (2026-07-03).** Scored against the killed "$10K MRR within a month" goal; north star is now **PPU (Proven Paying Users)** per [REVENUE-RUN.md](REVENUE-RUN.md), and the "Studio $99 / annual" pricing bet was dropped (live tiers $0 / $39 / $299 / $499 + Cohort Lab, see [PATH-TO-10K.md](PATH-TO-10K.md)). The RICE method + per-feature reads remain useful.

# Feature rating — every feature, scored (RICE)

> Scored with **RICE** (Intercom's prioritization playbook): **Reach × Impact × Confidence ÷ Effort.**
> Each on 1–5. Effort is *remaining* build cost (shipped features ≈ 1). **Score = R×I×C ÷ E** (higher =
> better bang-for-buck). Judged against the **one goal** — competitor.inc itself reaching ~$10K MRR within
> a month of launch — so "Impact" = effect on the *trust → signup → pay → retain* funnel. These are honest
> judgment scores, not measured; re-score with real funnel data after launch.
>
> Verdict key: **CORE** (the pitch lives here) · **KEEP** · **POLISH** · **REVIEW** (works, needs a safety/UX
> check) · **DEFER** (post-launch) · **CUT/internal** (doesn't move the goal).

## Built — shipped

| Feature | R | I | C | E | Score | Verdict |
|---|---|---|---|---|---|---|
| Validation Gate (validate-before-build) | 5 | 5 | 5 | 1 | 125 | **CORE** — the entire wedge |
| Approval Inbox (human-in-control) | 5 | 5 | 5 | 1 | 125 | **CORE** — the #1 counter to Polsia's trust gap |
| The Glass Box (every action logged) | 5 | 5 | 5 | 1 | 125 | **CORE** — proof-first; uncopyable |
| Pricing + Founding seats + checkout | 5 | 5 | 4 | 1 | 100 | **CORE** — no revenue without it |
| Agent crew / nightly shifts | 5 | 4 | 4 | 1 | 80 | **KEEP** — the product |
| Auth (Google/GitHub/magic/guest) | 5 | 3 | 5 | 1 | 75 | **KEEP** — table-stakes hygiene |
| BYOK + multi-provider engine | 3 | 4 | 5 | 1 | 60 | **KEEP** — enables $0-compute + power users |
| Live Glass Box (visual artifacts) | 4 | 4 | 4 | 1 | 64 | **KEEP** — "show the work" vs Polsia's stats |
| Chat with your co-founder | 4 | 3 | 4 | 1 | 48 | **KEEP** |
| Morning-summary email (cron) | 3 | 3 | 3 | 1 | 27 | **KEEP** — retention |
| History / analytics charts | 3 | 2 | 3 | 1 | 18 | **KEEP** — minor |
| The Delegation / Office (3D) | 3 | 3 | 3 | 2 | 13 | **POLISH** — delight, watch perf/load cost |
| Agent banter (continuous convo) | 3 | 2 | 3 | 1 | 18 | **KEEP** — cheap personality/delight |
| Gated real-execution layer | 2 | 4 | 3 | 3 | 8 | **KEEP (gated)** — the "it can act" proof; off w/o keys |
| Per-agent model routing | 2 | 2 | 4 | 1 | 16 | **KEEP** — cost infra |
| The House + founder command bar | 1 | 2 | 3 | 2 | 3 | **CUT/internal** — founder tool, ~0 customer reach |
| Secret House door (hidden entry) | 1 | 1 | 3 | 1 | 3 | **CUT/internal** — tiny, fine |

## Friend's additions (on his fork — not yet merged)

| Feature | R | I | C | E | Score | Verdict |
|---|---|---|---|---|---|---|
| Supabase write-through persistence | 4 | 4 | 4 | 2 | 32 | **KEEP** — real users mustn't lose data at launch |
| Real token-streaming | 4 | 3 | 4 | 2 | 24 | **KEEP** — makes it feel alive |
| Surge launch-blitz (`blitz.ts`) | 3 | 3 | 3 | 2 | 14 | **KEEP** — on-strategy (surprise launch) |
| Continuous re-validation | 2 | 3 | 3 | 2 | 9 | **KEEP** — keeps validation honest over time |
| Per-user integrations (own GitHub/email/ads) | 2 | 3 | 2 | 3 | 4 | **REVIEW** — confirm actions stay approval-gated before trusting |
| Operate layer ON by default (EOS) | 3 | 2 | 3 | 1 | 18 | **REVIEW** — good tool, but default-on clutters new-user onboarding; consider gating for v1 |

## Planned (plan mode / roadmap)

| Feature | R | I | C | E | Score | Verdict |
|---|---|---|---|---|---|---|
| **Studio $99 / annual pricing** | 4 | 5 | 4 | 1 | 80 | **DEFER → do first post-Monday** — cheap, makes the $10K math far easier |
| **InkBox / ChatOps (text your agents)** | 4 | 5 | 3 | 3 | 20 | **DEFER (high priority)** — the "walk away" dream + big differentiator; needs bot token + deploy |
| **Browser-native AI (WebLLM)** | 4 | 4 | 3 | 3 | 16 | **DEFER** — unlocks the $0 free experience at scale |
| Two-layer Office vs House (finish) | 2 | 2 | 3 | 2 | 6 | **DEFER** — mostly done; low marginal value |
| Forge → real coding agent (Agent SDK) | 3 | 4 | 2 | 5 | 5 | **DEFER (post-$10K)** — makes "it builds real products" literally true, but big + risky |

## What the scores say

1. **The CORE four are your whole business** — Validation Gate, Approval Inbox, Glass Box, and Pricing/Founding. Every launch message and every demo should orbit these; they're also exactly where Polsia is weak.
2. **Highest-leverage *next* move isn't a feature — it's a price.** **Studio $99 / annual** scores as high as core features at near-zero effort. Do it first after Monday (with your approval); it's the single biggest lever on the $10K math.
3. **InkBox + Browser-AI are the two strategic post-launch bets** — one is the differentiator ("text your crew"), the other is what makes free users free. Both are deferred only because they need accounts/deploys, not because they're low-value.
4. **Two things to REVIEW before trusting** (both from the friend's fork): per-user integrations (do real actions still hit the Approval Inbox?) and Operate-on-by-default (onboarding clutter). Neither is wrong — they just need a look.
5. **The House is for *you*, not customers** — keep it, but it scores ~0 on the revenue goal by design. Don't spend launch energy polishing it.

**Freeze note:** nothing here says "build now." It says what to prioritize the moment the freeze lifts after the Monday handoff — and the order is: merge the friend's work → ship the pricing lever → then InkBox / Browser-AI.
