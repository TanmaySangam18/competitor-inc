# competitor.inc

> **Prove it before you build it.**
>
> **The first company built with _orgware engineering_** — a business that runs on a **governed agent
> workforce**, where every action is **provable**. (What orgware is + why it's a new discipline:
> [`docs/ORGWARE-MANIFESTO.md`](docs/ORGWARE-MANIFESTO.md).)

> **Founder & creator: [Tanmay Sangam](https://www.linkedin.com/in/tanmaysangam/).** © 2026 Tanmay Sangam — all rights reserved. Proprietary &
> confidential: no use, copying, or distribution without written permission. See [LICENSE](LICENSE).

competitor.inc is an **autonomous software company**: describe a project, and a real AI organization —
56 named positions in a genuine hierarchy — validates the demand, **builds and deploys real software**
(Claude‑implemented, design‑reviewed by an AI Design Lead, live‑verified before any URL is shown),
supports it, and grows it. You govern it through **one signed, capped, instantly‑revocable mandate**;
everything it does is logged with proof, the irreducible acts (money, contracts, deletion) always come
back to a human, and it never fabricates a number. It validates **before** it builds — it will honestly
tell you *don't build this* — and it keeps working while your laptop is closed.

This README explains the whole thing — the plain‑English story **and** the technical guts — so anyone
(technical or not) can understand what we built, why, and how to run it.

> **Reading this as an engineer? Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).** It covers the
> one load-bearing idea, the layer boundaries and the test that enforces them, the gate order every real
> action passes through, and a section answering the questions reviewers actually ask, including "what is
> the weakest part" (distribution, not code). What is still missing and in what order lives in
> [`docs/NAIVE-GAP-LIST.md`](docs/NAIVE-GAP-LIST.md).

