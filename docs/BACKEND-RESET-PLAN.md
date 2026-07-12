# Backend Reset — First-Principles Plan (2026-07-12)

Founder directive: **one company operating system** that runs Competitor itself AND is sold to customers
("drink our own champagne"), backend-first, API/terminal-operable, frontend demoted. Question everything;
remove what doesn't serve the vision. This plan is grounded in a full code audit (not assumptions).

## The honest finding (what's actually wrong)
The problem is **not** "weak backend, start over." It's **fragmentation + no headless spine**:
- **~16.4k LOC in `lib/engine` + 2.7k in `lib/org` = ~3.5 overlapping "AI company" models.** Concretely:
  - **≥5 agent rosters** (`types.ts` AGENTS/9, `crew.ts`/5 codenamed, `dynamic-crew.ts`, `specialists.ts`/230, org `organization.ts`/66, `personas.ts`/13, `role-titles.ts`/9). `crew.ts` still uses retired codenames.
  - **2 orchestration conceptions** (engine `orchestrator`+`supervisor`+`org-run`+`operating-loop` vs org `autopilot`+`decision-queue`+unwired `parallel`), plus a legacy flat planner still in `orchestrator.ts`.
  - **Duplicated governance** — kill-switch/forbidden-floor logic in BOTH `policy.ts` and `autopilot.ts`; approvals split across engine `approvals`, org `prepared_decisions`, org `customer_mandates`.
  - **5 org "pillar" files built but UNWIRED** (`parallel`, `substrate`, `verification`, `ops-desk`, `executive-desks`) — restate engine capabilities, zero importers.
- **The backend isn't headless** — client code lives *inside* `lib/engine` (`useEngine.ts` 48KB, `config.ts` `"use client"`, `EngineContext.tsx`, `useAuth.ts`). The OS can't run without the React app.
- **No API/CLI/MCP-first operability** — everything flows through the Next.js app + one giant React hook. `lib/mcp/tools.ts` describes an MCP transport that doesn't exist; `coworker/` is standalone, not wired.

**But the crown jewels are real and proven — do NOT throw them away:** the policy/decision engine (`policy.ts`), spend caps + reversibility, verify-before-done (`execution.ts`, `grounding.ts`, `supervisor.ts`), the real build muscle (`fullstack-build`/`build-github`/`aider`, proven live S3), durable runs (`org-run`), pgvector memory, Stripe Connect, and — critically — **the tenant model already supports the vision**: `user → company → everything` with RLS. **Competitor is just `company #0` owned by the founder.** "One OS for both" is architecturally close; the gap is consolidation + a headless API/CLI, not a rewrite.

## Target architecture — one company OS
```
Clients (interchangeable):   CLI (terminal)  ·  Web (thin)  ·  Coworker (MCP)
            │           one contract: API (REST/RPC) + MCP transport
┌───────────▼──── CORE (headless, framework-free — the product) ────────────┐
│  Org       — ONE roster: 66 positions → 9 governed exec functions          │
│  Runs      — ONE durable orchestrator + org-plan DAG                        │
│  Decisions — ONE policy/approval spine (policy.ts authoritative)            │
│  Memory    — company · product · agent · grounding (one layer)             │
│  Tools     — ONE governed gate: build/deploy/pay/outreach/booking          │
│  Products  — built-product tenancy + revenue (Stripe Connect)              │
│  Invariants (cross-cutting): honesty · verify-before-done · spend caps ·    │
│              kill switch · reversibility · human-reserved acts              │
└───────────┬─────────────────────────────────────────────────────────────────┘
       Supabase (Postgres + RLS) — one tenant model: user → company → all
                                    (Competitor = company #0, dogfood)
```
Principle: **every capability is a service method on the core, exposed identically via API + CLI + MCP, governed by the one policy engine, isolated by the one tenant model.** The frontend becomes optional.

## Keep · Consolidate · Kill · Build

