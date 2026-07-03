# Intel Brief: Paperclip, Appy, Guildly

**Date:** 2026-07-02 · **Method:** WebSearch + WebFetch, every claim sourced. VERIFIED = confirmed on a primary or independent source at a cited URL. UNVERIFIED = vendor self-claim, single secondary source, or could not confirm.
**Frame:** competitor.inc's axis = validation-first + human-governed + verifiable proof + revenue loop. Rival benchmark = Polsia (see `polsia-deep-dive.md`).

---

## 1. Paperclip — open-source AI agent-team orchestrator

**Sites:** [github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip) · [paperclip.ing](https://paperclip.ing/) · X [@papercliping](https://x.com/papercliping)
**One-liner:** "If OpenClaw is an *employee*, Paperclip is the *company*." A Node.js server + React UI that orchestrates a team of BYO AI agents with org charts, budgets, tickets, goals, and governance.

### VERIFIED

- **What it is:** MIT-licensed, self-hosted (`npx paperclipai onboard`), TypeScript (97.7%). Org charts, goal alignment (tasks trace to company mission), per-agent monthly budgets with auto-pause at 100%, ticket system with immutable audit logs, human approval of hires/strategy/termination. Model/agent-agnostic: Claude, Codex, Gemini, Cursor, Hermes, OpenClaw, Pi, OpenCode, plus Bash scripts and HTTP endpoints. — [GitHub repo](https://github.com/paperclipai/paperclip), [paperclip.ing](https://paperclip.ing/)
- **Traction:** ~72.6k stars / 13.5k forks (July 2026, GitHub page). Independent tracker: launched **March 2, 2026**; 53,487 stars Apr 14 → 69,955 Jun 11; 105 lifetime contributors; ~4,953 open issues; biweekly releases. — [rywalker.com/research/paperclip](https://rywalker.com/research/paperclip)
- **Who's behind it / funding:** Led by pseudonymous dev **@dotta** (GitHub @cryppadotta). **No disclosed company, team, or funding** as of June 2026; April 2026 interview given only as "Paperclip's CEO" under pseudonym; single maintainer authors most merged PRs (bus-factor risk); no legal entity for vendor contracts/SLAs. — [rywalker.com/research/paperclip](https://rywalker.com/research/paperclip). (GitHub org page shows "Paperclip Labs, Inc." — conflicts with the no-entity report; see UNVERIFIED.)
- **Pricing / hosted:** The project itself is free, self-hosted only; **no first-party paid tier or managed cloud** — roadmap lists cloud agents, artifacts, memory systems, self-organization as pending; completed items include plugin system, OpenClaw integration, skills manager, scheduled routines, budgeting, approvals, multi-user. — [GitHub README](https://github.com/paperclipai/paperclip), [rywalker.com](https://rywalker.com/research/paperclip)
- **Third-party hosted commercialization exists without them:** [paperclip.inc](https://paperclip.inc/) (Paperclip.inc OÜ, EU) sells hosted Paperclip at €19–€49/mo + enterprise; [runpaperclip.com](https://runpaperclip.com/) is another hosted offering. Neither is run by the project.
- **What OpenClaw is:** viral open-source personal AI agent by PSPDFKit founder Peter Steinberger; launched Nov 2025 as Clawdbot, renamed OpenClaw; >214k GitHub stars by Feb 2026; runs locally, messaged via WhatsApp/Telegram, BYO API key. Paperclip *orchestrates* agents like it rather than competing with it. — [DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw), [Milvus guide](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md), [Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
- **HN reception is strikingly muted vs. the star count:** [Mar 10, 2026 thread](https://news.ycombinator.com/item?id=47324603) — 1 point, 0 comments; ["ticket-based multi AI agent orchestrator" Apr 25](https://hn.algolia.com/api/v1/search?query=paperclip%20agents&tags=story) — 3 points, 0 comments. Growth is happening on GitHub/X/Reddit (r/openclaw thread cited positively per rywalker), not HN. No Product Hunt launch found.
- **Ecosystem / notable users:** [paperclipai/companies](https://github.com/paperclipai/companies) — 16 pre-built "companies," 440+ agents, 500+ skills (753 stars); [Opensoul](https://news.ycombinator.com/item?id=47336615) — a Show HN marketing stack that is literally "a pre-configured deployment of Paperclip"; community plugins ([awesome-paperclip](https://github.com/gsxdsm/awesome-paperclip), [Discord integration plugin](https://github.com/mvanhorn/paperclip-plugin-discord), MCP server, oh-my-paperclip).
- **Known technical issues (independent review, May 2026):** embedded Postgres corruption on unclean shutdown; budget-enforcement race condition under high concurrency; heartbeat latency; template marketplace ("Cliphub") still "coming soon"; typical runtime cost $100–500/mo across 5–10 agents. — [aitooltier.com/tools/paperclip](https://aitooltier.com/tools/paperclip)
- **Repositioning:** original tagline "orchestration for **zero-human** companies" → softened to "the app people use to manage AI agents for work." — [rywalker.com](https://rywalker.com/research/paperclip). The agencyenterprise/paperclip-ai repo is just a 5-star fork of the original — [fork](https://github.com/agencyenterprise/paperclip-ai)
- **Roadmap/community signal:** community request (Apr 2026) to support OpenClaw-like agents e.g. PicoClaw got **no maintainer response** in 2+ months; prior issue #775 / PR #779 stalled — maintainer bandwidth is the bottleneck. — [Discussion #3418](https://github.com/paperclipai/paperclip/discussions/3418)

### UNVERIFIED

- "Paperclip Labs, Inc." (GitHub org footer) being a real registered entity — contradicted by rywalker's "no identifiable legal entity" (June 2026). Unresolved.
- Discord member count — invite exists ([discord.gg/m4HZY7xNG3](https://discord.gg/m4HZY7xNG3)) but no public size figure found.
- One secondary source says launch was March 4 and "30,000 stars within three weeks" — dates conflict slightly with rywalker's March 2; trajectory magnitude is corroborated either way.
- paperclip.inc's "engineers who ran blockchain infrastructure and security at Binance" — their own claim, uncorroborated.
- Any claim that stars = production usage. rywalker explicitly warns "star counts still overstate verified production usage."

### Strengths / Weaknesses / Axis

- **Strengths:** fastest-growing thing in the category (0→70k stars in ~3 months); genuinely solves "run 15 agents without losing track of cost/state"; hard budget caps + immutable audit logs + human approval gates = real governance primitives; BYO-agent, no lock-in; big plugin ecosystem forming.
- **Weaknesses:** pseudonymous single maintainer, no entity, no funding, no support — enterprise-poison; 4,953 open issues vs 105 contributors; DB corruption + budget race conditions; no cloud product (third parties are eating that revenue); zero validation or revenue tooling — it orchestrates work, it doesn't ask if the work is worth doing; "zero-human company" framing invites the same slop/credibility backlash Polsia gets.
- **Positioning axis:** **orchestration + governance-of-agents** (org charts, budgets, audit). NOT validation, NOT outcomes, NOT revenue. It governs *spend and process*, not *truth of results*.

---

## 2. Appy (appy.ai) — AI coworkers in Slack/Teams

**Site:** [appy.ai](https://appy.ai/)
**One-liner:** "Hire an entire team of AI coworkers." A coordinator agent ("Violet") delegates to prebuilt specialist agents (Sage/Audrey/Sloan for finance, plus sales/marketing/ops) inside Slack and Microsoft Teams, wired to 900+ app integrations.

### VERIFIED

- **What it is now (mid-2026):** AI-agent orchestration platform embedded in Slack/Teams; plain-English goals → Violet coordinates specialists; persistent business context, 24/7 scheduled tasks, full activity logs/decision history; no-code custom agent creation by describing a role to Violet. — [appy.ai](https://appy.ai/)
- **What it was at launch (pivot!):** launched public beta **Oct 2025** as a "conversational AI **business creation** platform" — build/deploy/monetize AI-agent businesses with Stripe payments, auth, subscriptions, white-label. — [BusinessWire, Oct 7 2025](https://www.businesswire.com/news/home/20251007471957/en/Appy.AI-Launches-AI-Business-Creation-Platform-After-Raising-%245M-Seed-Funding), [pulse2.com](https://pulse2.com/appy-ai-5-million-seed-funding-raised-and-conversational-ai-business-creation-platform-launched/). The current site sells AI coworkers, not business creation — a repositioning within ~8 months.
- **Funding:** **$5M seed** (Oct 2025) led by Dan Scholnick (Four Rivers) with Founder Collective; company about-page now says **$5.2M** total, and that Eric Paley (Founder Collective) is backing this CEO "for the third time." — [pulse2.com](https://pulse2.com/appy-ai-5-million-seed-funding-raised-and-conversational-ai-business-creation-platform-launched/), [Refresh Miami](https://refreshmiami.com/news/appy-ai-raises-5m-to-make-building-an-ai-business-as-easy-as-having-a-conversation/), [appy.ai/about](https://appy.ai/about)
- **Founder:** **Aaron White**, CEO — previously co-founder/CTO of **Vendr**, co-founder of Boundless, co-founder of Firetower.app (acquired by Crashlytics), VP at Venrock, CMU CS. Serious, repeat-backed operator. — [LinkedIn](https://www.linkedin.com/in/aaronmwhite), [Crunchbase person](https://www.crunchbase.com/person/aaron-white), [RocketReach](https://rocketreach.co/aaron-white-email_373704)
- **Team:** ~8 named on about page (White; Steve Kurtz VP Product; product/eng staff incl. a dedicated "Prompt Engineer"). — [appy.ai/about](https://appy.ai/about)
- **Pricing:** Free Starter ($100 free credits, no card) → **AI Workforce $50/mo** (20,000 credits, native Slack/Teams agents, unlimited users, priority support). No enterprise tier published. — [appy.ai/pricing](https://appy.ai/pricing)
- **Location:** Miami per launch coverage. — [Refresh Miami](https://refreshmiami.com/news/appy-ai-raises-5m-to-make-building-an-ai-business-as-easy-as-having-a-conversation/)

### UNVERIFIED

- **Traction:** "hundreds of teams," 30-min onboarding, and launch-era "beta testers went from idea to paying customers in minutes" — all vendor/PR claims, no independent corroboration found.
- **Reviews:** no Product Hunt launch page, Trustpilot page, HN thread, or substantive Reddit discussion found for appy.ai (searched July 2026). Testimonials exist only on their own site (incl. one calling it "basically OpenClaw... but in Slack and secure"). Public third-party reception ≈ zero.
- Crunchbase-derived "Denver, CO" HQ conflicts with Miami coverage — unresolved.

### Strengths / Weaknesses / Axis

- **Strengths:** credible repeat founder + tier-1 seed investors; smart wedge (lives where work happens — Slack/Teams — instead of another dashboard); 900+ integrations claim; simple $50/mo price; audit logs/activity history as a trust feature.
- **Weaknesses:** already pivoted once (business-builder → coworkers) = product-market-fit not yet found; traction claims unverifiable and third-party reception nonexistent; credit-based pricing obscures real cost; horizontal "any business task" positioning = same no-ICP mistake as Polsia; agents do tasks, nothing validates whether the tasks build a business.
- **Positioning axis:** **task execution/augmentation in existing chat tools** (convenience + breadth of integrations). Not validation, not proof, not revenue outcomes — their launch thesis ("code isn't a business") gestured at competitor.inc's territory, but the pivot moved them *away* from business-outcomes toward task delegation.

---

## 3. Guildly (tryguildly.com) — Slack-like workspace of AI employees

**Site:** [tryguildly.com](https://www.tryguildly.com/)
**One-liner:** "Run a company of AI employees." A desktop (Mac/Linux) Slack-like workspace where AI employees pick up work in #general, discuss in threads, route tasks to each other, and ship — plan-first, with human approval.

### VERIFIED

- **What it is:** unified workspace of multiple AI employees; channels/threads communication; every request becomes a tracked task on a board; **plan-first workflow** (draft plan → human approval → execution); shared persistent org memory ("one shared brain"); integrations: GitHub, Slack, Linear, Google Drive, Notion; "Autopilot mode" for routine decisions with resource-usage dashboard; free download, Mac + Linux, beta. Target: solo founders and startups. — [tryguildly.com](https://www.tryguildly.com/)
- **Team (thin but sourced):** a LinkedIn profile records that **Shubham Goyal** met **Aarsh Sheth** and **Idhant Jena** at an SF hackathon while working on Guildly. — [LinkedIn: Shubham Goyal](https://www.linkedin.com/in/shubham-goyal-633201211/)
- **Name collision:** the Tracxn "Guildly" profile, guildly.xyz, and Guildly GitHub org are a **different, unrelated 2022 Web3/StarkNet NFT-guild project** (unfunded, effectively dead). Do not conflate. — [Tracxn](https://tracxn.com/d/companies/guildly/__Wl0qHowvNnbbPr7CW7lHT5iq9EuY8MC4lyrMTJwSAwc), [guildly.xyz](https://www.guildly.xyz/)

### UNVERIFIED

- Funding: nothing found — no Crunchbase/PitchBook profile for the AI product, no YC listing, no press. Presumed bootstrapped/pre-seed hackathon-stage; **unconfirmed**.
- Launch date, pricing/business model (no pricing page — /pricing 404s), supported models, user counts: none disclosed.
- Reception: no Product Hunt, HN, Reddit, or press coverage found at all (searched July 2026). Beta with essentially zero public footprint.

### Strengths / Weaknesses / Axis

- **Strengths:** the *interaction metaphor* is the best of the three — plan-first + approve-what-matters + tracked task board is genuinely governance-shaped; local desktop app appeals to privacy-minded builders; targets solo founders/startups (closest ICP overlap with us).
- **Weaknesses:** hackathon-stage, no visible team page/entity/funding/community/reviews; Mac/Linux desktop-only limits reach; name collision with a dead Web3 project pollutes their SEO; no revenue model visible; approval governs *process*, not *proof of outcomes*.
- **Positioning axis:** **coordination UX + human-in-the-loop workflow** (a nicer cockpit for agent teams). Not validation, not verifiable results, not revenue.

---

## Comparison vs competitor.inc's axis

competitor.inc = **validation-first** (prove demand *before* building) + **human-governed** (policy engine, approval inbox, five-gate decide()) + **verifiable proof** (PPU, real receipts, honesty invariant) + **revenue loop** (nightly experiments vs REAL funnel).

| Axis | Paperclip | Appy | Guildly | competitor.inc |
|---|---|---|---|---|
| Validation before building | ✗ | ✗ (launch thesis flirted, pivoted away) | ✗ | ✅ core |
| Human governance | ✅ budgets/approvals/audit (process-level) | ~ audit logs only | ✅ plan-first approvals (process-level) | ✅ policy engine + approvals (outcome-level) |
| Verifiable proof of outcomes | ✗ (logs ≠ proof of results) | ✗ | ✗ | ✅ PPU / receipts / honesty invariant |
| Revenue loop (experiments → real funnel) | ✗ | ✗ | ✗ | ✅ shipped |
| Builds the product itself | ✗ (BYO agents) | ✗ (does tasks) | ✗ (does tasks) | ✅ real builds live |

**Where they overlap with us:** all three normalize "a governed team of AI workers under a human" — that educates the market for us and validates the Glass-Box/Approval mental model (Guildly's plan-first and Paperclip's approval gates are cousins of our Approval Inbox). Paperclip's budget-cap + immutable-audit primitives are worth studying (and its MIT license means we could even adopt patterns).

**The gap all three leave (our moat):** none of them ever asks *"should this be built, and did it actually make money?"* They govern spend and process; nobody governs **truth**. No validation gate, no verified revenue outcomes, no anti-fabrication stance. The "zero-human company" framing (Paperclip's origin) is the exact opposite of our verifiable, human-owned positioning — and OpenClaw/Paperclip's rise means "agents doing stuff" is commoditizing fast, which makes *provable outcomes* the scarce thing. That's our axis, and it's still empty.

**Watch items:** (1) Paperclip shipping first-party cloud/memory/self-organization (roadmap pending) — would make it the default substrate everyone builds "companies" on; (2) Appy re-pivoting back toward "build a monetized business" with its Stripe rails — that would re-enter our lane with $5M and a Vendr founder; (3) Guildly getting into YC or raising — the plan-first UX plus funding would make it the closest UX competitor for solo founders.

---

## Appendix — first-hand code + live findings (coordinator, 2026-07-02)

Complements the sourced research above with things only a repo clone + live drive can show.

### Paperclip — code-level (cloned repo, read directly)
- **Scale is real:** ~1,436 TS/TSX files across `server/` + `ui/`, pnpm monorepo (`packages/`: db, adapters, mcp-server, plugins, shared, skills-catalog, teams-catalog). Not vaporware — a full control plane.
- **Stack:** Node + React, **Drizzle ORM + embedded-postgres** (`embedded-postgres@18` → self-hosts its own Postgres, zero-config local run). MIT licensed.
- **Governance is genuinely built, not marketing:** real files for `signoff-policy`, `issue-execution-policy`, `trust-policy-ui`, `budgets`, `approvals` (with an `approval-routes-idempotency` test), budget services. Approval gates + revisioned config + rollback are implemented. In places this is *more mature than our approval layer* (idempotent approvals, config revisioning).
- **BUT — the two things it structurally lacks (verified by grep):** (1) **no demand/validation concept** — zero hits for validate-idea / demand-test / market-research anywhere in server or packages; it assumes the goal is already correct. (2) **no forbidden-action money floor** — its `forbidden()` is just an HTTP 403 helper; there's no `move_funds_out`/kill-switch hard floor like our `policy.ts decide()`. Budgets throttle spend; nothing categorically forbids a class of action.
- **Positioning in its own words:** *"you have 20 Claude Code tabs open and can't track which does what."* This is **developer tooling for people who already have agents + repos** — the opposite end of the journey from a first-time/non-technical founder.

### Appy.ai — live drive (Chrome)
- Product = **"AI coworkers" in Slack/Teams**, orchestrator "Violet" delegates to named specialists (Sage/Audrey/Sloan for finance; marketing/ops/sales). 900+ integrations, $100 free credits, "running in 30 min."
- Framing = **internal-ops automation for an existing lean team**, not founding a company. Testimonial drift toward "co-founder" language ("AI chat → co-creator → co-founder") but the product is a chief-of-staff, not a builder. No public numeric pricing on-site (research found $50/mo/20k credits).
- Every action tracked in an "activity stream" with immutable audit logs — same governance-theater vocabulary as Paperclip/Guildly, again with **no validation and no revenue proof**.

### Guildly — live drive (Chrome)
- Downloadable **Mac/Linux desktop app**, "Run a company of AI employees," free to download. Slack-like `#general` where manager/pm/sde/sde-fe/sde-be/reviewer agents (Pokémon-named: lugia/zapdos/arceus…) take tickets → write a PRD → **one-click plan approval** → tracked board (GLD-xxx) → autopilot with per-agent token/cost limits.
- **The best interaction model of the three and the nearest cousin to our Validation-Gate→Approval-Inbox loop** — "a plan first, then the work," approve in one click. Explicitly targets solo founders + startups (our ICP).
- Still: begins *after* the idea is chosen. No validation, no verifiable-proof standard, no revenue loop, no anti-fabrication stance.

### Correction logged
An earlier read called Paperclip "released today, single squashed commit" — that was a `git clone --depth 1` artifact (shallow clone fetches exactly one commit). Project is ~4 months old with ~72.6k stars per the research above.

### One-line verdict
All three commoditize **agent execution + spend governance**. None governs **truth** (what's worth building) or **outcome** (did it earn). competitor.inc's bookends — validation-first + verifiable revenue proof — remain the empty, defensible axis; the orchestration middle is now a red ocean and should stop being our headline.
