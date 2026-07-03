# Backend Provisioning — making "run a real SaaS with user accounts" true

**Status:** spec + tested foundation shipped (`lib/engine/backend.ts`, 13 tests). Real provisioner is
gated on founder infra (see Backend dependencies). This is the organ that upgrades a built *static
site* into a real product with a database, end-user accounts, and server functions — the missing piece
between "we built a landing page" and "we run a company that can charge."

**Playbooks:** TRIZ Ideal-Final-Result (get the outcome without the costly resource) · Levels/Walling
(cheap infra, ship, then revenue) · Crossing the Chasm whole-product · our own policy-engine governance
· Felix's public 3-layer-memory pattern (Nat Eliason / OpenClaw).

---

## 1. The architecture decision (and why)

**Do NOT provision a separate database per customer.** A Supabase-project-per-tenant is slow (minutes
to spin), costly, and an ops nightmare at scale. Instead: **one shared multi-tenant Postgres, with hard
per-tenant isolation via `tenant_id` + Row-Level Security**, plus physically namespaced table names as
belt-and-suspenders. The "per-tenant DB" promise is kept by *provable isolation*, not physical
separation — the same guarantee at a fraction of the cost. This mirrors the isolation contract already
in `hosting.ts` (`isolationContract()`), one layer deeper.

Three organs, all on the existing stack (no new vendor):

| Organ | How | Already have? |
|---|---|---|
| **Database** | Shared Postgres (Supabase); per-tenant namespaced tables + RLS (`tenantTable`, `rlsPolicyFor`) | Supabase live |
| **User auth** | Supabase Auth for the *end-users of the built product* (separate from competitor.inc's own auth) | Auth stack exists |
| **Functions** | Tenant-scoped Next API routes under `/api/app/<ns>/<fn>` (`scopedFunctionPath`) | Next runtime |

## 2. What shipped now (foundation, tested)

`lib/engine/backend.ts` — pure, offline-safe, 13 tests:
- `BackendSpec` / `EntitySpec` / `FunctionSpec` — the schema the model authors from an idea (one layer
  below `generateSiteFiles`).
- `BackendProvider` interface — the contract a real provisioner conforms to (parallels
  `HostingProvider`); first conformer will be `SupabaseBackendProvider`.
- Isolation: `tenantTable`, `scopedFunctionPath`, `tenantsIsolated` (runtime guard before any write),
  `rlsPolicyFor` (emits the SQL RLS policy).
- `validateBackendSpec` — caps entities/functions, enforces auth sanity (no user-owned table without
  auth) before anything is provisioned.

## 3. The Felix Operator (the creative core)

Nat Eliason's Felix (~$195k in weeks, OpenClaw) credited a **3-layer memory system** as "the single
biggest unlock," with sub-agents (Iris=support, Remy=sales). We replicate the **pattern** (public, not
his code): **every provisioned company gets its own persistent Operator agent** that runs the backend's
ops — support, sales, growth, ops — with a durable brain:

- **Layer 1 — Semantic** (`SemanticFact[]`): the knowledge graph. Durable facts (refund policy, best
  channel, ICP) with confidence + hit-count.
- **Layer 2 — Episodic** (`Episode[]`): the recency-bounded event log — what happened, in order.
- **Layer 3 — Procedural** (`Skill[]`): playbooks the operator can apply, role-tagged.

The unlock is **`consolidate()`**: when the same lesson recurs in the episodic log, it's promoted to a
durable semantic fact and its confidence rises. The operator gets *wiser* over nights, not just
heavier. `composeContext()` returns a budget-bounded, role-filtered brief for the next model call —
the difference between a smart agent and an expensive one. This is how "40 years of experience"
accrues: sourced skills (Layer 3) + memory that compounds (Layers 1–2), on a top model.

**Governance is not bypassed.** The Operator runs the *machine* autonomously, but every outward or paid
action (email a user, charge, deploy, post) still routes through `decide()` and the Approval Inbox.
Autonomy inside the caps; a human on the money. That's the moat, not a limitation.

## 4. Backend dependencies (the standing rule — implemented vs stub)

| Dependency | Status | Note |
|---|---|---|
| `lib/engine/backend.ts` foundation + tests | ✅ implemented | pure, offline-safe |
| Shared Postgres (Supabase) | ✅ available | already live |
| `SupabaseBackendProvider` (real provision) | ⛔ **not built** | needs a migration-runner with service role; DDL-per-tenant path |
| End-user auth instance for built products | ⛔ **not built** | Supabase Auth, second audience; founder infra |
| Tenant function runtime `/api/app/[ns]/[fn]` | ⛔ **not built** | dynamic route + per-tenant rate limits |
| Operator agent loop wired to cron | ⛔ **not built** | memory persistence table + nightly step |
| Operator memory persistence | ⛔ **not built** | `operator_memory` table (jsonb per tenant) |

**Honest line:** none of §4's ⛔ rows are shipped, so there is no dead button in the UI today — the
capability is a typed foundation + a spec, exactly as the integration-audit rule requires. Building the
⛔ rows is the next real work, and it needs founder infra decisions (shared-DB DDL policy, a second
Supabase Auth instance for end-users, cost caps per tenant).

## 5. Build order (phased, each shippable)
1. **P1 — `SupabaseBackendProvider`** + `operator_memory` table + `tenantsIsolated` guard in the write
   path. Provision a real per-tenant schema from a validated `BackendSpec`.
2. **P2 — Tenant function runtime** (`/api/app/[ns]/[fn]`) with per-tenant rate limits + RLS-bound reads.
3. **P3 — Operator loop**: nightly step composes context → acts within caps → records + consolidates
   memory → queues consequential actions to the Approval Inbox.
4. **P4 — End-user auth** for built products (sign-up on the customer's own SaaS).
5. **P5 — Eject**: export the tenant's schema + data as a portable dump (keeps the no-lock-in promise).

## 6. Risks
- **Noisy-neighbor / cost**: one tenant's Operator could burn tokens/DB — per-tenant caps via the
  existing policy `spend`/budget model; hard stops.
- **RLS mistakes = cross-tenant leak**: mitigated by physical name-scoping + `tenantsIsolated` guard +
  RLS + tests; add a property test before P1 ships.
- **Second auth audience confusion**: keep competitor.inc's founder auth and the built product's
  end-user auth strictly separate (different Supabase projects or clearly separated schemas).
