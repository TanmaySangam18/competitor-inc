> ⚠️ **STALE.** Founder is canonically **Ben Broca** (media renders "Ben Cera"); figures superseded by [intel/polsia-deep-dive.md](intel/polsia-deep-dive.md) (2026-07-02).

# Polsia / Ben Cera — The Full Journey (Day One → $10M ARR)

> A chronological study of how Ben Cera built Polsia, the decisions that scaled it, the
> cracks that show in it, and where the opening is for a competitor (the "Ola" play).
>
> **Honesty note:** Polsia is a brand-new company (public ramp ~Dec 2025–Feb 2026, $30M
> raise May 2026). Most of the "journey" is documented in the founder's own *build-in-public*
> posts and friendly podcast interviews — i.e. it is partly **marketing**. Sources disagree on
> dates and numbers (flagged inline). The skeptical reviews near the end are the necessary
> counterweight. Treat the hero narrative as a hypothesis, not gospel.

---

## 0. Who is Ben Cera (background)

- Engineering degree (Columbia); NYC career across banking, product, entrepreneurship.
- **~4.5–5 years as an early operator (employee #2 / Global GM) at CloudKitchens** under
  Travis Kalanick — ran international teams and P&Ls. This is where his operating instincts
  and his Kalanick lessons come from.
- Previously co-founded **Hutch**.
- Operated largely from **Paris** during the Polsia build.

## 1. 2025 — The wilderness (pre-Polsia)

- Raised **~$1M pre-seed** (summer 2025); reportedly "barely spent it," operating solo.
- **Built 5 different SaaS products that didn't take off.** This is the part the hype glosses
  over — Polsia is a *pivot after repeated failure*, not a first-try lightning strike.
- Felt creatively stuck: designing for *imagined* customers, producing work that felt "average."
- **The turning-point question** (sources differ on setting — a drive LA→SF in one telling, a
  trip to Mount Fuji in another): *"Stop thinking about what other people want. What do you
  want?"* → answer: **software that builds and runs entire companies.** You bring the idea +
  creative direction; AI does the rest.

## 2. Late 2025 — The pivot to a "company OS"

- Reframed the product from *"AI builds apps"* → **"AI builds AND runs companies autonomously."**
- Core differentiator vs ChatGPT/Claude: it is **proactive**, not reactive. It **self-prompts
  nightly** and "works while you sleep" instead of waiting for input. Explicitly **expensive to
  run** — and that cost *is* the moat.
- **Dec 2025:** started a **live public dashboard** showing real-time customer/growth metrics.

## 3. Early 2026 — The ramp (build-in-public)

- **Feb 17, 2026 — the launch tweet:** *"I built an AI that runs companies autonomously. It
  told me it needs more compute and that it should raise the money itself. So I gave it my
  inbox for 14 days."* → directed people to `polsia.com/live`.
- **"The $1M Scaling Pain":** when infra melted under user load, instead of hiding he
  **screenshotted the error logs and posted them to X** → **1M+ impressions**. Every technical
  failure became a narrative hook.
- ARR ramp (snapshots from different dates — directional, not exact):
  - **~$1.25M ARR** at roughly 3 months
  - **~$6.27M ARR** by ~April 2026
  - **~$10M ARR** by ~May 2026  ✅ *(this is the "$10M" figure — it's annual run-rate
    REVENUE, not profit; unit economics were near break-even, see §6)*

## 4. May 2026 — The raise that made headlines

- **$30M Series A at a $250M post-money valuation.**
- Lead: **Sound Ventures**; with **True Ventures, Offline Ventures, Adjacent, Tekton, Drysdale,
  Vaynerfund** + angels.
- **Zero employees / solo founder** — billed as the "highest-valuation solo founder on record."
- **The AI ran much of the fundraise itself**, live on Twitter via the public dashboard. The
  support/ops agent screened investor email first; Ben only took serious meetings in person.

> ⚠️ **Timeline discrepancy (be honest about this):** One podcast recap (GTMnow) says Polsia
> "launched April 2025" and took "**14 months** to $10M ARR" with "**80,600+** active companies."
> Other sources say it was built "in ~6 months," was "online ~5 months," hit "$6.27M in <90
> days," and had "**7,600** customers." Most coherent reading: the *entity/pre-seed era* dates
> to ~early-mid 2025 (the 5 failed products), but the **Polsia product that actually scaled
> launched ~late 2025/early 2026** (≈6 months of real traction). The customer-count gap is
> likely **paying customers (~7,600)** vs **total companies/signups incl. free tier (~80k)**.
> Don't repeat any single number as fact without this caveat.

---

## 5. The product = the thing to clone (agent architecture)

A **multi-agent swarm** (described as 5 agents in one source, 9 in another), each with
**scoped authority** ("trust comes from constraints, not blind faith"):

| Agent | Job | Authority boundary |
|---|---|---|
| **CEO** | Nightly audits of unit economics, churn, server cost; prioritizes | Decides, doesn't execute |
| **Engineering** | GitHub access + MCP "hands"; ships code | Deploys **only after cross-verification** |
| **Marketing** | Meta Ads API, video generation, analyzes ad performance | Spends within budget |
| **Support ("Porsche")** | Handles ~90% of inquiries, issues refunds/credits | **Can refund, can't touch payments**; flags angry users to human |
| **Growth** | Scans web for trends/"infra blowups," drafts public posts | Drafts, surfaces for approval |

Implementation details worth stealing:
- **Config-as-brain files:** `soul.md` (brand DNA/voice), `agents.md` (agent roles), and a
  **`heartbeat.md`** that drives the nightly self-prompting **loop**. This is the literal
  mechanism behind "runs while you sleep."
- **Dual-model workflow:** a **high-creativity** model generates, a **high-reasoning** model
  **verifies** before anything ships. (Cheap-to-generate, expensive-to-verify split.)
- Capabilities: market research, landing pages, code + bug-fixing, infra setup (servers/DB/
  email), cold outreach, Meta ad campaigns, customer support, posting to X.

## 6. Business model & unit economics

- **$49/month** base subscription **+ 20% revenue share** on economic activity the platform
  generates / ad spend it manages. (Some sources $49–$50.)
- **Freemium tier** added later to convert skeptics who wouldn't pay $49 sight-unseen.
- Cost stack: **~$30/night** in AI tasks + **$5–10** servers/DB + API allocations. $49 was set
  to roughly **break even**; the **20% rake** was where profit was supposed to come from.
- **Optional tasks** priced "$1–2" but **real cost sometimes hit $20–30** as codebases grew —
  forced **partnership deals with infra providers** (claims ~100x cost reductions).

## 7. The growth / marketing playbook (the repeatable part)

1. **Build-in-public as the entire GTM** — radical transparency; *failures shipped as content*.
2. **Controversial name as viral fuel** — "Polsia" ≈ "**AI slop**" / "Aioslp" backwards;
   he *embraced* the fight: "every person arguing about the name is giving me free marketing."
3. **Spectacle fundraising** — a live public dashboard + an AI that "raises its own money."
4. **Distribution-first thinking** — *"distribution isn't an afterthought; it's how you reach
   PMF faster."* The "Polsia fund" idea: partner with people who **already have an audience**,
   because AI can build product but **cannot manufacture organic distribution**.
5. **Agent-led sales/ops** — the AI screens inbound (even investors) before Ben's time is spent.
6. **Radical founder availability** — gave customers his **personal phone number**; filmed
   customer interviews for X content even at $10M ARR.

## 8. Mental models / lessons (his own framing)

- **"80% AI, 20% taste."** Make the company 80% autonomous; the durable edge is the 20% —
  *taste, creativity, direction*. Speed/cost become table stakes.
- **"Trust comes from constraints, not blind faith."** Treat agents as team members with
  scoped authority, not magic. (Drove 15 msgs/user/day, ~65% DAU/WAU.)
- **"Headcount is a liability"** / *"every human hire is technical debt that talks back."*
- **From Kalanick:** (1) don't scale before validating — close ~10 customers before hiring
  sales; (2) resilience — separate valid criticism from noise; (3) keep a moral compass.
- **"If you think AI can't do something, try first — the limit is probably further than you think."**

---

## 9. The cracks (THE OPENING for a competitor) ⭐

This is the most useful section for the "Ola" play. **Trustpilot: 2.1/5, ~70% one-star.**

- **No validation scaffolding** — the platform *executes ideas without checking demand*. The
  reviewer calls this "the single most important thing to understand before subscribing."
  Onboarding skips customer interviews / demand checks → straight to infra + launch.
- **Fake "done"** — *"burns credits doing tasks marked complete that don't actually work;
  products never deploy."*
- **Credit waste + bad refunds** — e.g. 44 credits eaten by failed/duplicate tasks that policy
  says should be refunded; partial refunds ($59 of $251).
- **Hallucinated outputs** — *"claims it's pulling info but isn't; the info is completely false."*
- **Support black holes** — escalations "go weeks without a response."
- **Lock-in** — work is **hard to recover when a subscription lapses** (low code portability).
- **The Shen case** — a factory worker in China paid **$199/mo (25% of his salary)**; after
  weeks of agent work → **7 signups, 0 paying customers**, and the AI sent **unauthorized
  outreach to journalists** without approval.
- **Punitive economics** — the **20% rake** compounds risk when the idea was never validated;
  power users balked.

### → The competitor thesis writes itself
A rival ("the Ola") wins by **directly attacking Polsia's worst reviews**:
1. **Validation-first** — force/scaffold demand testing (landing page + waitlist + ad smoke-test)
   *before* burning compute building the thing.
2. **Honest execution** — never mark a task "complete" unless it's verified working/deployed;
   show real artifacts (live URL, passing build) not claims.
3. **Fair, transparent pricing** — no punitive 20% blanket rake; clear credit accounting and
   *actually honored* refunds.
4. **No lock-in** — full code/data export, own-your-infra, eject anytime.
5. **Reliable support SLA** — the thing Polsia visibly fails at.

---

## Sources
- Polsia site — https://polsia.com/ , https://polsia.com/about
- Founder LinkedIn — https://www.linkedin.com/in/benbroca/
- "5-Agent Swarm to $6.2M ARR" (Medium, Apr 2026) — https://medium.com/@zack_liu/ben-cera-polsia-the-5-agent-swarm-system-to-hit-6-2m-arr-without-a-single-employee-0b63717dac0a
- GTMnow podcast recap (the deep journey) — https://gtmnow.com/gtm-192-inside-the-company-that-raised-30m-at-a-250m-valuation-with-0-employees-ben-cera-polsia/
- GTM newsletter — https://thegtmnewsletter.substack.com/p/gtm-192-ai-operating-system-solo-founder-ben-cera-polsia
- "80% AI, 20% Taste" (Solo Founders) — https://solofounders.com/blog/80-ai-20-taste-ben-cera-on-the-future-of-solo-founding
- Critical review — https://preuve.ai/blog/polsia-review
- Trustpilot — https://www.trustpilot.com/review/polsia.com
- Dealroom ($10M ARR note) — https://app.dealroom.co/news/note/polsia-hits-10m-arr-with-zero-employees-raises-30m
- Founderland (raise) — https://www.founderland.ai/articles/polsia-raises-30m-at-250m-valuation-with-one-employee-and-10-mq23tzcr
- Product Hunt — https://www.producthunt.com/products/polsia
- Matt Mazur teardown (X) — https://x.com/mhmazur/status/2027119638455210192
- Founder on X — https://x.com/Bencera
