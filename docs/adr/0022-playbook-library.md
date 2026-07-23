# ADR-0022 — The Playbook Library: named strategies compiled onto the loop engine

**Date:** 2026-07-23 · **Status:** accepted · **Origin:** Ploy.ai teardown (founder: "add the same or better")

## Context

Ploy.ai ($27M, First Round + YC) sells agent-run marketing; its stickiest packaging idea is
**PloyBooks** — pre-built growth strategies executed by specialized agents on schedules or triggers.
We already had the superior *engine* (SOPs → durable org-runs → the outer loop with evidence-based
evaluation) but no packaging: a customer could hire a department, never pick a strategy by name.

## Decision

A **Playbook** is a named, bounded strategy that compiles to a loop **objective** (goal + evidence
criteria + iteration cap) and runs through the exact machinery everything else uses. No new execution
path, no new power, no scheduler of its own — the loop's heartbeat is the scheduler.

- `lib/core/playbooks.ts` — the registry (pure): launch-week · receipts-campaign · seo-sprint ·
  hackathon-win. Each declares `needs` (connection-map ids to act live), `rails` (compliance), and a
  `goal()` builder whose text **carries the rails inside the run**.
- `lib/loop/playbook-run.ts` — `startPlaybook()`: no loop ⇒ births one (ignition's shape); loop exists
  ⇒ appends the objective (owner-only). `all-met` wakes to `idle`; **`needs-human` stays paused** — the
  human's pause outranks any playbook.
- `app/api/playbooks/route.ts` — GET the library; POST starts one (auth + ownership-shaped tenant
  resolution: owned companyId → that tenant; founder → company #0). Rate-limited.
- `/services` — the library rendered with honest requirements ("runs live with X — without it, drafts
  queue"). A static page never claims live-ness; /connect owns live status.

## Consequences

- The demo sentence exists: "pick a playbook; the org runs it." Ploy's packaging, our governance.
- Only strategies with real machinery behind them may be listed (same honesty rule as the service
  catalog). Competitor-watch stays OUT until task #74/market-watch ships.
- Registry integrity is tested: unique ids, needs ⊆ connection map, rails present in goal text,
  bounded iteration caps.
