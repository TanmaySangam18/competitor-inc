# ADR-0004: the 17-service connection map + /connect as the front door

## Context
Connect-First Reset (docs/CONNECT-FIRST-RESET.md §1–2): the product is connections + one decision
feed, not a dashboard. Onboarding = connecting the services a software company runs on. The seed
registry in lib/core/connections.ts had ~6 vague customer stubs (c-model, c-stripe, …) next to the
founder go-live switch; /connect was a client page reading a different "connectors" list off
/api/engine. Neither matched the doc's 17-service, tier-ordered map.

## Decision
- lib/core/connections.ts holds TWO sets in one registry:
  - `CONNECTION_MAP` — exactly the doc's 17 services, tiered T0 (brain + hands, required) → T1
    (voice) → T2 (money) → T3 (senses). Every entry: id, name, tier, department (consuming agent
    role), purpose, env vars, `unlocks` (what connecting enables), `degraded` (the honest line while
    absent), owner: "customer" (BYOK — company #0 is customer zero of the same map), required
    (true iff T0).
  - `FOUNDER_GO_LIVE` — the kept founder switch (entity+bank, vault, legal, kill switch,
    MAINTENANCE, …), now carrying the same richer shape. `goLiveReadiness()` math is unchanged.
  - The old c-* customer stubs are DELETED — superseded by the richer map (tests updated).
- Detection is env-based and honest: `configured` only when a declared env var is present in this
  deployment. Entries nothing in the codebase consumes programmatically yet (registrar, banking
  readout, support inbox, Cloudflare) declare `env: []` and report configured:false + a
  "tracked, not detected" note — never a guessed var, never faked. Where a real consumption path
  exists via the MCP long-tail connector (Sentry, CRM, analytics), the map detects those MCP_* vars.
- app/connect/page.tsx becomes THE front door: a force-dynamic server component (request-time env,
  so status can't go stale in a prerender) rendering the map by tier + the MCP long-tail section
  from `mcpStatus()`. Env-var instructions only — no OAuth buttons because no OAuth flows exist yet
  (later block). The page states it reflects the founder deployment (company #0); per-customer
  vaults come later.

## Consequences
- One source of truth for "what is connected" that both surfaces and agents read; every absent
  service has a pre-written honest degradation line, so no surface invents claims.
- Shared env vars between founder switch and map (model keys, Stripe) report consistently by
  construction; the duplication is intentional (different questions: "go live" vs "run a company").
- /connect no longer depends on /api/engine's connector list; that API is untouched for its other
  consumers. OAuth flows, per-customer vaults, and degraded-mode ASKS are explicitly later blocks.
