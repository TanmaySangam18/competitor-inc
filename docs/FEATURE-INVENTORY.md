# Polsia Feature Inventory & Ranked Gap Analysis

> Mandated research artifact for the parity-and-beyond program. Catalogs every identifiable
> Polsia capability, maps competitor.inc's current coverage (✅ have / 🟡 partial / ❌ missing), and
> produces a **ranked gap list** that drives the build loop: Research → Build → Verify → Compare → Improve.
>
> Sourcing note: Polsia is a closed product; this inventory is assembled from the founder
> research in `FOUNDER-JOURNEY.md` (interviews, the live dashboard, build-in-public posts, the
> Matt Mazur teardown) plus standard SaaS-platform expectations. Items inferred (not directly
> observed) are marked _(inferred)_. We do not have an account to click through, so some flows
> are reconstructed.

---

## A. Feature inventory (what Polsia does)

### A1. Marketing / public site
| Capability | competitor.inc |
|---|---|
| Landing page, value prop, CTA | ✅ have |
| Pricing page ($49–59/mo + 20% rev-share model) | 🟡 partial (pricing section, no rev-share, no checkout) |
| `polsia.com/live` — public real-time metrics dashboard | ❌ missing |
| About / founder page | ❌ missing |
| SEO / OG metadata | ✅ have (basic) |

### A2. Auth & account
| Capability | competitor.inc |
|---|---|
| Sign up / sign in | ❌ missing |
| Session management | ❌ missing |
| Account settings / profile | ❌ missing |
| Billing & subscription management _(inferred)_ | ❌ missing |
| API keys / connected accounts (Meta, GitHub, email, domains) _(inferred)_ | ❌ missing |

### A3. Onboarding
| Capability | competitor.inc |
|---|---|
| "Describe your company / idea" entry | ✅ have |
| Idea → suggested company/product | ✅ have (name generation) |
| **Validation step before building** | ✅ have (our wedge — Polsia lacks this) |
| Free trial / freemium entry | 🟡 partial (free "Validate" tier in copy, no gating) |

### A4. Core product — the autonomous company OS
| Capability | competitor.inc |
|---|---|
| Create & manage **multiple companies** per user | ❌ missing (single, localStorage) |
| Company dashboard (status, metrics) | ✅ have (single) |
| **Agent swarm** (CEO/Eng/Marketing/Support/Growth) with scoped authority | ✅ have (named agents, simulated) |
| **Heartbeat** — proactive nightly self-prompting loop | 🟡 partial (manual "run shift", not scheduled) |
| Activity feed / audit log | ✅ have (Glass Box) |
| `soul.md` / `agents.md` / `heartbeat.md` config files | ❌ missing |
| Chat with your Roomie (conversational direction) | 🟡 partial (mockup only on landing) |
| Real **code generation + deploy** (GitHub/MCP) | ❌ missing (needs creds) |
| Real **infra provisioning** (servers, DB, email) | ❌ missing (needs creds/$) |
| Real **ad campaigns** (Meta Ads API) | ❌ missing (needs creds/$) |
| Real **cold outreach / email** | ❌ missing (needs creds, compliance) |
| Real **customer support** handling | ❌ missing (needs inbox integration) |
| Task pricing / credits ledger | 🟡 partial (simulated ledger, no real credits/billing) |
| **Approval / human-in-the-loop** for consequential actions | ✅ have (Approval Inbox — our improvement) |
| Proof-of-work task completion | ✅ have (our improvement) |
| Auto-refund on failed tasks | ✅ have (our improvement) |

### A5. Data, backend, APIs
| Capability | competitor.inc |
|---|---|
| Persistent server-side data store | ❌ missing (localStorage only) |
| Backend API layer | 🟡 building this iteration (`/api/roomie`) |
| LLM provider integration (frontier model) | 🟡 partial (swappable interface; real call being wired) |
| Dual-model generate→verify pattern | ❌ missing |
| Background job / scheduler (the nightly heartbeat) | ❌ missing |
| Webhooks / integrations | ❌ missing |

### A6. Permissions, performance, platform
| Capability | competitor.inc |
|---|---|
| Roles / per-agent scoped authority | 🟡 partial (conceptual scopes, not enforced) |
| Multi-tenant isolation _(inferred)_ | ❌ missing |
| Mobile responsive | ✅ have (landing + dashboard) |
| Desktop | ✅ have |
| Accessibility (a11y) pass | 🟡 partial (semantic, not audited) |
| Performance (Core Web Vitals) | 🟡 partial (not measured) |
| Tests | ❌ missing |

---

## B. Ranked gap list (the build backlog)

Priority = (parity impact) × (buildable without external $/creds) ÷ (effort). P0 = do first.

**P0 — Foundation (makes it a platform, not a demo)**
1. **Backend API + real-model wiring** (`/api/roomie`, key-gated, validated, error-handled; simulated fallback). _Started this iteration._
2. **Auth + persistent multi-company store** (Supabase is connected): sign in, multiple companies per user, server persistence, RLS isolation.
3. **Real heartbeat scheduler** — actual nightly autonomous runs (cron) instead of manual button, with run history.

**P1 — Core product depth**
4. **Conversational Roomie** — real chat to direct the company (not just a mockup), persisted threads.
5. **`soul.md` / `agents.md` / config surface** — account/settings page to edit brand voice, agent roles, scopes, and the engine/Private-Mode toggle.
6. **Dual-model generate→verify** in the engine (Polsia's quality mechanism).
7. **Multi-night history + analytics** — charts of spend, tasks, signal over time.

**P2 — Platform completeness**
8. **Billing/subscription** UI (Stripe via Marketplace) — plans, usage, invoices. (Real charges need keys.)
9. **Public `/live` dashboard** — aggregate metrics page (Polsia's signature growth/marketing surface).
10. **Integrations seams** — GitHub, Meta Ads, email, domains: connect-account UI + adapter stubs with clear "plug in creds here" boundaries.
11. **Account management** — profile, connected accounts, data export (our "no lock-in" promise made real).

**P3 — Beyond parity (our differentiation, hardened)**
12. Accessibility audit + keyboard nav + reduced-motion.
13. Performance pass (Core Web Vitals, image/font optimization).
14. Test suite (unit for engine, e2e for flows).
15. Better onboarding (templates, examples, guided first run).
16. Private Mode (self-hosted open-weight) actually selectable end-to-end.

---

## C. Real-world boundaries (require user accounts / keys / authorization)
These are part of "full parity" but cannot be truthfully completed without the user plugging in
credentials and accepting cost/legal responsibility. We build the orchestration + integration
points and stop at the seam:
- Live infra provisioning (cloud accounts, $$)
- Real ad spend (Meta Ads API + budget, $$)
- Real outbound email / cold outreach (deliverability, CAN-SPAM/GDPR compliance)
- Real payment processing / charging customers (Stripe/PCI)
- Pushing real code to users' production (GitHub tokens, deploy targets)

## D. Beyond-parity improvements we already hold (keep & deepen)
- Validation-first gate (Polsia's most-requested missing feature)
- Proof-of-work completion (no fake "done")
- Glass Box audit log + one-click undo
- Approval Inbox / human-in-the-loop (also the correct prompt-injection defense)
- Auto-refund on failed tasks; transparent ledger; no-lock-in export

---

## E. The loop (per directive)
For each backlog item, top-down: **Analyze → Build (frontend+backend+data+API+validation+security+errors) → Verify (correctness, perf, a11y, mobile, reliability) → Compare to Polsia → close remaining gaps → next.**
