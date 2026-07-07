# ARCHITECTURE REVIEW — Company Zero → 40,000 (brutal edition)

_2026-07-07. A ruthless, evidence-based review against the vision (docs/VISION.md). Grounded in the actual
codebase: ~27 pages · 26 API routes · 90 engine modules · 576 tests · 25 migrations; single Next.js app on
Vercel + one Supabase; per-user data isolation via RLS; localStorage-authoritative with best-effort DB sync;
payments OFF (F1). Assume insufficient until proven otherwise._

## Framing truth (read first)
What exists is a **polished single-tenant web app that _simulates_ an autonomous company, with real
governance gates, and can generate + deploy one small real web app.** What the vision requires is a
**multi-tenant operating system that runs thousands of _isolated_, _economically viable_, _long-horizon
autonomous_ companies.** The distance between those two is not "a few features" — it's most of the system.

## D1 — Current capability assessment
| Capability | Rating | Honest note |
|---|---|---|
| Company creation | Functional but Limited | A company object + RLS-scoped data + a simulated crew. NOT an isolated environment. |
| Company memory | Prototype | pgvector `memory.ts` + a derived knowledge graph; shallow, not evolving/organizational. |
| Agent organization | Functional but Limited | Roles + simulated nightly shifts + model chat; supervisor/lifecycle exist but flag-gated. Not a truly autonomous org. |
| Product management | Stub | Validation + growth diagnosis; no agent authoring specs/roadmaps/acceptance criteria. |
| Engineering (build) | Functional but Limited | Real **web-app** build (Gemini) + self-repair + QA gate + verify-before-done. No full-stack/backend, no repo iteration. |
| Deployment | Functional but Limited | GitHub Pages (static/web), reachability-verified. No full-stack deploy, no per-company infra, one shared token. |
| QA | Functional but Limited | Structural site-review + reachability. Does NOT run tests on generated apps. |
| Security | Functional but Limited | SSRF guard, secret-scan on deploy, policy engine, RLS. No per-company vault, no pentest/SOC2. |
| Secrets management | Prototype | env + gitignore + scan. No encrypted per-company vault (the vision requires one). |
| Finance | Stub | Wallet caps + trial credits + Polar wiring. No bookkeeping/invoicing/forecasting. Payments OFF. |
| Growth | Functional but Limited | Organic Growth Engine + distribution drafts, approval-gated. No execution/measurement at scale. |
| Sales | Stub | Drafts only; no CRM/pipeline; can't transact. |
| Customer support | Stub | Chat replies; no ticketing/docs feedback loop. |
| Analytics | Functional but Limited | First-party attribution + funnel + scorecard. |
| Monitoring | Prototype | `observability` traces + alerts. No APM/uptime/SLOs. |
| Audit logging | Functional but Limited | Glass Box activities + approval decisions. Not immutable/tamper-evident. |
| Human approval (gates) | Functional but Limited | Approval Inbox + hard spend cap + ChatOps. Gate-1 is per-action, not plan-first; no tiered auto-approval. |
| Multi-agent coordination | Prototype | Sub-agent executor + supervisor (flag-gated). No robust agent-to-agent protocol/bus. |
| Recovery from failures | Functional but Limited | Fail-soft everywhere + per-company cron isolation. No backups/restore/DR. |
| Self-improvement | Prototype | Revenue-loop constraint diagnosis + build self-repair. Not a real measure→improve→verify org loop. |
| Knowledge management | Prototype | Memory + BKG summary; shallow. |
| Infrastructure | Stub (for the vision) | One Vercel app + one Supabase. No per-company provisioning / fleet orchestration. |
| Multi-tenancy | Prototype | RLS data isolation only. NOT isolated envs/codebases/vaults/ledgers. |
| Scalability | Stub | Single app; cron iterates all companies serially. No N-company evidence. |
| Cost optimization | Functional but Limited | Free tiers + BYOK + cheap-model routing (~$0 marginal). No per-company metering/budgets at scale. |
| Compliance | Stub | Honest-claims + consent microcopy. No GDPR/SOC2/DPAs/legal-prep engine. |
| Observability | Prototype | Traces + alerts; no dashboards/SLOs. |
| Documentation | Functional but Limited (a genuine strength) | README/VISION/MISSION/STATE + many docs; unusually good for the stage. |

