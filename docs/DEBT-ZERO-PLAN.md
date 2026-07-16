# DEBT-ZERO — the staff-engineer takeover (founder directive 2026-07-15)

Context: $10K goal PAUSED. Priority = prove the platform works (everything on except payments).
Precondition for that proof: a codebase future AI agents can extend without friction. Not a
superficial refactor — a systematic audit-and-kill, with every decision recorded as an ADR.

## Method (each phase gated by full QA; nothing "cleaned" that isn't verified)

**Phase 0 · Ground truth (measure before touching)**
- Inventory: every route (app/**), component, lib module; per file — imported-by count, last-commit
  age, test coverage. Automated script → docs/audit/INVENTORY.md (the evidence, not vibes).
- The reachability graph: entry points = pages, API routes, cron, CLI, MCP. Anything unreachable
  from an entry point is a kill candidate. Anything reachable but behind a dead flag is too.

**Phase 1 · The kill list (delete forever — the no-quarantine rule)**
- Known suspects from this session alone: retired dashboard surfaces (3 chat UIs already merged once;
  the 6-tab cockpit dies on the Stream build), stale panels (GTM/Gauge/DemandTest overlap), the
  /delegation remnants, superseded onboarding flows, dead flags (NEXT_PUBLIC_OPERATE=0 path),
  abandoned experiments (CrewBox vs CrewBoard duplication), unused engine paths superseded by
  lib/core + lib/loop. Each kill = one commit, QA-green, listed in the ADR.

**Phase 2 · Consolidation (one thing per problem)**
- ONE governance path: decide()/autopilotMode/governAction is the only spine; no local re-checks.
- ONE orchestration story: loop-engine (outer) → org-run (inner) → executors; retire parallel runners.
- ONE persistence pattern per domain (the *-db.ts convention everywhere).
- ONE UI shell: the Stream + /connect (connect-first reset) replaces cockpit surfaces as they're rebuilt.

**Phase 3 · Standards (written once, enforced by CI)**
- Naming: lib/core = pure + governed, lib/engine = execution + persistence, lib/org = the org model,
  lib/loop = loop engineering, lib/sim = proving grounds. Files kebab-case; tests co-located.
- Every module: banner comment (what/why/honesty notes) — the house style already in the good files.
- CI gains: unused-export check + import-cycle check + the license gate (exists) on every push.

**Phase 4 · The ADR practice (compounding docs, our own medicine)**
- docs/adr/NNNN-title.md — Context/Decision/Consequences, one per architectural decision, written by
  whichever agent (or session) makes the call. The product-memory discipline applied to ourselves.
- ADR-0001 records this practice. The Loop Engine's learnings store references ADR numbers so
  the org's own iterations cite the decisions they build on.

**Phase 5 · Benchmarks (study, never copy)**
- postiz-app (AGPL-3.0): architecture IDEAS only — monorepo layout, worker/queue split, provider
  abstraction. LEGAL LINE: no code, no derived expression (our gate blocks AGPL; recorded here).
- Omniroute AI: product-experience benchmark — BLOCKED on a reachable URL from the founder.

## Order of execution
0 (inventory) → 1 (kills, biggest first) → 2 (consolidations, one per PR-sized commit) → 3 (CI
standards) → 4 runs CONTINUOUSLY from today. Website redesign rides the connect-first Stream build,
not a coat of paint on the old shell.

## Definition of done
A new agent session can: find any capability from lib/ structure alone; see why every module exists
(banner + ADR); trust that everything imported is alive; and extend without touching a graveyard.
