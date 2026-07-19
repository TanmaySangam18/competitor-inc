# ADR-0015: House-keys trial enforcement — the cap gets teeth

## Context
The trial policy (lib/engine/house-trial.ts, cto.new adoption) existed as a pure model; real builds
stayed hard founder-gated in /api/engine?probe=fullstack. Setting HOUSE_TRIAL_BUILDS_PER_DAY would
have been honorary. The founder's free-pilot plan needs the valve real: strangers get N builds/day
on house keys, hard-capped, zero politeness assumed.

## Decision
- user-limits gains kind "build" whose daily limit = HOUSE_TRIAL_BUILDS_PER_DAY (0 default = trial OFF).
- The build route: founder unchanged; non-founder requires signed-in + trial open + an ATOMIC
  bump_usage check that must be ENFORCED — builds fail CLOSED on an unverifiable allowance (503),
  cap reached returns 429 with houseTrialVerdict's honest copy (reset time + BYOK path). A real repo
  creation never rides a fail-open counter.

## Consequences
Flipping HOUSE_TRIAL_BUILDS_PER_DAY=3 in Vercel now actually opens + bounds the free taste. Depends
on migration 0022's bump_usage RPC (already applied). Client-side trial-credits UX remains separate
(play-money); this governs REAL builds only.