**Nothing is "Production Ready" against the 40k vision.** The control plane, governance UI, and web-app
build are the strongest; everything about *isolation, autonomy-at-scale, economics, and operating a real
business* is Prototype/Stub/Missing.

## D2 — Missing systems (must exist; mostly unbuilt)
1. **Per-company isolated runtime** — real Company Instance: own DB/schema, secrets **vault**, financial
   **ledger**, immutable **audit log**, deploy pipeline. Today it's RLS rows, not isolation.
2. **Real full-stack build + per-company hosting/provisioning** — `BackendProvider` is typed, unimplemented.
3. **Autonomous long-horizon operating loop** — plan→execute→verify→adapt over weeks. The frontier; not built.
4. **Platform control plane** — job queue + workers + scheduler + rate/cost governance for N concurrent companies. (Cron currently loops serially.)
5. **Economic engine** — per-company cost metering + hard budgets + unit economics (cost-to-run < revenue). Without this, 40k = insolvency.
6. **Agent-to-agent protocol / shared context bus** — structured, auditable inter-agent messaging.
7. **Disaster recovery** — backups, restore, **versioned company state** (snapshot/rollback a whole company).
8. **Server-authoritative state** — replace localStorage-authoritative with a real backend of record.
9. **Self-serve onboarding + identity + payment/account connection** — the "sign up → describe → own a company" path, safely.
10. **Abuse/safety at scale** — content moderation, ToS enforcement, prompt-injection defense, fleet kill-switch.
11. **Reputation + trust system** — per company and platform-wide.
12. **Experimentation engine** — guardrailed A/B at company + platform level.
13. **Marketplace / plugin / inter-company economy** — the "company-of-companies."
14. **Legal-prep engine** — entity/tax/contract prep (surfaced, never signed).
15. **Model/provider control plane** — routing, budgets, fallbacks, per-company quotas.

## D3 — Launch to 40k tomorrow: why it fails (and the fix)
- **Technical:** one Vercel app + one Supabase + one GitHub token → instant quota/rate-limit death; serial cron never finishes; no isolation → one bad agent hurts everyone; localStorage-authoritative → no truth at scale. → **Fix:** multi-tenant control plane, per-company workers/queue, per-company keys, server-authoritative state.
- **Economic:** unbounded model+infra cost per company × 40k = bankruptcy; free tiers rate-limit. → **Fix:** per-company metering + hard budgets + BYOK-at-scale + cost caps before any provisioning.
- **Legal:** founder can't charge (F1); AI-run companies serving real customers/data = liability, ToS, GDPR/CCPA, tax nexus; "we built your company" claims. → **Fix:** work-auth; per-company legal ownership + terms; DPAs; conservative claims.
- **Security:** no per-company secret isolation → one leak exposes many; prompt-injection can trigger actions; no pentest/SOC2. → **Fix:** per-company vault, injection defense, audits, least privilege.
- **Operational:** no monitoring/alerting/on-call/backups at scale. → **Fix:** SLOs, alerting, runbooks, backup/restore, DR drills.
- **Agent:** unreliable long-horizon output (hallucinated "done", wrong emails/spend — the Polsia 1.8/5 failure). → **Fix:** verify-before-done at every step (started), human gates (have), conduct rules, sandboxed execution.
- **Human experience:** 40k users hit approval fatigue, or expect a real company and get a landing page. → **Fix:** honest scope, tiered auto-approval, great onboarding, managed expectations.
- **Business:** Phase 0 (one company, 30 days, real payment) is unmet; demand for "own an AI company" is unproven beyond the vision. → **Fix:** prove ONE, then ten, with metrics.

