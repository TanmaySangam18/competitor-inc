# competitor.inc

> **Prove it before you build it.**

> **Founder & creator: [Tanmay Sangam](https://www.linkedin.com/in/tanmaysangam/).** © 2026 Tanmay Sangam — all rights reserved. Proprietary &
> confidential: no use, copying, or distribution without written permission. See [LICENSE](LICENSE).

competitor.inc is an AI co‑founder that **validates an idea before it builds it** — it runs a real
demand test, tells you the honest truth (*build it, tweak it, or kill it*), and only then ships the
winner. Every action it takes is logged with proof, and it never spends a dollar or sends a message
without your say‑so.

This README explains the whole thing — the plain‑English story **and** the technical guts — so anyone
(technical or not) can understand what we built, why, and how to run it.

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
- **The Glass Box** — A public, real‑time log of *every* action, each with a cost and a proof artifact
  (a URL, a build result, or a metric). Total transparency.
- **Approval Inbox** — Anything consequential (spend over a threshold, outreach, deploys, deletions)
  is **queued for your approval** instead of done automatically.
- **Auto‑credit (not a cash refund)** — When a task fails, its cost is **credited back to your plan's
  work allowance** — you're simply never charged for work that didn't land (competitor.inc absorbs its
  own compute cost). It is *not* money returned to your card, and it's separate from real ad spend on
  your own connected accounts. You pay for work that worked.
- **Chat with your co‑founder** — A streaming chat to ask questions and direct the work; it queues
  consequential requests for approval rather than just doing them.
- **Autopilot / nightly heartbeat** — Toggle autopilot and it runs shifts on an interval; deployed, a
  nightly cron does the same for every operating company.
- **Public `/live` board** — A shareable, real‑time view of every company being validated and built —
  the Glass Box, out in the open.
- **`/how-it-works`** — A plain‑language, illustrated walkthrough of the whole product for newcomers.
- **Operate layer (EOS)** — An optional "company operating system" surface (Scorecard, Rocks, Issues,
  Weekly Review) inspired by EOS/Traction. *Feature‑flagged off by default.*
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
│   • useRoomie()  → store: companies / activities / approvals       │
│   • useConfig()  → soul.md, agents.md, engine + BYOK               │
│   • useAuth()    → Supabase session OR local "guest" mode          │
│   • persistence: localStorage (roomie:*)  ⇄  Supabase (if env set) │
└───────────────┬────────────────────────────────────────────────────┘
                │ fetch /api/roomie  { kind: validate | shift | chat } │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Server (Next.js route handlers, Node runtime)                     │
│   • app/api/roomie/route.ts  → validates input, calls the engine   │
│   • lib/roomie/server.ts     → callModel(): BYOK → env → simulated │
│   • app/api/cron/route.ts    → nightly heartbeat (Vercel Cron)     │
│   • the API key lives ONLY here (server-only), never on the client │
└──────────────────────────────────────────────────────────────────┘
```

**Key modules** (`lib/roomie/`):

- **`types.ts`** — the domain model (Company, Activity, ApprovalItem, ValidationResult, Experiment,
  Rock/Issue, ByokConfig, the `AGENTS` map).
- **`provider.ts`** — the **simulated engine** (deterministic, offline, no key) + `scoreIdea()`, the
  shared validation‑scoring logic used by both the simulated and real‑model paths.
- **`server.ts`** — `server-only`. Routes a request to a real model (your BYOK key → a server env key
  → otherwise throws and falls back to simulated), normalizes the output into our types.
- **`useRoomie.ts`** — the client store + all actions (create/validate, decide build, run shift,
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
orchestration + the Glass Box proof + the accumulating trust/data** — *not* the model call. The model
is a commodity brain we plug in. Most users run the managed default; BYOK is an optional tier for the
privacy‑ or cost‑conscious. This also means our **marginal inference cost is ~$0**, which is how the
project stays viable on a tiny budget without VC‑subsidized pricing.

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
| `ANTHROPIC_API_KEY` + `ROOMIE_PROVIDER=anthropic` | A real frontier‑model engine (server‑side) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real auth + persistent multi‑company store |
| `SUPABASE_SERVICE_ROLE_KEY` (+ `CRON_SECRET`) | The nightly heartbeat cron |
| `NEXT_PUBLIC_CHECKOUT_URL` | The "Claim a Founding seat" checkout link |

> `ROOMIE_*` are internal env‑var *names* (the codebase namespace), unrelated to the product brand.

---

## 10 · Quality: testing & the QA harness

We follow the **Testing Trophy** (lean on integration + a strong top E2E layer), with property/fuzz
testing via **fast‑check**. One command gates everything:

```bash
npm run qa     # = tsc --noEmit  &&  vitest run  &&  next build  &&  node scripts/smoke.mjs
```

`scripts/smoke.mjs` boots the **production build**, sweeps every route + the API, checks the brand
string, exercises the happy paths and `400`s, and **fuzzes 60 garbage payloads asserting zero 5xx**.
The codebase also went through a full **line‑by‑line security & correctness audit** (see the journey
below) before launch hardening.

---

## 11 · Business & strategy

- **Positioning** — a standalone brand with its own values (validation‑first, honest, human‑in‑control).
  The lead competitor is **Polsia** (autonomous AI company‑builder, 20% revenue cut); we
  **counter‑position** as the proof‑first, human‑in‑control, 0%‑cut alternative — full analysis +
  roadmap in [`docs/COMPETITIVE-polsia.md`](docs/COMPETITIVE-polsia.md) (internal).
- **Pricing** — **Validate $0** (free forever) · **Operator $39/mo** · **Founding $99 once** (launch‑only,
  ~150 seats). No revenue share, no lock‑in.
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
2. **Operate layer** — added the EOS company‑OS surface, gated behind a feature flag so the launch
   surface stays frozen. (*v0.2.0*)
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
  delegation/            The Delegation — a 3D office where the agent crew works (three.js, original assets)
  live/                  Public real-time board
  join/                  Founding-member offer + waitlist
  login/                 Magic-link (Supabase) or guest mode
  api/roomie/            The engine endpoint (validate | shift | chat)
  api/cron/              Nightly heartbeat
  opengraph-image.tsx    Social/link-preview image
lib/roomie/              Domain types, simulated provider, server engine, store, config, usage, db
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
     `supabase/migrations/0001_init.sql`.
   - **Vercel Cron** for the nightly heartbeat (already wired in `vercel.json` → `/api/cron`).
   - A **Merchant‑of‑Record checkout** (LemonSqueezy/Gumroad/Paddle) → set `NEXT_PUBLIC_CHECKOUT_URL`.
4. Gate `npm run qa` in CI before each deploy.

> This repository is **private**. To grant access, add collaborators in GitHub repo settings.

---

## 16 · Status & roadmap

- **Status:** feature‑complete and hardened; runs end‑to‑end in simulated/local mode today.
- **Before launch (needs the owner's credentials):** provision Supabase, set a checkout link, and
  (optionally) a model key; deploy to Vercel.
- **Roadmap candidates:** real model token‑streaming, deeper integrations (GitHub/email/ads behind
  per‑user auth), and turning on the Operate layer.

---

*Built with a validation‑first philosophy. Prove it before you build it.*
