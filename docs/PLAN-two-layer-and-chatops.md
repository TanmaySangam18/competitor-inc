# Plan — two-layer agents, per-task brains, and ChatOps

> Decided through the house playbook mix: **Levels** (smallest validated wedge, default-alive) for
> sequencing · **7 Powers** (counter-position + a data/brand moat) for strategy · **Walling** for
> revenue · **agentic-AI best practice** (right brain per task, real sandboxed coding agents,
> verify-before-done, human-gated) for the engine. Standing constraints hold: **surprise-launch (no
> build-in-public)**, **human-in-the-loop + proof**, **honesty**. Companion to
> [`PLAN-agent-intelligence.md`](PLAN-agent-intelligence.md) and [`COMPETITIVE-polsia.md`](COMPETITIVE-polsia.md).

---

## 1 · "Marketing, sales, fundraising, all autonomous" — what we do, honestly

Polsia runs those functions with little human gating. We cover the **same breadth** — the 5 agents +
the gated execution layer already span build, marketing/ads, support, growth, outreach, payments — but
**proof-first and approval-gated** (the counter-position). Honest scoping:

- **Marketing / sales / support** → yes, real (Phase 3 is wired: ads webhook, email, Stripe), each
  routed through the Approval Inbox.
- **"Fundraising"** → we **draft** investor updates / a data-room / a deck from the real Glass-Box
  metrics, queued for the founder. We do **not** autonomously *raise* money — no tool does; Polsia's
  "raise" was the **founder's** narrative, not the agent wiring a round. Saying otherwise is the exact
  over-promise we beat them on.

**Plan:** keep parity on functions, keep the gate + proof. That's the whole differentiator.

---

## 2 · Two layers: the **Office** (for the user) and the **House** (for competitor.inc itself)

The founder's insight, named:

- **The Office** = the current `/delegation` floor + dashboard — the agent crew working **the user's**
  company. (Built.)
- **The House** *(new)* = a **separate** agent crew that works **exclusively for competitor.inc** —
  marketing, demand capture, sales, the launch blitz — using our own product on ourselves.

This is **"customer zero" / dogfooding**, and it's a real **7 Powers moat**: our growth is itself a
live proof artifact ("the company that runs its own growth on its own agents"), and it compounds a
data advantage. It also feeds the public `/live` board. Tanmay is the House's approver; it follows the
**surprise-launch** rule (demand capture + launch blitz + owned channels, **never a public diary**).

**Build:** a House workspace distinct from any user Office (own crew, own ledger, founder-gated),
surfaced on `/live` as "competitor.inc, run by competitor.inc."

---

## 3 · The right brain per task (Opus 4.8 / Codex / "ultracode") + real coding agents

**Per-agent model routing** — give each agent a best-fit model instead of one model for all:

| Agent | Default brain | Why |
| --- | --- | --- |
| **Forge** (engineering) | **Opus 4.8** at high/xhigh effort ("ultracode") | top coding + long-horizon agentic |
| **Apex** (strategy) | **Opus 4.8** | hardest reasoning |
| Pitch / Surge / Guard | **Sonnet 4.6** or **Haiku 4.5** | cheaper, fast, good enough |
| Banter / simple classification | **Haiku 4.5** (`claude-haiku-4-5`, ~$1/$5 per 1M) | near-free chatter |
| Any agent (user override) | **BYOK** — Opus, **Codex/GPT**, Groq, local | user's key, user's bill |

Model IDs: `claude-opus-4-8` ($5/$25, 1M ctx) · `claude-sonnet-4-6` ($3/$15) · `claude-haiku-4-5`
($1/$5, 200K). The engine is already multi-provider — this adds a **per-agent model map** in config.

**Real coding agent (the big one).** To make Forge actually *write code, run tests, and open a PR*
(not just commit a file), use the **Claude Agent SDK / Managed Agents**: spin up a sandboxed agent
**session per task** ("instantly fired up"), mounted on the GitHub repo, that builds → tests →
verifies → opens a PR. This **supersedes the Phase-1 GitHub stub** in `execution.ts` and is the
strongest possible "verify-before-done." Gated by a model key + `GITHUB_TOKEN`.

---

## 4 · Agent identities + a WhatsApp team group (ChatOps)

**InkBox AI** ([inkbox.ai](https://inkbox.ai/), [GitHub](https://github.com/inkbox-ai/inkbox), YC S26)
gives each agent a **persistent identity** — its own email, phone number, public URL, and scoped vault.
With identities in place:

- Create a **WhatsApp group** with the founder + the 5 agents (each posting under its InkBox identity).
- Agents post updates and **queue consequential actions there**; the founder **approves by replying**
  ("approve" / "reject") — the Approval Inbox, moved to **where the founder already lives**.
- Implementation: **WhatsApp Cloud API / Twilio**, or the **Vercel Chat SDK** (one codebase →
  WhatsApp / Slack / Telegram / Discord). Same approval backend as the web app, so it stays consistent.

**Playbook fit:** meet the founder on mobile (distribution + UX), and it amplifies the "agents are
named teammates" brand. Still gated, still proof-logged.

---

## 5 · Build order (Levels — smallest validated wedge first)

1. **Per-agent model routing** — ✅ **DONE** (foundation): `modelForAgent()` routes Forge/Apex → strong
   (`MODEL_ID`), other agents → `MODEL_CHEAP` (default Haiku 4.5); wired into validate/chat/shift,
   BYOK-compatible, unit-tested. Full per-agent *task* calls extend it later.
2. **Forge → real coding agent** (Claude Agent SDK / Managed Agents) — ⏳ **gated scaffold**: the
   `execution.ts` GitHub build + verify-before-done is live-ready behind `GITHUB_TOKEN`; the Managed-Agents
   upgrade (sandboxed build → test → PR) is the activation step — needs a model key + token.
3. **The House** — ✅ **DONE**: `/house` (competitor.inc, run by its own crew), the floor labeled
   **"The Office"**, cross-linked from `/live`. Simulated; consequential moves founder-gated when keys connect.
4. **ChatOps** — ⏳ **awaiting services**: InkBox identities + WhatsApp approvals (Chat SDK / WhatsApp API)
   need third-party accounts; reuses the Approval-Inbox backend. The techie-friend / post-launch phase.

*Status 2026-06-19: **#1 + #3 shipped**; **#2 + #4 are gated/awaiting external credentials or services**
(both deferred to the techie-friend phase by design).*
