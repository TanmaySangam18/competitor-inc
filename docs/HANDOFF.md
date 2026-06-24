# Handoff — what exists & what's for the Monday meeting

> **The one goal:** competitor.inc *itself* reaches **~$10K MRR within a month of launch** — that *is* the
> validation of the whole concept. Bottleneck = **distribution**, not features. Feature freeze lifts at
> this handoff. Repo: `TanmaySangam18/competitor-inc` · `main` @ `cda348c` · QA green · live (sim) at
> `competitor-inc.vercel.app`.

---

# PART 1 — WHAT EXISTS (all on `main`, pushed, QA-green)

### Core product — the validate → build → operate flow
- **Validation Gate** — runs a *real* demand test (landing + waitlist + small test) and gives an honest verdict **before** building. *The wedge.*
- **Approval Inbox** — every consequential action (spend, posts, deploys, deletes) waits for your **yes**. *Human-in-control.*
- **The Glass Box** — every action, dollar, and decision logged in plain language, with **one-click undo**.
- **Live Glass Box** *(new)* — a glassy viewer showing the agents' *visual* output (website, ad as a customer sees it, social post, email, A/B test) with ‹ › nav. "Show the work," vs Polsia's stats.
- **Agent crew + nightly shifts** — Apex (CEO), Forge (eng), Pitch (marketing), Guard (support), Surge (growth) run the company; per-agent model routing.
- **Chat with your co-founder** — streams replies, queues approvals.
- **History / analytics** — tasks & spend per night (now scroll-contained).
- **Operate layer (EOS)** — Rocks / Issues / scorecard. *Gated by a flag* (your friend turned it on-by-default on his fork — see Part 3).

### The two layers + 3D
- **The Office** (`/delegation`) — 3D agent floor that builds the **user's** company (ink figures).
- **The House** (`/house`) — **private founder floor** (vivid 3D, faces) = competitor.inc run by its own crew. *New:* secure gate (on-device unlock works **only on localhost**; deployed needs founder email auth), **hidden entry** (triple-click the landing wordmark), **founder command bar** (direct the agents). Allow-list: `sangam.d@northeastern.edu`, `tanmaysangam018@gmail.com`.
- **Agent banter** — continuous ambient conversation.

### Engine / infrastructure (all gated, simulated by default)
- **Multi-provider engine** — `simulated` (default) / Anthropic / Vercel AI Gateway / any OpenAI-compatible host; **BYOK** in-app; SSRF guard on custom URLs.
- **Gated real-execution** (`/api/execute`) — GitHub build · Vercel deploy · email (Resend) · payments (Stripe, you keep 100%) · ads. **Each OFF until its key is added.**
- **Auth** — Supabase magic-link + Google + GitHub OAuth, with a local **guest** fallback (fully usable offline).
- **Morning-summary cron email.**
- **Pricing** — Validate **$0** / Operator **$39/mo** / Founding **$99 once** (capped). Checkout gated by `NEXT_PUBLIC_CHECKOUT_URL`. **0% revenue share.**

### Landing / marketing
- Conviction hero ("Prove it before you build it"), **Paper & Ink** theme, animated welcome agent, founder credit (Tanmay + LinkedIn), and a **"Run it from your texts" coming-soon teaser** (honest, future-tense).

### Docs (strategy + ops, in `/docs`)
Path-to-$10K · Distribution playbook · Zero-budget-compute · Feature rating (RICE) · Polsia intel (+ daily watch) · plus the full prior set (Competitive, Money-Plan, Positioning, Launch, Security review). Deploy steps: `launch/runbook.md`.

### Quality + deployment state
- **QA gate green:** `npm run qa` = types + tests + `next build` + smoke (zero 5xx on 60-payload fuzz).
- **Live site** = `competitor-inc.vercel.app` in **sim mode** (no real keys), but **STALE** — it builds from the friend's fork / an old snapshot and is **missing the 4 newest `main` commits** (House security fix, the texts teaser, the scroll fix, intel/rating docs).

---

# PART 2 — FOR MONDAY · friend (technical) action items, in priority order

