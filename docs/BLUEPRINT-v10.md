# BLUEPRINT v10 — Competitor.inc → 40,000 autonomous companies (design canon)

_2026-07-07. The design north star for the platform's missing systems. Pairs with `ARCHITECTURE-REVIEW.md`
(honest current-state audit) and `VISION.md`/`MISSION.md` (the why). **Read the Sequencing Discipline first —
it governs what may be built when.** Designs here are targets, not a build queue._

## ⛔ Sequencing discipline (CTO overlay — governs everything below)
The vision's non-negotiable is **reliability before scale**. Systems below are tagged by the phase in which
they may be built. **Nothing multi-tenant/scale is built until one company works for real.** Documenting a
design here is NOT permission to build it now.

| Phase | May build | Must NOT build yet |
|---|---|---|
| **0 (now)** | Prove ONE company end-to-end (validate→build→deploy→market→support) + per-run cost visibility + the reliability/safety already shipped | Anything multi-tenant, control plane, per-company vault/ledger, economic engine, onboarding |
| **1 (10 partners)** | Server-authoritative state; ONE real full-stack `BackendProvider`; core metrics | Fleet control plane, self-serve onboarding, marketplace |
| **2 (100→1k)** | Multi-tenant control plane; per-company isolation (vault/ledger/immutable audit); per-company economic engine + hard budgets; self-serve onboarding; DR/backups | Marketplace/economy, fleet long-horizon autonomy |
| **3 (→40k)** | Fleet orchestration; long-horizon autonomy; marketplace/economy; reputation; SOC2/GDPR | — |

> The pasted blueprint's "Gate 1" listed **Multi-Tenant Foundations + Economic Modeling as next**.
> **Rejected as premature — they are Phase 2.** The only live Gate-1 package is the **Real Company Pilot** (P0).

## Missing systems (designs — build per the phase table)
1. **Per-company isolation** — own DB/schema, secrets vault, ledger, immutable audit, deploy pipeline; a
   Company Manager provisions/reclaims; registry tracks metadata. *Failure:* partial provision → IaC
   rollback; cross-tenant leak → per-tenant KMS + strict IAM. **Phase 2.**
2. **Full-stack build & hosting (`BackendProvider`)** — CI per company (codegen → test → deploy → verify),
   git repo per company, sandboxed builds, rollback to last stable, static fallback. **P1 (one) → P2 (fleet).**
3. **Multi-tenant control plane** — task queue + workflow engine (Temporal-style) + stateless agent
   workers; tasks tagged by company; checkpointing, idempotency, backpressure, autoscale. **Phase 2.**
   *(Today's cron loops companies serially — fine for P0/P1, not beyond.)*
4. **Per-company economic engine** — ledger, budgets with hard caps at the provider level, forecasting,
   pricing, P&L, cost metering from cloud billing. **Phase 2** (seed: per-run cost visibility in P0).
5. **Server-authoritative state + memory** — central source of truth (replaces localStorage-authoritative),
   append-only event store, vector memory, versioned state, snapshot/restore. **Phase 1.**
6. **Onboarding pipeline** — self-serve sign-up, identity, payment connect, legal setup, resumable. **Phase 2.**
7. **Compliance & legal automation** — jurisdiction rules engine, doc generation (TOS/DPA/privacy), deadline
   reminders; AI never signs. **Phase 2–3.**
8. **Secrets vault per company** — namespaced vault + KMS, JIT access, rotation, access audit. **Phase 2.**
9. **Observability & monitoring** — per-tenant + global metrics/logs/traces, SLOs, alerting, runbooks.
   **P1 basic → P2 at scale.**
10. **Failure recovery / DR** — backups, multi-region failover, restore drills, RTO/RPO. **Phase 2.**

## Company OS (per-company runtime)
Kernel analogy: a **Scheduler/Orchestrator (CEO agent)** breaks goals → prioritized task queue (deps + budget
aware) → dispatches to specialist agents → collects results → logs to **Company Memory** (structured + vector
+ immutable audit). A high-privilege **Sentinel** monitors all agents and can freeze the company (hard
budget/emergency). **Daily loop:** morning check-in → goal re-eval → scan signals → dispatch → evening
summary. **Pause/resume** on budget depletion. **Conflict resolution** by expected-ROI, escalate on stalemate.
**Culture/values** stored in memory, injected into every agent's reasoning. *(Largely SIMULATED today; real
long-horizon autonomy is Phase 3.)*

## Long-horizon autonomy primitives (Phase 3)
Daily vigilance loop · adaptive goal generation (vision + market) · impact-weighted prioritization · market
adaptation (news/competitor feeds) · **sandboxing + verify-before-done for high-level decisions** · emergency
"safe mode" · self-healing (retrain/replace weak agents).

## Economic engine (Phase 2)
Per-project cost accounting · owner budgets with soft (90%) + hard (100%, provider-level) caps · demand-driven
pricing + A/B · unit economics (CAC/LTV/runway) · Monte-Carlo runway sim · Stripe/Polar billing + tax.
**Invariant:** cost-to-run < revenue before fleet scale.

## Trust primitives (differentiator — partially shipped)
Verifiable decision logs (hashed rationale) · explainable reasoning · **immutable append-only audit
(Merkle)** · automated evidence-on-done *(shipped: verify-before-done + QA gate)* · business-level rollback ·
agent reputation (success/failure per agent version) · consensus for critical plans · pre-action snapshots.
*(Live today: Glass Box + approval decisions + hard spend cap + secret-scan + verify-before-done. Not yet:
immutable/tamper-evident audit, reputation.)*

## Reference reading (per system, when building)
Multi-agent orchestration surveys (arXiv) · Anthropic multi-agent research system · NIST AI RMF · Google SRE
Book · Software Engineering at Google (culture/knowledge) · Temporal/workflow-engine docs · platform/
marketplace economics · trust & explainability whitepapers.

## The one live Gate-1 package (Phase 0)
**Real Company Pilot** — one company, real customer, 30 days hands-off. *Founder-gated:* `BUILD_API_KEY`
(real builds) + work-auth (real payment). The code side (build → QA → self-repair → deploy → verify) is
shipped. **Multi-Tenant Foundations and Economic Modeling are deferred to Phase 2** per the discipline above.