| Verdict | Items |
|---|---|
| **KEEP (crown jewels)** | `policy.ts`, `spend-cap`/`reversibility`/`apply-decisions`, `execution.ts` (`runAction`/`verifyProof`), `grounding.ts`, `supervisor.ts`, the build stack (`fullstack-build`/`build-github`/`aider`/`real-executor`), `org-run*` durable runs, `memory.ts` (pgvector), `products`/`product-memory`/`tenant_backends`, `stripe-connect`, `polar`, RLS migrations, the `user→company` tenant model. |
| **CONSOLIDATE** | (1) 5 rosters → **1** canonical org model (`organization.ts` 66-role + `execFn` spine is the base; fold in personas/titles; kill codenames). (2) Orchestration → **1** durable run engine (`org-run` + org-plan DAG; retire the legacy flat planner; fold `operating-loop`/`autopilot` governance in). (3) Governance → **1** spine (`policy.ts` authoritative; delete duplicated kill-switch in `autopilot`; unify approvals + prepared_decisions + mandates). (4) Memory → **1** layer. (5) **Move client code OUT of `lib/engine`** (`useEngine`/`config`/`EngineContext`/`useAuth` → `app/`), making `lib/` headless. |
| **KILL (pending your OK — irreversible)** | Unwired pillars if not folded in: `parallel.ts`, `substrate.ts`, `verification.ts`, `ops-desk.ts`, `executive-desks.ts` (wire-or-delete, decided per file). Legacy flat planner (`LEGACY_ACTION`/`HANDOFF`). `storage.ts` roomie→cofounder migration. Stale codenames in `crew.ts`. Staged-forever `api/import/verify`. |
| **FREEZE (not delete)** | The frontend. Keep the working teal dashboard as one thin client + the proven demo; stop investing in it; trim demo-only experiments (`nu/`, `score/`, `radar/`, marketing pages) only once the API/CLI proves the backend stands alone. Deleting frontend has zero backend benefit and risks the live receipts. |
| **BUILD (missing foundations)** | (A) `lib/core` headless boundary — the official company-OS service API, no React. (B) **Public API** unifying the primitives (company, run, decisions/approve, memory, product, tools) — authed + tenant-scoped; several routes exist, complete + document them. (C) **CLI** (`competitor …`) driving the API — the interim "frontend," makes it terminal-operable. (D) **MCP transport** serving `lib/mcp/tools.ts` so coworker + any client call the SAME governed primitives. (E) **Competitor = company #0**: seed our own company + run our ops (this roadmap, sales stack, SEO) on the platform — real dogfood. |

## Sequence (backend-first, each slice QA-gated + a PR so the reviewer runs)
- **A. Core + headless** — define `lib/core` boundary; move client code out of `lib/engine`; unify the roster; collapse governance to `policy.ts` (delete the `autopilot` dupe). *Non-destructive first; deletions gated on your OK.*
- **B. API + CLI** — complete/unify the API; ship a `competitor` CLI. Platform fully operable without the web app. **This is the proof the backend is the product.**
- **C. Consolidate runs + memory** — one durable orchestrator, one memory layer; retire the legacy planner; wire-or-delete the unwired pillars.
- **D. MCP transport + coworker join** — serve the governed tools; connect the coworker.
- **E. Dogfood + trim** — Competitor as company #0 runs its own ops; retire confirmed-dead code + demo frontend.

## Invariants that never weaken (regardless of refactor)
Honesty floor (no fabricated data/proof) · verify-before-done · money & irreversible acts human-approved · spend caps at the infra floor · kill switch · tenant isolation (RLS) · `npm run qa` green per slice.

## What I need from you
1. **Approve the target shape** (one headless core + API + CLI + MCP; consolidate not rewrite; keep the crown jewels).
2. **Approve the KILL list** (the irreversible part) — or tell me which items to wire-instead-of-delete.
3. Confirm **freeze (not delete) the frontend**.
Then I start with Slice A/B (non-destructive: the `lib/core` boundary + the CLI), on a branch → PR (reviewer runs), QA-green.
