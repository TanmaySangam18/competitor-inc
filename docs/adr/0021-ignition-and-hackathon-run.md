# ADR-0021 — Ignition (the company starts itself) + the Hackathon Run (find → build → package)

Date: 2026-07-23 · Status: accepted · Driver: founder directive (Friday go-live meeting with Sundai club) —
"the moment all the switches are turned on, the agents should market the competitor by themselves… the
Hackathon service finds, builds and submits… all the user has to do is connect the accounts and relax."

## Context

Every autonomous loop existed but nothing BIRTHED one. The cron heartbeat ticked loop tenants that no code
path ever registered (`insertLoop` had zero callers), so a fully-keyed deployment still sat idle until a
human created a loop by hand. Separately, the Hackathon Radar (ADR-0014) found and planned but never
executed: `winPlan()` returned a goal string and stopped.

## Decision

1. **Ignition** (`lib/loop/ignition.ts`, wired into `/api/cron`): every heartbeat runs an idempotent check —
   the first tick where a model key exists (cognition) and company #0's loop doesn't, the loop registers
   ITSELF under a founder-owned account, with a marketing-first roadmap (plus a hackathon objective when the
   radar finds a live cash-prize event at birth). Readiness is env-detected — the same truth as /connect —
   and the ignition digest SAYS what's dark ("running degraded-but-honest without: …"). Flip the env keys →
   the next heartbeat starts the company. No button.
2. **Hackathon Run** (`lib/loop/hackathon-run.ts` + `/api/hackathons` modes): `autoHackathon` = scan → pick
   the strongest open hit → `winPlan` → a REAL durable org-run (the same crash-safe DAG the cron advances
   laptop-off). `submissionPackage` drafts the paste-ready Devpost fields from REAL receipts only (absent
   links stay absent), with AI authorship disclosed.

## The floor that does not move

- The final mile of a hackathon entry — creating the platform account, accepting the event's rules/ToS,
  pressing Submit — is the same six-reason human hard-stop floor as onboarding (ADR-0017). The package
  ends with `humanSteps`; the org never performs them. "Impeccable" = everything up to the button.
- Ignition changes WHEN loops start, not WHAT they may do: every downstream act still passes the kill
  switch, the policy matrix, the publishing mandate (ADR-0012), the treasury envelopes (ADR-0020), and the
  human money floor. Compliance Step 0 (abort AI-banning events) stays the first task of every win plan.
- No founder account resolvable (FOUNDER_USER_ID or an allow-list email signed in) ⇒ no ignition: an
  autonomous loop must have a real, accountable owner.

## Consequences

- The "car ignition" experience is real and demonstrable: keys on → cron tick → loop born → org-runs spin →
  Slack digest announces it → governed marketing posts from real receipts.
- The loops table gains its first writer; `TENANT_ZERO = "competitor.inc"` is the reserved company-#0 tenant.
- Customer-tenant ignition (per-customer loops born from THEIR connections) is the natural next block —
  same check, keyed to their vault rows instead of deployment env.