1. **Consolidate the repo.** Merge the friend's **7 fork commits** into `main`. Verified **clean — 0 conflicts** (git auto-merges; two files touched on both sides resolve automatically — eyeball `app/dashboard/page.tsx` after).
2. **Repoint the live deploy.** In Vercel → Settings → Git: set repo to **`TanmaySangam18/competitor-inc`**, Production Branch **`main`**, enable auto-deploy → **Redeploy.** This is why the live site is stale.
3. **🔴 Security (do with #2).** The live `/house` is currently **publicly openable** (our fix isn't deployed). Redeploy fixes it. Then **enable Supabase auth + the founder email allow-list** so the House is founder-only on the live URL.
4. **Review 2 flagged items from his fork:** (a) **per-user integrations** — confirm real actions still route through the Approval Inbox; (b) **Operate-on-by-default** — consider gating off for v1 (onboarding clutter).
5. **$0-AI setup.** Wire a **free-tier provider as default**: NVIDIA NIM (`integrate.api.nvidia.com/v1`) or Groq via `MODEL_PROVIDER=openai-compatible` (~free credits, OpenAI-compatible = drop-in). Plan **WebLLM** (browser AI) as the later fallback.
6. **Re-run the QA gate after merge** — confirm green before redeploy.
7. **Turn on real integrations only as keys are added** (GitHub / Stripe / Resend / ads) — each stays gated/off without its key.
8. **(Optional) Domain** — buy (~$12) + point at Vercel.
9. **(Build, post-handoff) InkBox / ChatOps** — "text your agents." Easiest: **Vercel Chat SDK + Telegram first** (no template friction), reusing the Approval Inbox backend. A gated scaffold is ready to write on request; needs a bot token + the deploy.

---

# PART 3 — FOR MONDAY · founder (you) action items & decisions

- **Claude for Startups application** — all answers drafted (see below); only blocker = the **API Organization UUID** from `console.anthropic.com` → Settings → Organization. Website field ✅ (use the live URL). Submit after.
- **Funding (non-dilutive):** apply to the **GitHub Student Pack** (Azure/cloud credits) and **Northeastern IDEA** (up to $30k non-equity + EIR mentorship); consider the **Roux Founder Residency** (AI priority).
- **Pricing decision:** approve the **Studio $99 / annual** lever — highest-leverage on the $10K math, near-zero effort. *Needs your yes.*
- **Daily Polsia job:** click **"Run now"** once (pre-approve its tools) and keep the app open at 2 PM so it fires.
- **Boston founder:** draft the **Paul English** outreach (lead with the live demo + the "Polsia is wobbling" angle), and **apply to IDEA** to find an EIR / co-founder.
- **Deploy ownership:** decide — friend's redeploy (cleaner, one source of truth) vs your own Vercel project.

### Decisions already locked (so the friend has context)
- **0% revenue share stays.** Capture more value via **tiers / outcomes**, never a cut of the customer's revenue (counter-positioning vs Polsia).
- **Surprise launch** — no build-in-public; the only public milestone is a **success-story post when $10K hits**.
- **Honesty firewall:** any simulation/synthetic-research idea (Aaru-style) is a *labeled pre-screen only* — never presented as validation. The real demand test stays the verdict.
- **Priority order once the freeze lifts:** merge → ship the pricing lever → InkBox / Browser-AI.

### The Claude application answers (copy-paste)
First `Tanmay` · Last `Sangam` · Title `Founder` · Email `sangam.d@northeastern.edu` · Company `competitor.inc` · Website `https://competitor-inc.vercel.app` · **Org UUID = get from Console** · LLM spend `0` · Support `Claude API credits to power free-tier validation runs + our agent crew pre-revenue` · Using `Claude Code` + `API` · Funding `Bootstrapped / not raised` · Industry `Software` · Country/City `India / Visakhapatnam` (wherever the company is based) · LinkedIn `https://www.linkedin.com/in/tanmaysangam/`.
*Pitch box:* "competitor.inc is an AI co-founder that validates a startup idea before building it, then runs the company as a crew of agents. Unlike rivals, every action is visible (our Glass Box), the founder approves anything consequential (the Approval Inbox), and we take 0% revenue share. We'd use the Claude API as our reasoning engine — Haiku for routine agents, Sonnet and Opus for strategy and code."

---

# PART 4 — friend's unmerged fork work (the 7 commits to fold in)
Real **token-streaming** · **Supabase write-through persistence/sync** · **per-user integrations** (connect own GitHub/email/ads) · **Operate-on-by-default** · **Surge launch-blitz** (`blitz.ts`) · **continuous re-validation** · **launch hardening** + added tests. Disjoint from your work → clean merge.

# PART 5 — the competitive opening (context for the meeting)
**Polsia:** funded ($30M @ $250M, May 2026) and claims ~$10M ARR / 7.6k customers — **but the numbers reportedly started to wobble by mid-June**, at **Trustpilot 2.1** (complaints: incomplete execution, credits lost on failed actions). **Their #1 complaints are our #1 features** (never-charged-for-failed-work, verify-before-done, 0%, Approval Inbox). The race is winnable; win on **trust + distribution.**