> ### 🧭 Current direction (2026-07): prove it works → win the first receipts
>
> The $10k revenue goal is **paused by the founder** (2026-07-15) in favor of **platform proof**: turn every
> major capability on (payments excepted) and show the AI workforce genuinely running the company. Two live
> tracks share one engine — (1) **build + run competitor.inc itself** via the Loop Engine ([`lib/loop/`](lib/loop/)),
> and (2) **win cash hackathons as a service** (the founder is customer #1) to fund compute honestly, since
> there is no API budget.
>
> **Ignition (ADR-0021):** connect the accounts and the company **starts itself** — the first heartbeat where
> a model key exists, company #0's loop registers itself ([`lib/loop/ignition.ts`](lib/loop/ignition.ts)) with a
> marketing-first roadmap and begins working: org-runs spin laptop-off, digests land in Slack, and governed
> marketing posts from real receipts. No button. The **hackathon service is one call end-to-end**
> ([`lib/loop/hackathon-run.ts`](lib/loop/hackathon-run.ts)): find the strongest open cash-prize event → rules
> check first (abort if AI is banned) → build as a real durable org-run → draft the paste-ready submission
> package. The account + the Submit click stay human — the same hard-stop floor as everywhere else.
>
> **The treasury (ADR-0020):** a bank for the 56 — per-department budget envelopes on [`/connect`](app/connect/page.tsx).
> The human sets a monthly cap once (standing authorization); in-budget spend runs silently through the
> executor's envelope gate ([`lib/engine/treasury-db.ts`](lib/engine/treasury-db.ts)); over-budget escalates
> before a dollar moves; **withdrawals are never automated**. Agents also get **two-way email**
> ([`lib/core/agentmail.ts`](lib/core/agentmail.ts)): reading is auto, sending queues through governance with
> AI disclosure appended.
>
> The product is now **three surfaces, not a dashboard** ([`docs/CONNECT-FIRST-RESET.md`](docs/CONNECT-FIRST-RESET.md)):
> **`/connect`** (a BYOK connection map of **19 capabilities grouped into 9 accounts, exactly one of which
> is required** (see the 2026-08 update below), plus OAuth and a one-line `curl … | node` activation),
> **the Stream** (one conversational thread that replaced the 6-tab cockpit — the org talks to itself; the human
> oversees and signs only the rare decision), and a **simple site** that explains it. Approvals happen **in Slack**,
> answered by department leads under five rails; only the irreducible floor (money, contracts, launches, deletion)
> reaches the founder. The UI is **dark-canvas monochrome** with a drawn end-to-end **flow diagram**
> ([`components/FlowDiagram.tsx`](components/FlowDiagram.tsx)).
>
> **Onboarding co-pilot** (ADRs [0017](docs/adr/)/[0018](docs/adr/)/[0019](docs/adr/)): a governed browser agent
> sets the whole company up for the user — navigates, pre-fills non-secret config, connects via OAuth, detects
> completion, reports each step to Slack — and **hard-stops** at the six human acts (create account · accept terms ·
> authenticate · solve CAPTCHA · grant consent · pay). Consent-gated, secret-free at the driver boundary, governed
> before every action.
>
> Honest state: the machine is built and QA-green; **$0 settled, 0 paying customers** — shown proudly, never faked.
> The arc is **Prove (now) → first receipt → revenue**. No rung is claimed before its receipt.

---

> ### 🧭 Current direction (2026-08-16): one benchmark, one key, and truth as the moat
>
> **The benchmark is Naive** (usenaive.ai, $28.5M Series A on 2026-08-06). They shipped the bundle thesis
> and got funded for it, so bundling is table stakes now. We copy their **execution bar** and refuse their
> **strategy**: managed credentials plus reselling infrastructure needs an entity, banking partners and
> capital to eat vendor bills, none of which exist here. Full reasoning and the deliberate refusals are in
> [`docs/NAIVE-GAP-LIST.md`](docs/NAIVE-GAP-LIST.md).
>
> **Onboarding: four keys became one.** T0 used to require a model key, GitHub, hosting and a database
> before anything ran, which was the worst measured number in the category. The diagnosis was a category
> error: T0 conflated *what competitor.inc needs to run* with *what a shipped product needs to exist*. Only
> cognition is unsubstitutable, so only the model key blocks the door; everything else gates a named
> capability ([`lib/core/capabilities.ts`](lib/core/capabilities.ts)) and `/connect` now asks for **one
> account at a time, with the reason** ([`lib/core/accounts.ts`](lib/core/accounts.ts)). A test asserts the
> required count cannot drift back to four.
>
> **Memory got a spine.** Flat vector recall was replaced by provenance-graded beliefs with validity windows
> ([`lib/core/beliefs.ts`](lib/core/beliefs.ts)): facts **supersede** instead of duplicating, contradictions
> are surfaced for a human rather than resolved by picking, and every belief is graded **observed** (a
> receipt, citeable), **asserted** (we were told) or **inferred** (the model derived it). The rule nobody
> else in the category has: **only an observed belief with a source may back a claim that reaches a
> customer**, refused by grade rather than by confidence.
>
> **Outbound is gated by a type, not a convention.** The publishing mandate existed, was fully tested, and
> was wired to nothing while three live publishers posted without it. Publishers now take a
> `PublishPermit` that only [`lib/core/publish-gate.ts`](lib/core/publish-gate.ts) can mint, so an ungated
> publish is a compile error. The compiler found a fourth ungated call site nobody had noticed by reading.
>
> **The proving ground got bigger.** 50,000 synthetic members with a power-law graph, a generalised
> second-price ads auction whose ledger closes to zero micros, and a shard planner that measures fan-out
> ([`lib/sim/`](lib/sim/)). The finding worth reading: at 40 shards the **median** feed read already touches
> 20 of them, so fan-out-on-read is not viable at the top of that graph. Every row is `simulated: true` and
> a test forbids any field name that could be misread as revenue.
>
> **Standing rule learned the hard way:** a rail you can satisfy by setting a boolean is not a rail. Derive
> it (disclosure is checked in the post text, honesty against provenance) or make it a type the caller
> cannot forge.


---

> ### 👋 Deploying this for the founder? Start here.
>
> 1. **Run it right now:** `npm install && npm run dev` → open `http://localhost:3000`. It works
>    **immediately** — no API keys, no accounts (it ships in offline "simulated" mode).
> 2. **Put it live:** follow **[`launch/runbook.md`](launch/runbook.md)** — a ~30‑minute, step‑by‑step
>    Vercel deploy.
> 3. **Everything external is optional** (Supabase, payments, model keys) — see the
>    [env‑var table in §9](#9--run-it-locally). With nothing set, the full demo still runs.
>
> You do **not** need the strategy notes in [`docs/`](docs/) to ship it — those are background for the
> founder. The only build commands you'll ever need: `npm run dev` (work on it) and `npm run qa`
> (types + tests + build + smoke, must end "SMOKE PASSED").

---

## Table of contents

1. [The one‑paragraph version](#1--the-one-paragraph-version)
2. [Explain it like I'm five](#2--explain-it-like-im-five)
3. [The core idea: validate first](#3--the-core-idea-validate-first)
4. [Every feature, in plain English](#4--every-feature-in-plain-english)
5. [How it works (technical)](#5--how-it-works-technical)
6. [The AI engine & the cost model](#6--the-ai-engine--the-cost-model)
7. [Security & privacy](#7--security--privacy)
8. [Design system](#8--design-system)
9. [Run it locally](#9--run-it-locally)
10. [Quality: testing & the QA harness](#10--quality-testing--the-qa-harness)
11. [Business & strategy](#11--business--strategy)
12. [The playbooks we used](#12--the-playbooks-we-used)
13. [The journey (how we got here)](#13--the-journey-how-we-got-here)
14. [Repository map](#14--repository-map)
15. [Handoff & deployment](#15--handoff--deployment)
16. [Status & roadmap](#16--status--roadmap)

---

## 1 · The one‑paragraph version

Most "AI that builds your startup" tools start building the moment you describe an idea. That's
backwards — **building is now cheap; knowing what's worth building is the hard part.** competitor.inc
flips the order: it spins up a real landing page, runs a small demand test, scores four experiments,
and gives you an **honest verdict** — including *"don't build this."* If the signal is strong, a team
of AI agents builds and operates the product overnight, logging every action with proof and cost in a
"Glass Box," and routing anything consequential (spending money, sending messages, deploying) to an
**Approval Inbox** for your sign‑off. You stay in control; the AI does the work.

---

## 2 · Explain it like I'm five

Imagine you have an idea for a lemonade stand. 🍋

- **The usual way:** you spend all your allowance building a fancy stand… then find out nobody on your
  street actually wanted lemonade. Money gone.
- **The competitor.inc way:** first, a smart helper puts up a little sign that says *"Lemonade soon —
  want some?"* and counts how many kids say *yes*. If lots say yes, the helper builds the stand for
  you. If only one bored kid says yes, the helper tells you the **truth**: *"Maybe not lemonade —
  let's try something people actually want."*

That "smart helper" is competitor.inc. It's like a **business partner who is honest with you** — it
checks if people want your idea *before* spending your money, does the boring work for you at night,
and always asks permission before doing anything big (like spending money or emailing people).

Three promises it keeps:
1. **It tells the truth** — even when the truth is "this idea isn't ready."
2. **It shows its work** — you can see everything it did, what it cost, and proof it happened.
3. **It never goes rogue** — money and messages always wait for your *yes*.

---

## 3 · The core idea: validate first

The product is built on one contrarian bet:

> **Code is commoditized. Validated demand + trust are scarce.**

So instead of optimizing for "build fast," we optimize for "build the *right* thing, honestly."
That single principle shapes every feature:

| Most AI builders | competitor.inc |
| --- | --- |
| Build immediately | **Test demand first** |
| Always optimistic | **Willing to say "don't build this"** |
| Black box | **Glass Box — every action + proof + cost** |
| Acts autonomously | **Human‑in‑the‑loop for anything consequential** |
| Lock‑in | **Own your data, export anytime, no revenue share** |

---

## 4 · Every feature, in plain English

- **Attention‑first landing** — The home page *runs the product* before it asks for anything: type an
  idea in the hero and watch the crew validate it live (the deterministic, keyless simulated engine,
  in your browser). Below it, a bento grid of glanceable proofs. Monochrome "paper & ink" liquid‑glass
  design — no color except meaning. See `docs/PLAYBOOK-attention-first-landing.md`.
- **Validation Gate** — Describe your idea in a sentence. competitor.inc runs **four experiments**
  (landing page + waitlist, fake‑door click test, a small paid demand test, and search demand),
  scores each as positive/weak/negative, and produces a **confidence %** and an honest verdict:
  **strong / mixed / weak** — with a recommendation that can be *"hold, this isn't worth building yet."*
- **Build‑the‑winner** — If you approve, it ships an initial MVP and then runs **overnight shifts**
  with a team of named AI agents, each with a job and *scoped* authority:
  - **Apex · Strategy** — calls the strategy & unit economics, what to double down on / cut · playbook: *Playing to Win* (Lafley & Martin)
  - **Forge · Engineering** — ships the product, deploys only after it verifies · playbook: *Shape Up* (Basecamp)
  - **Pitch · Marketing** — runs demand tests & campaigns, finds the one channel that works · playbook: *Bullseye / Traction* (Weinberg & Mares)
  - **Guard · Support** — handles users; can refund, *can't* touch payments · playbook: *The Effortless Experience* (CEB)
  - **Surge · Growth** — spots trends & **loads the surprise‑launch blitz** (big‑bang drop, not build‑in‑public) · playbook: *Hacking Growth* (Sean Ellis)
- **Dynamic crew from real org structures** — When an idea matches a benchmark we hold org data for
  (e.g. an EV idea → Tesla, a productivity/SaaS idea → Notion), the crew is generated from that
  company's actual roles — adding agents like a Manufacturing lead and nesting **sub‑agents**
  (Paperclip‑style: Manufacturing → Supply Chain + Quality). Ideas without a matching benchmark get
  the default five — we never invent a crew we can't back with data. See `lib/engine/dynamic-crew.ts`.
- **The crew, in a box (live)** — the agent crew renders as a compact **pixel‑art panel on the
  dashboard** (not a separate page): colorful bots that talk in real time — ambient banter plus a chat
  box to direct them — with the current speaker spotlit. Crucially, anything you type to the crew in
  **Slack or Telegram reflects back in the box** (`/api/chatops/messages`, founder‑gated). *(The old
  full‑page `/delegation` office is retired — it now redirects to the dashboard, where the box lives.)*
- **The Company Brain** — A dashboard tab that renders the company's whole decision history as a
  tappable graph (center = company, ring = nights, leaves = every action & approval). Tap any node
  for the **why** (rationale), **how** (proof + cost), and a playbook‑grounded **founder lesson** —
  including *why* a rejected action never ran. Operating knowledge founders usually pay years to learn.
- **The Glass Box** — A public, real‑time log of *every* action, each with a cost and a proof artifact
  (a URL, a build result, or a metric). Total transparency.
- **Approval Inbox** — Anything consequential (spend, outreach, deploys, deletions) is **queued for
  your approval** instead of done automatically. Approving is a **governance decision — it never charges
  you.** Real spend only ever moves through a funded wallet on *your own* connected account; with none
  connected, an approved spend is just a recorded plan.
- **Trial credits (play‑money, not dollars)** — the 14‑day trial gives **1,000 credits**. Approving a
  spend draws down credits so you can rehearse the governed‑spend loop; the dashboard shows *credits
  left / used*, never a fabricated dollar total. **No real money moves anywhere in the app** (spend
  displays are $0) — credits map to real dollars only if/when the payment gates are deliberately opened.
- **Chat with your co‑founder + ChatOps** — A streaming chat to ask questions and direct the work; it
  queues consequential requests for approval rather than just doing them. Approve from your phone via
  **Telegram or Slack** (`docs/SLACK-CHATOPS-SETUP.md`) — same audit trail, buttons on the message.
- **Autopilot / nightly heartbeat** — Toggle autopilot and it runs shifts on an interval; deployed, a
  nightly cron does the same for every operating company.
- **Public `/live` board** — A shareable, real‑time view of every company being validated and built —
  the Glass Box, out in the open.
- **`/how-it-works`** — A plain‑language, illustrated walkthrough of the whole product for newcomers.
- **Operate layer (EOS)** — A "company operating system" surface (Scorecard, Rocks, Issues,
  Weekly Review) inspired by EOS/Traction. *On by default; set `NEXT_PUBLIC_OPERATE=0` to freeze it.*
- **One engine, one surface (the crew runs the business)** — the company runs on a single engine
  (`runShift`), surfaced on the **dashboard**: the crew ships work overnight, everything lands in the
  Glass Box, and consequential moves queue in the Approval Inbox. *(The earlier duplicate goal‑runner
  surfaces `/orchestrator` and `/watch` were consolidated away — they redirect to the dashboard.)* The
  deeper **supervisor / ephemeral‑agent‑per‑task** engine (decompose a goal → spawn → independently
  verify → hand off → terminate; irreducible acts → the **Accountability Spine**) remains in‑tree,
  governed (policy + wallet + kill‑switch) and flag‑gated, as the long‑horizon path. See
  `lib/engine/{server,supervisor,agent-lifecycle,task-queue,accountability-spine,build-github}.ts`.
- **Settings** — Your **brand voice** (`soul.md`), your **team** (`agents.md`, toggle/scope each
  agent), the **engine** (which model runs it + bring‑your‑own‑key), **billing**, **integrations**,
  and **one‑click data export** (no lock‑in).

---

## 5 · How it works (technical)

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4
(`@theme` CSS variables) · framer‑motion · lucide‑react · Vitest + fast‑check.

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (client)                                                  │
│   • app/* route pages (landing, dashboard, live, join, settings)   │
│   • useEngine()  → store: companies / activities / approvals       │
│   • useConfig()  → soul.md, agents.md, engine + BYOK               │
│   • useAuth()    → Supabase session OR local "guest" mode          │
│   • persistence: localStorage (cofounder:*)  ⇄  Supabase (if env set) │
└───────────────┬────────────────────────────────────────────────────┘
                │ fetch /api/engine  { kind: validate | shift | chat | goal } │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Server (Next.js route handlers, Node runtime)                     │
│   • app/api/engine/route.ts  → validates input, calls the engine   │
│   • lib/engine/server.ts     → callModel(): BYOK → env → simulated │
│   • app/api/cron/route.ts    → nightly heartbeat (Vercel Cron)     │
│   • the API key lives ONLY here (server-only), never on the client │
└──────────────────────────────────────────────────────────────────┘
```

**Key modules** (`lib/engine/`):

- **`types.ts`** — the domain model (Company, Activity, ApprovalItem, ValidationResult, Experiment,
  Rock/Issue, ByokConfig, the `AGENTS` map).
- **`provider.ts`** — the **simulated engine** (deterministic, offline, no key) + `scoreIdea()`, the
  shared validation‑scoring logic used by both the simulated and real‑model paths.
- **`server.ts`** — `server-only`. Routes a request to a real model (your BYOK key → a server env key
  → otherwise throws and falls back to simulated), normalizes the output into our types.
- **`useEngine.ts`** — the client store + all actions (create/validate, decide build, run shift,
  autopilot, approvals, undo, Operate). Guards against overlapping shifts, malformed responses, and
  corrupted local storage.
- **`config.ts` / `usage.ts` / `useAuth.ts`** — config + BYOK, free‑tier usage caps, and auth.
- **`db.ts`** + `lib/supabase/*` — the typed Supabase data layer (gated behind env keys).

**Persistence model:** the app is **fully usable offline** — it defaults to `localStorage` and a
simulated engine, so there are no required external services. Supabase (auth + Postgres) and a real
model key are **progressive enhancements** that switch on automatically when their env vars are set.

---

## 6 · The AI engine & the cost model

The engine is **swappable**, with three modes:

1. **Simulated** (default) — runs entirely client/server‑side with deterministic logic. No API key,
   no cost, works offline. Great for demos and the free tier.
2. **Frontier model** — a hosted model via a server‑side key (`ANTHROPIC_API_KEY`).
3. **Bring‑your‑own‑key (BYOK)** — the user supplies their own Anthropic or OpenAI‑compatible key
   (OpenAI, Groq, OpenRouter, local servers, …). The key is stored **only in their browser**, sent
   **per‑request**, and **never persisted or logged** by us.

**Why BYOK matters (the honest framing):** the product's value is the **validation engine + the agent
orchestration + the Glass Box proof + the accumulating trust/data**, *not* the model call. The model is a
commodity brain we plug in.

**BYOK is the model, not an option** (corrected 2026-08-16; this section previously said most users run a
managed default, which was backwards). We never hold a customer's keys. Our **marginal inference cost is
~$0**, which is how the project stays viable without VC-subsidised pricing, and it is the reason we cannot
copy competitors who reach zero-connection onboarding by holding every account and paying every vendor
bill. What we do instead is lend **our own capped free-tier key** for a few runs a day so a visitor can look
before connecting anything ([`lib/core/trial.ts`](lib/core/trial.ts)). That trial can only *think*: it
cannot deploy, publish, email or spend, which is both the honest scope of a free look and the containment
boundary.

**The build step — real apps, on a free key.** Turning an idea into working software is the
highest‑value model call, so it gets its own override: set **`BUILD_API_KEY`** (defaults to Google AI
Studio's OpenAI‑compatible endpoint + `gemini-2.5-flash`) and the *build step* routes to that capable
**free** model, producing a **real, functional client‑side web app** (working views + localStorage) —
while chat/shifts stay on the cheap managed model. Priority: your BYOK key → `BUILD_API_KEY` (Gemini) →
`ANTHROPIC_API_KEY` → the default. If no capable build model is set (a weak model can't emit valid app
code), it falls back to a **credible product site**, never a broken page. **Honest ceiling:** functional
**web apps** build for real; **native / camera / ML** apps and full‑stack backends are the guided,
advanced path (a pluggable coding agent + `BackendProvider`), not a one‑shot from a sentence — and we
say so rather than fake it.

---

## 7 · Security & privacy

- **BYOK keys never touch the server's disk or logs.** They're read from the browser, forwarded on a
  single request, and dropped. Error logging on that path records only an error *message*, never the
  raw error object or request body.
- **SSRF guard.** Because a BYOK "base URL" is user‑supplied and fetched server‑side with the user's
  key, `server.ts` validates it before use: **https only**, and **blocks** loopback, private ranges
  (10/8, 172.16/12, 192.168/16), link‑local, and cloud‑metadata hosts (e.g. `169.254.169.254`). This
  stops the server from being used as a proxy to internal resources.
- **Input validation.** The API rejects malformed bodies with `400`; a fuzz suite throws 60 garbage
  payloads at it and asserts **zero 5xx**.
- **Defensive client store.** Corrupted `localStorage`, malformed API responses, and overlapping
  autopilot shifts are all guarded so the UI never wedges or double‑counts.
- **Own your data.** One‑click JSON export, no lock‑in, no revenue share.

---

## 8 · Design system

- **Paper & Ink** — a warm cream‑paper canvas with heavy black ink and a single **coral** accent (used
  sparingly on the one thing that matters). High‑contrast utility aesthetic; emphasis via black inverted
  cards + bold type. Full spec in [`docs/DESIGN.md`](docs/DESIGN.md). *(Earlier builds were monochrome
  dark; the founder chose Paper & Ink.)*
- **Liquid glass (Apple HIG: Clarity · Deference · Depth)** — translucent, frosted panels with a lit
  top edge float content off the canvas to convey hierarchy without stealing attention. Honors
  `prefers-reduced-transparency` (drops the blur) and `prefers-reduced-motion`.
- **Type & mark** — a monospace wordmark (JetBrains Mono), **Archivo Black** for the heavy uppercase
  display headlines, Space Grotesk for headings, Inter for body; a custom `LogoMark` (a speech bubble
  fused with a checkmark — *companion + proof*).
- **Accessibility** — skip‑link, landmarks, visible focus rings, AA contrast on the grayscale palette.

---

## 9 · Run it locally

**Prerequisites:** Node 18+ (20+ recommended), npm.

```bash
git clone https://github.com/TanmaySangam18/competitor-inc
cd competitor-inc
npm install
npm run dev          # → http://localhost:3000  (or PORT=3001 npm run dev)
```

With **no configuration**, it runs fully in simulated + local‑storage mode (offline demo). To enable
real features, copy `.env.example` → `.env.local` and fill in what you want — **everything is optional:**

| Variable | Enables |
| --- | --- |
| `MODEL_PROVIDER` + key (`GROQ_API_KEY` / `ANTHROPIC_API_KEY` / …) | The managed engine for chat, shifts & validation (Groq's free tier works) |
| **`BUILD_API_KEY`** | **Real app builds** — routes the build step to a capable free coder (defaults to Google AI Studio / `gemini-2.5-flash`). Optional: `BUILD_MODEL`, `BUILD_BASE_URL` |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real auth + persistent multi‑company store |
| `SUPABASE_SERVICE_ROLE_KEY` (+ `CRON_SECRET`) | The nightly heartbeat cron + server‑enforced per‑user caps + ChatOps reflection |
| `NEXT_PUBLIC_WAITLIST_GATE=1` | The freemium flow (reverse trial + 1‑free‑company + waitlist gate) |
| `NEXT_PUBLIC_CHECKOUT_URL` | The Founding‑seat checkout (Polar). **Leave unset to keep payments off** (no charge path) |
| `POLAR_WEBHOOK_SECRET` | Polar billing webhooks → subscription entitlements |

See `.env.example` for the full annotated list (model routing, Telegram/ChatOps, Resend, observability, feature flags).

---

## 10 · Quality: testing & the QA harness

We follow the **Testing Trophy** (lean on integration + a strong top E2E layer), with property/fuzz
testing via **fast‑check**. One command gates everything:

```bash
npm run qa     # = tsc --noEmit  &&  vitest run  &&  next build  &&  node scripts/smoke.mjs
```

As of 2026-08-16 that gate is **200 test files and 1,662 tests**, green.

The tests worth showing a reviewer are not the coverage ones, they are the **invariants**: the honesty wall
on synthetic data, the anti-drift test on the six hard-stops, "exactly one connection is required", the ads
ledger reconciling to zero micros, the sharding residency check asserting no member is stored outside its
legal jurisdiction, and [`lib/core/architecture.test.ts`](lib/core/architecture.test.ts), which fails CI if
a policy module ever imports mechanism again.

`scripts/smoke.mjs` boots the **production build**, sweeps every route + the API, checks the brand
string, exercises the happy paths and `400`s, and **fuzzes 60 garbage payloads asserting zero 5xx**.
The codebase also went through a full **line‑by‑line security & correctness audit** (see the journey
below) before launch hardening.

---

## 11 · Business & strategy

- **Positioning** — a standalone brand with its own values (validation‑first, honest, human‑in‑control).
  The lead competitor as of **2026-08** is **Naive** (usenaive.ai, "Ship Apps. Agents. Companies.",
  $28.5M Series A announced 2026-08-06): the same bundle thesis, funded. Wix Symphony shipped a comparable
  bundle for SMBs on 2026-08-11. **Bundling is therefore table stakes, not a wedge.** We
  **counter-position** on the thing almost none of them govern and none of them govern lawfully: whether what
  the agent says is TRUE, and which statute applies when it says it. One of 26 surveyed (Lyzr) governs output
  quality; ZERO name CAN-SPAM, TCPA, DNC or recipient-side AI disclosure, and two sell safety as an add-on.
  Naive's own
  docs concede the default tenant user is ungated and that **222 of their 271 tools assert no gate at
  all**; no vendor surveyed names CAN-SPAM, TCPA or the AI-disclosure statutes. Full analysis in
  [`docs/NAIVE-GAP-LIST.md`](docs/NAIVE-GAP-LIST.md), including what we deliberately refuse to copy
  (company formation, virtual cards, "no human in the loop").
- **Pricing** — **Validate $0** (free forever) · **Operator $39/mo** · **Founder $299/mo** (done‑with‑you,
  limited slots) · **$499 Validation Sprint** (one‑time). No revenue share, no lock‑in. Payments via
  **Polar** (Merchant‑of‑Record — handles VAT/tax globally, GitHub‑login checkout, free at our scale).
- **Money model** — keep total project spend low (BYOK + free model tiers + free hosting tiers).
  Go/no‑go: **~$10K in month 2, or kill it.**
- **Launch** — a **big‑bang surprise** drop (not build‑in‑public): a polished demo + Show HN / Product
  Hunt / X, a capped Founding offer for scarcity. Copy and a step‑by‑step runbook live in
  [`launch/`](launch/).

---

## 12 · The playbooks we used

Every major decision was made with a proven framework rather than vibes:

| Decision | Playbook |
| --- | --- |
| What to build / the wedge | **Lean Startup** (validate first) · **Blue Ocean** (new game) |
| Defensibility | **7 Powers** — counter‑positioning + brand + data/network |
| Scope & cadence | **Shape Up** (appetite‑driven, block‑by‑block) |
| Reversible vs. one‑way decisions | **Bezos two‑way doors** |
| Brand & rename | **The Brand Gap** (Neumeier) |
| Design (mono + glass + clarity) | **Apple HIG** — Clarity, Deference, Depth |
| Story/explainer | **StoryBrand** / **Made to Stick** |
| Catching small misses before launch | **The Checklist Manifesto** (grep every instance, don't eyeball) |
| Company operating model (Operate layer) | **EOS / Traction** |
| Testing | **Testing Trophy** (Kent C. Dodds) |

---

## 13 · The journey (how we got here)

A short changelog of the build, in order:

1. **Foundation** — scaffolded the app, the validation‑first onboarding, the agent loop, the API +
   real‑model wiring, auth, the nightly scheduler, chat, settings, history charts, the public board,
   and an a11y/perf/test hardening pass. (*tagged v0.1.0*)
2. **Operate layer** — added the EOS company‑OS surface. Now **on by default**; the launch build can
   freeze it with `NEXT_PUBLIC_OPERATE=0` to keep the launch surface lean until v0.2.0. (*v0.2.0*)
3. **Rebrand → competitor.inc** — renamed from the working title, re‑themed to monochrome black/white,
   monospace wordmark, custom logo. (*v0.3.0*)
4. **Consistency sweep** — a Checklist‑Manifesto pass to kill every stray old‑brand reference, unify
   logos, fix the social/OG image, and reframe BYOK as optional.
5. **Audit & hardening** — a full line‑by‑line code review (security + correctness): SSRF guard on the
   BYOK base URL, log scrubbing, store guards (no overlapping shifts, malformed‑response and
   corrupted‑storage handling), per‑company cron isolation, and collision‑safe IDs.
6. **Craft (Apple HIG)** — liquid‑glass depth across every surface + the plain‑language `/how-it-works`
   page.
7. **Repo extraction** — this clean, exclusively‑competitor.inc repository.
8. **The Delegation + readiness cross‑check** — a 3D office (`/delegation`) where the agent crew works
   and collaborates in real time (three.js, all‑original assets), and a **Launch Readiness Review**
   ([`docs/PLAYBOOK-launch-readiness.md`](docs/PLAYBOOK-launch-readiness.md)) that maps every promise
   above to the code that backs it.

---

## 14 · Repository map

```
app/                     Next.js routes
  page.tsx               Landing ("Prove it before you build it")
  how-it-works/          Plain-language product walkthrough
  dashboard/             The workspace: Validation Gate, Glass Box, Approvals, Chat, Operate
    settings/            Brand voice, team, engine/BYOK, billing, integrations, export
  delegation/            Retired → redirects to /dashboard (the crew now renders as the CrewBox there)
  live/                  Public real-time board
  join/                  Founding-member offer + waitlist
  login/                 Magic-link (Supabase) or guest mode
  orchestrator/, watch/  Retired → redirect to /dashboard (consolidated into the one engine)
  api/engine/            The engine endpoint (validate | shift | chat | goal | organic)
  api/chatops/messages/  Slack/Telegram messages reflected into the CrewBox (founder-gated)
  api/site-preview/      Sandboxed relay that frames the built site inside the app
  api/billing/polar      Polar (MoR) webhook → subscription entitlements (Standard Webhooks)
  api/cron/              Nightly heartbeat (Vercel Cron, fail-closed without CRON_SECRET)
  opengraph-image.tsx    Social/link-preview image
components/CrewBox.tsx   The live pixel-art crew box (banter + chat + Slack/Telegram reflection)
lib/engine/              Domain types, provider (validate + credible site fallback), server engine
                         (build-model override), organic-growth/organic-shift, chatops, access-gate
                         (trial credits), store, config, db
lib/supabase/            Client/server Supabase wiring (gated)
components/              LogoMark, route-loading fallback
supabase/migrations/     SQL schema (companies/activities/approvals + RLS)
scripts/smoke.mjs        E2E smoke + API fuzz (top of the Testing Trophy)
docs/                    Strategy & research (positioning, money plan, playbooks) — internal
  PLAYBOOK-launch-readiness.md   Launch Readiness Review: every promise → code → verified status
  AUDIT-flow-logic.md            Nielsen-heuristics flow audit (findings + fixes)
  COMPETITIVE-polsia.md          vs Polsia: counter-positioning playbook + roadmap to officially compete
  PLAYBOOK-revenue-10k.md        Path to $10K MRR (Walling lens) + surprise-launch, not build-in-public
  SECURITY-REVIEW.md             Defensive security + data-integrity audit (findings + fixes, for handoff)
  DESIGN.md                      The "Paper & Ink" design system (single source of truth)
  PLAYBOOK-conviction-voice.md   Conviction voice — honest energy that sells the dream
  COMPETITIVE-landscape.md       The full field (Polsia/cofounder.co/NanoCorp/HeyBoss…) + where we stand
  PLAN-beachhead-and-launch.md   Beachhead niche + positioning + surprise-launch plan
  PLAN-agent-intelligence.md     Polsia scorecard + agentic-AI roadmap (agentic yes, ML later)
  PLAN-two-layer-and-chatops.md  Office vs House, per-agent models, real coding agent, ChatOps
  PROCEDURE-preflight.md         Checklist-Manifesto pre-flight (catch cracks before shipping)
launch/                  Launch copy + the techie-friend runbook
```

---

## 15 · Handoff & deployment

For the person deploying this (the "techie friend"):

1. Read **[`launch/runbook.md`](launch/runbook.md)** — the step‑by‑step launch checklist.
2. **Deploy to Vercel** (recommended): import the repo, set env vars from the table above as needed.
   With none set, it runs in simulated/local mode — safe to ship a demo immediately.
3. **Optional services:**
   - **Supabase** for real auth + persistence — see `docs/SUPABASE-SETUP.md` and run
     `supabase/migrations/all-migrations.sql` (one-paste, idempotent).
   - **Vercel Cron** for the nightly heartbeat (already wired in `vercel.json` → `/api/cron`).
   - **Polar** (Merchant‑of‑Record) — create products + a checkout link → set `NEXT_PUBLIC_CHECKOUT_URL`.
     Then add a webhook endpoint (`/api/billing/polar`, events: `subscription.*` + `order.paid`) and
     paste its signing secret as `POLAR_WEBHOOK_SECRET`.
4. Gate `npm run qa` in CI before each deploy.

> This repository is **private**. To grant access, add collaborators in GitHub repo settings.

---

## 16 · Status & roadmap

**Status (2026‑08‑16).** The deployed site is at `competitor-inc-zeta.vercel.app`, and the honest state of
that deployment is **2 of 19 capabilities live**: a model key and Slack. GitHub, hosting and the database
are not connected there, so on the live site the org can **think** (plan, research, draft, decide) and
cannot yet commit, deploy or persist. **Nobody can sign in** either: the browser receives no Supabase
config. Turning that on is env-var work in Vercel, not code. See
[`docs/ACTIVATION-RUNBOOK.md`](docs/ACTIVATION-RUNBOOK.md) and `scripts/activate-prod.sh`.

Everything below is proven in the repo and reproducible locally with `npm run qa`. The build pipeline
itself was proven live twice (receipts below). Do not read "proven" as "running for users today": there
are none, and `$0` is settled.

- **Real full‑stack builds, proven live.** Describe an idea → the company creates a real GitHub repo →
  **Claude Sonnet** implements a real Next.js app (never the blank starter — a scaffold gate refuses to
  ship it) → an **AI Design Lead reviews the UI against an 8‑point craft rubric and commits fixes** →
  deploys to Vercel → a runtime smoke verifies a real page serves before the URL is ever surfaced.
  Proven on two consecutive builds:
  [`…post-lac.vercel.app`](https://a-campus-tutoring-marketplace-post-lac.vercel.app) (review commit:
  *"style: enforce spacing rhythm, weight budget, and a11y states"*) and
  [`…post-two.vercel.app`](https://a-campus-tutoring-marketplace-post-two.vercel.app) (review commit:
  *"fix: enforce single accent color, 8px spacing, mobile-first form"*). ~$0.13 of model spend per build.
- **A real org, not a flat crew.** 56 roles in a genuine hierarchy (`lib/org/organization.ts`); a
  project runs CEO → PM → Engineering IC → Team Lead → VP sign‑off → QA, with **org‑role‑level
  independent verification** (no position ever grades its own work) and a durable, crash‑safe run the
  nightly cron advances laptop‑off.
- **The Living Org (Team Room).** The customer directs their company like a founder directs leads:
  13 hand‑cast, clearly‑AI personas (Marcus · CEO, Vera · CTO, Dmitri · VP Eng, …) answer in character
  from their real job descriptions, relay work down the org, and roll results up — with the staged
  enterprise growing **only on measured signals** (verified live build → real signups → settled,
  repeating revenue), never for show.
- **Consent Rails (the invention).** The customer's "2%" collapses to **one signature**: a scoped,
  capped, instantly‑revocable standing mandate (`customer_mandates`, deny‑by‑default at every layer).
  The **irreducible floor never automates** — payout/KYC, contracts, above‑cap spend, deletion always
  come to the human, even if "scoped in". The nightly cron applies recorded phone approvals
  **laptop‑off through a double gate** (signed mandate + the policy engine's five gates), and a kill
  switch halts everything in one write.
- **The honesty architecture** (unchanged, everywhere): every proof is real (verified URLs, first‑party
  metrics), nothing claims "done" without verification, no fabricated numbers — the anti‑money‑printer
  floor is enforced in code and tested, not promised.
- **Payments:** intentionally OFF until the founder flips Polar config (work‑authorization cleared;
  one env flip). North star stays **PPU** (Proven Paying Users) with **TTFPO** as the pre‑revenue
  benchmark.
- **Next:** Block 5 hardening (migrations `0022` + `0027`, durable rate‑limit/spend caps, env‑guard) →
  the NU campus launch gate (`NEXT_PUBLIC_CAMPUS_GATE=1`), held dark until hardening passes.

---

*Built with a validation‑first philosophy. Prove it before you build it — then let the company run it.*
