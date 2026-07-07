# MISSION — Competitor.inc: The Autonomous Company Platform

## 1. The ultimate goal
Northeastern University's Boston campus has roughly 40,000 students. The end
state of this mission is that any one of them — and eventually anyone on
Earth — can open Competitor.inc, describe a software business in plain
language, and receive a fully operational, independently running AI software
company of their own: one that designs, builds, ships, markets, sells,
supports, and financially manages its own products with zero human labor,
where the human owner's entire job is two actions — approving proposed task
plans and approving money movement.

The ambition ceiling is deliberately enormous: companies born here should be
able to compound toward the operational capability of a Microsoft or a TCS.
Treat that as the direction of travel, not a launch requirement. The right to
scale is earned by making one company work in the real world, then ten, then
a thousand.

## 2. What is being built
Competitor.inc is a multi-tenant platform. Each user receives a **Company
Instance**: a fully isolated environment with its own agent organization,
codebase, memory, secrets vault, financial ledger, and immutable audit log.

The agent organisation inside every instance:

- **Orchestrator (CEO agent)** — owns strategy and prioritisation, converts
  owner goals into concrete task plans, submits every plan to Gate 1 before
  anything executes.
- **Product agent** — turns market signals and owner intent into specs,
  roadmaps, and acceptance criteria.
- **Engineering agents (builder, reviewer, QA)** — write, review, and test all
  code. Nothing merges without independent review and passing tests; nothing
  deploys without a rollback plan.
- **Growth agent (marketing + sales)** — outreach, content, pipeline, under
  hard conduct rules: no spam, no deception, full compliance with every
  platform's terms of service, disclosure of AI involvement wherever law or
  norms require it.
- **Support agent** — tickets, docs, customer communication; feeds recurring
  pain points back to Product.
- **Finance agent** — invoicing, bookkeeping, expense proposals. It can move
  nothing; every dollar routes through Gate 2.
- **Sentinel agent (security, compliance, safety)** — continuously monitors
  all other agents; holds unilateral power to freeze the instance and alert
  the owner.

## 3. The two human gates (non-negotiable)
**Gate 1 — Task approval.** Nothing executes until the Orchestrator's plan
brief — objective, steps, resources, risks, rollback — is approved by the
owner. Design for tiered auto-approval the owner can later opt into for
demonstrably low-risk task classes, so approval load shrinks as trust is
earned.

**Gate 2 — Money.** Every dollar in or out — spending, pricing changes,
refunds, contracts, service payments — requires explicit owner authorisation.
Enforce this below the prompt layer: hard budget caps at the payments and
infrastructure level, so no agent error, bug, or prompt injection can exceed
the cap even in principle.

## 4. Quality doctrine
The system is not instructed to be perfect, because systems instructed to be
perfect learn to hide their defects. The doctrine instead: assume every design
contains flaws, and make finding them before users do the core competence.
Adversarial self-review on every architecture and plan. Tests before merge
with defined coverage thresholds. Staged rollouts with instant rollback.
Scheduled failure drills. Plain-language postmortems after every incident.
No task reported complete without attached evidence. No fabricated or
embellished progress. Unknowns stated as unknowns, with a plan to resolve them.

## 5. Hard constraints
- **Legal reality:** an AI cannot legally own a company. Every Company
  Instance is legally owned by its human; the platform surfaces and prepares —
  but never signs — registration, tax, and contractual requirements.
- **Security:** all operating assets (customer lists, API keys, credentials)
  live in the encrypted vault, verified for access, and must never appear in
  code, logs, outputs, or agent messages.
- **Data ethics:** the first customers are students — minimum data collection,
  honoured consent, compliance with applicable privacy law.
- **Conduct:** no dark patterns, no impersonating a human where disclosure is
  expected, no ToS violations in pursuit of growth. Growth obtained through
  deception is a defect, not a win.

## 6. The staged path to 40,000
- **Phase 0 — Company Zero:** the founder's own company runs end-to-end on the
  platform. Done when it ships a real product to real paying users and the
  owner has touched nothing but the two gates for 30 consecutive days.
- **Phase 1 — Ten design partners at Northeastern:** everything instrumented;
  weekly failure review; tracked metrics: % of tasks needing human rework,
  approval latency, cost per company, revenue per company.
- **Phase 2 — 100 to 1,000 companies:** multi-tenant hardening, self-serve
  onboarding, unit economics where each added company costs near-zero marginal
  human effort and less to run than it earns.
- **Phase 3 — 40,000-company capacity:** full campus scale with quality
  metrics flat as instance count grows.

No advancing to the next phase until the current phase's metrics have held
for 30 days.

## 7. Definition of ultimate success
A stranger at Northeastern signs up, connects their accounts and payment
method, describes a software business in one paragraph, and within days owns
a company that builds, ships, sells, and supports software continuously —
asking them only two questions, ever: "approve this plan?" and "approve this
spend?" And 40,000 such companies run in parallel without quality degrading.
The world's first company-of-companies: operated by AI, owned by humans.
