# Building the autonomous software company — the block plan

Mandate (2026-07-08): competitor.inc IS an AI software company — real org (not 6-7 agents), agents named
by position, with identities (numbers, Slack/WhatsApp presence), that **develop, license, support, AND
sell** autonomously. Kill per-item approval → policy-based autopilot with caps + a kill switch. Paid stack,
trials first, proof → funding. Goal: $10K collected while proving it. Honesty floor is non-negotiable
(no scraped spam, no cold AI robocalls, named-AI disclosure).

Legend: 🟢 keyless (I build it) · 🔑 needs a founder account (the 2%) · ✅ done · 🔧 in progress

---

## Block 0 — The organization ✅ 🟢
- `lib/org/organization.ts`: 11 departments, 55 positions, one CEO-rooted tree; each role has JD +
  responsibilities + KPIs + team + manager + Slack channel + escalation + `humanApprovalFor`.
- `execFn` maps each role to the engine's 8 execution roles (model routing + tooling reused).
- `validateOrg()` + tests: one root, valid managers, no cycles, complete JDs. QA-green.

## Block 1 — Autopilot governance flip 🟢
Replace "draft → you click approve → you send" with **standing authorization + caps + kill switch**.
- Extend `lib/engine/policy.ts`: decisions read each role's `humanApprovalFor`; everything else
  auto-executes within per-class spend/volume caps; only high-risk classes queue for the founder.
- Approval Inbox becomes an exception queue + a live kill switch, not a turnstile.
- Property tests: forbidden/high-risk never auto-runs; routine acts run without a click; caps hold.

## Block 2 — Identities + the team room 🔑 (Slack, Twilio)
- Slack workspace; a bot user per senior role (name = position); channels from the org (`#exec`,
  `#engineering`, `#sales`, …). Twilio number per outward-facing role (SMS/voice identity).
- Reporting cadence: standup + EOD posts up the chain (IC → lead → PM → CEO → founder), like a team.
- WhatsApp = 1:1 founder briefings + approvals (WA Business API has no group chat — Slack is the room).

## Block 3 — Autonomous revenue engine 🔑 (Clay/Apollo, Instantly/Smartlead + domain, Vapi)
- SDR sources tight-ICP leads → personalized multi-channel outbound (email/LinkedIn/consented SMS),
  auto, under caps, on a warmed secondary domain. NO scraped blasts.
- Prospect books → AE runs the booked/inbound call via a voice agent (Vapi) → closes → records
  **verified** revenue. NO cold AI robocalls.
- CRM (Attio) is the shared memory the sales team drives.

## Block 4 — The factory: develop → license → support 🟢🔑 (Stripe/Keygen)
- Reuse the full-stack build pipeline (already live) as "develop."
- License issuance/enforcement (Keygen or Stripe entitlements) = "license"; billing ops reconciles to
  verified revenue.
- Per-product support inbox routed to Tier-1/Tier-2 support agents = "support."

## Block 5 — Durable brain + funding-grade telemetry 🔑 (Anthropic API, Temporal Cloud, LangSmith/Sentry)
- Claude Agent SDK on the Anthropic API (Opus 4.8 strategy / Sonnet 5 execution).
- Temporal Cloud: the company runs with the laptop shut (durable, retried, observable).
- LangSmith/Langfuse + Sentry: every agent action traced → the proof investors want.

## Block 6 — The surface: "the first AI company you can hire" 🟢
- Org-chart view (departments → teams → roles, live status), a single live company feed, and the
  hire/brief flow. Consistent with the current white/grey theme.

## Block 7 — Proof + funding pack 🟢
- Package: Glass Box transcripts + verified `revenue_events` + cost-per-outcome. Recursive proof: our
  own agents sold the pilots.

---

## The $10K motion (runs alongside, from Block 2/3)
10 pilot slots × ~$1k/mo — "your AI outbound + ops team, running while you sleep." Undercuts single-function
AI-SDR pricing (11x/Artisan) with a whole floor. ≤3 channels; no client >40%.

## The 2% — founder account signups (I hand you a paste-ready checklist per block, like the launch switches)
Anthropic API (+ Claude for Startups credits) · Slack · Twilio · Instantly or Smartlead + a fresh domain ·
Clay or Apollo · Vapi · Temporal Cloud · Attio · Stripe + Keygen · Vercel Pro + Supabase Pro ·
LangSmith/Langfuse + Sentry. ≈ $700–1,200/mo + tokens; month one mostly on free trials.