## D4 — Master roadmap
- **Phase 0 — Company Zero (now).** *Objective:* one real company ships a product to a real paying user; owner touches only the two gates for 30 days. *Why:* nothing else is real until this is. *Systems:* set `BUILD_API_KEY`; verify the build→deploy→verify loop; instrument. *Deps:* work-auth (payment), Gemini key. *Metrics:* real users, 1 payment, 30-day hands-off. *Exit:* metrics hold 30 days.
- **Phase 1 — 10 design partners (NU).** *Objective:* 10 companies run reliably. *Systems:* **server-authoritative state**, one real `BackendProvider` (full-stack build+host), per-user isolation hardening, metrics (rework %, approval latency, cost/company, rev/company). *Deps:* Phase 0. *Exit:* 10 companies, metrics flat 30 days, cost/company known.
- **Phase 2 — 100→1,000.** *Objective:* it scales without degrading. *Systems:* multi-tenant control plane (queue/workers), per-company **vault + ledger + immutable audit**, per-company **cost metering + hard budgets**, self-serve onboarding, DR/backups. *Deps:* Phase 1 + positive unit economics. *Exit:* cost-to-run < revenue; quality flat.
- **Phase 3 — 40,000.** *Objective:* fleet scale. *Systems:* fleet orchestration, autonomous long-horizon operation, marketplace/economy, reputation, SOC2/GDPR. *Exit:* 40k concurrent, quality flat, sustainable.
> Nothing advances until the prior phase's metrics hold for 30 days.

## D5 — The 10x improvements / durable moats
The moat is **not** "AI builds apps" (commoditizing fast). Build these instead:
1. **Verifiable, governed autonomy as the category standard** — proof-over-claims, never fake progress. This is the direct anti-Polsia (they're rated 1.8/5 on trust). Make "you can audit every action + you're never charged" the reason people trust an AI company at all.
2. **A per-company economic engine** that makes 40k companies genuinely cheaper to run than they earn — the thing every competitor fails at. If this works, it's an unassailable structural advantage.
3. **A compounding company-knowledge system** — each company (and the platform) gets measurably better with use; switching cost + data moat.
4. **The beachhead + owned distribution** (NU students) — a real wedge competitors lack.
5. **Ownership, not lock-in** — the customer owns the code/keys/company. The opposite of Polsia's "lose your code when you stop paying."

## D6 — The brutal truth
- **If it stopped today, what is it actually?** A strong, honest **prototype/demo of the vision**: an AI demand-validator + a small real web-app builder + a *simulated* governed crew with a real Glass Box and approval gates. It **cannot** take money, is **not** multi-tenant/isolated, and does **not** run autonomously long-horizon. It is not yet an operating system for companies.
- **Biggest illusion:** that "the autonomous company" substantially exists. Most of it is simulated, single-company, and short-horizon. The hard ~80% (reliable long-horizon autonomous full-stack build+operate, isolated at scale, economically viable) is unbuilt — and it's the part everyone, including well-funded rivals, gets wrong.
- **Three highest-risk assumptions:** (1) that AI can *reliably* build **and operate** real software companies unattended today (frontier; unproven anywhere); (2) that per-company economics can stay below revenue at 40k scale; (3) that the founder can legally operate/charge (work-auth) **and** that students actually want to own+operate a company (demand unproven beyond the vision).
- **Single highest-leverage improvement:** **Prove ONE company end-to-end with a real paying customer, hands-off for 30 days.** Every downstream plan is speculation until that exists. It's gated on work-auth + the build key — not on more code.
- **If I were investing my own money, build next:** NOT scale infra. The **reliable, verifiable, autonomous build→operate loop for ONE web-app company, proven with a real customer and real revenue, with per-run cost measured.** That single proof de-risks the entire thesis; scale is worthless until one works.

**Verdict:** The vision is achievable *in direction*, and the trust/governance foundation is genuinely
differentiated. But we are at the **prototype-proving** stage, not the platform stage. What separates us
from the vision is not features — it's (a) one proven real company, (b) real multi-tenant isolation +
control plane, (c) reliable long-horizon autonomy, and (d) an economic model. Build in that order.
