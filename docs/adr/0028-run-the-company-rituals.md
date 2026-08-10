# ADR-0028: Run-the-company rituals — all ten workflow gaps closed in one lane

**Date:** 2026-08-06 · **Status:** accepted · **Driver:** docs/WORKFLOW-GAP-ANALYSIS.md (the canonical
SaaS workflow map crossed against the implemented org). Founder directive: all ten ranked gaps built now.

## Context

The gap analysis found the org strongest at governed execution and weakest at the workflows that run a
company **across time**: closes, forecasts, renewals, reviews. Of the existential ten, one was fully
missing (invoicing = R1, founder-side config) and the rest of the ranked list was ritual-shaped:
recurring, calendar-driven, artifact-producing work that human companies run in meetings and we run on
the daily cron tick.

## Decision

Build all ten as **pure modules + cadence gates on the existing tick** (the same fail-soft pattern as
every other section: gated, honest empties, never breaks the heartbeat). Three honesty rules govern the
lane:

1. **Armed, not faked.** Modules whose inputs do not exist yet (customers → NPS/win-loss/retention,
   auditors → SOC 2) ship as working machinery with honest empty states ("No decided deals yet."),
   and refuse to render scores below minimum sample sizes. Nothing synthetic ever reaches a metric.
2. **Committed-only survival math.** The 13-week forecast counts only committed inflows toward the
   runway line; likely/speculative are displayed, never summed in. The monthly close names its
   unconnected legs (Polar settlement export, bank readout) instead of pretending a three-way match.
3. **Personnel actions stay human.** The Agent Review Cycle recommends keep/retune/retire; every
   retune and retire is queued for the founder. Detractor follow-ups and testimonial asks likewise.

## The ten, and where each landed

| # | Gap | Landing |
|---|---|---|
| 1 | R1 checkout | Code side complete (billing.ts + Polar webhook); /connect payments card now shows the true arming env (`NEXT_PUBLIC_CHECKOUT_URL`); remainder is founder-side Polar product creation |
| 2 | Retention Desk | `lib/org/retention-desk.ts` — health scoring, weekly receipt review per buyer, renewal checkpoints, churn-save escalation |
| 3 | Forecast Ritual | `lib/org/forecast.ts` — 13-week cash + per-stage pipeline, weekly on the tick |
| 4 | Monthly Close | `lib/org/monthly-close.ts` — reconcile + signed close receipt, monthly on the tick |
| 5 | Death-preventers | `renovate.json` (human-merge, CI-arbitrated) + `lib/org/drills.ts` + backup-restore runbook |
| 6 | Agent Review Cycle | `lib/org/agent-review.ts` — quarterly calibrate/retune/retire over real performance data |
| 7 | Postmortems + OKR retro | `lib/org/postmortem.ts` (blameless Sev-1 artifact + tracked action items) + quarterly objective scoring in agent-review |
| 8 | Win/loss + NPS | `lib/org/winloss.ts` + `lib/org/nps.ts`, armed; SOP steps on the Account Executive + CSM |
| 9 | Human discovery | Discovery SOP on the UX Researcher (interviews + beta program), activates at pilot #1 |
| 10 | SOC 2 evidence | `lib/org/evidence.ts` — control catalog + evidence records + monthly snapshot with the mandatory not-certified header |

New SOPs: Agent Review (chief-of-staff), Close & Forecast (finance-controller), Discovery
(ux-researcher); extended: Deal (win/loss review), Success (receipt reviews, renewals, close-the-loop).

## Cadences on the tick

Weekly (Mondays): forecast section. Monthly (1st): close + evidence snapshot + due-drill report.
Quarterly (first Monday of Jan/Apr/Jul/Oct): agent review + objective scoring. Delivery rides the
existing digest channels (email/Slack) when configured; every section fails soft.

## Follow-ups

- Durable decision-queue persistence for ritual escalations (v1 delivers them in the ritual artifact
  and response JSON; the approvals desk wiring is the existing pattern to extend).
- Polar settlement export + bank readout connections to complete the close's three-way match.
- First backup-restore drill run (founder Supabase access required) turns "not yet run" into evidence.
- Trust page: surface `controlsCoverage()` once evidence accumulates.
