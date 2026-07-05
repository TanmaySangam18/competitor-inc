# Blueprint — competitor.inc as an AI-Native Enterprise (Microsoft/Google/Amazon-scale)

_Objective: everything required to become the first genuinely AI-built-and-run company that can operate at
global-tech-leader scale — architected around an AI workforce, with a thin human accountability layer.
Benchmarked against Microsoft/Google/Amazon, not small AI ventures. Honest by design — no fabricated
readiness. Owner: Tanmay Sangam. Companion docs: [[BLUEPRINT]] extends docs/ARCHITECTURE-autonomous-company
+ the plan file; the engine that makes this feasible is Phases A→D (lib/engine/{supervisor,agent-lifecycle,
orchestrator,connectors,accountability-spine}.ts)._

## 0 · Honest current state (the baseline we measure gaps from)
- **Product:** competitor.inc — live, pre-launch, **0 customers, $0 revenue**, free tiers (Vercel/Supabase/Groq).
- **AI operating engine:** ~**42%** of the autonomous-company "machine" built + proven for *small* runs
  (agents plan→build→verify→ship a real site; GTM/support drafts→human desk; governance spine).
- **People:** **1 founder** (F1 visa — work-authorization is a live constraint; see §6/§7). No employees, no entity confirmed, no board, no advisors.
- **Enterprise posture:** **none** — no SOC2/ISO, no data centers, no enterprise contracts, no brand/distribution.
- **The unmovable truth:** Microsoft-scale moats (data centers, decades of trust, certifications, sales orgs,
  ecosystems, accumulated data) are **capital + time**, not code. No AI closes those near-term. So the
  *winnable* framing (7 Powers counter-positioning + Crossing the Chasm): **be the first company whose *org*
  is agent-run for a focused product line, win a niche, then widen.** This blueprint is that path — with the
  full enterprise target mapped so nothing is overlooked.

**Operating model legend (used throughout):**
`AI-OP` = agent does it end-to-end, human approves the consequential step · `AI-AS` = agent drafts, human
decides · `HUMAN` = human-owned, agent supports · (irreducible human = legal/financial/accountability).

---

## 1 · Organizational structure (day-1 → enterprise)
Traditional orgs scale by headcount; ours scales by **agent capacity + a thin human spine**. Departments
exist as **agent divisions** first, gaining human leads only where accountability/scale demands.

| Department | Day 1 (0–6 mo) | Growth (6–24 mo) | Enterprise | Operating model |
|---|---|---|---|---|
| Engineering / Product build | agent crew + founder | + 1–2 human staff eng (review/architecture) | human VP Eng + agent fleet | AI-OP (build) / HUMAN (architecture, prod-critical) |
| Product management | AI-AS + founder | human PM lead | CPO + PMs | AI-AS |
| Design/UX | AI-OP (from design system) | human design lead | design org | AI-OP / HUMAN (brand) |
| QA / verification | AI-OP (verify-before-done) | + human QA lead | quality org | AI-OP |
| DevOps/SRE/Infra | AI-AS (IaC) | human SRE (on-call, incidents) | SRE org | AI-AS / HUMAN (incidents, uptime) |
| Security | AI-AS (SAST, monitoring) | **human CISO (early — trust gate)** | security org | HUMAN-led |
| Data/ML research | AI-AS | human research lead | research org | AI-AS |
| Sales | AI-AS (drafts, lead research) | human AE(s) for enterprise | sales org | AI-AS / HUMAN (enterprise close) |
| Marketing/Growth | AI-OP (content/SEO drafts→approve) | human growth lead | marketing org | AI-OP / HUMAN (brand) |
| Customer success/support | AI-OP (drafts→approve) | + human CSM for top accounts | CS org | AI-OP / HUMAN (escalations) |
| Finance | AI-AS (bookkeeping, forecasts) | **human fractional CFO** | finance org | HUMAN-led (irreducible) |
| Legal/compliance | AI-AS (draft contracts, prep) | **human counsel (fractional→FT)** | legal org | HUMAN-led (irreducible) |
| People/HR | AI-AS | human HR as headcount grows | People org | AI-AS / HUMAN |
| Executive | founder (CEO) + agent "C-suite" | + human co-founder/execs | full C-suite | HUMAN accountability |

**Evolution rule:** a function gets a human lead the moment (a) it carries legal/financial liability, (b) it
requires accountable 24/7 uptime, or (c) enterprise buyers demand a named human. Everything else stays agent-run.

---

## 2 · Talent & hiring plan (roles, model, timeline)
Comprehensive role list with FTE/contractor/advisor/**agent** classification + KPI + hire-trigger. _(One-line
JDs; full multi-para JD for any role available on request — kept compact here so nothing's overlooked.)_

| Role | Type | Hire trigger | Core KPI |
|---|---|---|---|
| Founder/CEO | FTE (you) | now | company north-star metric |
| Immigration attorney | Advisor/contract | **now** (F1) | fundable, compliant status |
| Fractional CFO | Contractor | at revenue / raise | clean books, runway accuracy |
| Startup counsel (Cooley/Gunderson-tier) | Advisor/contract | at incorporation/raise | IP + entity + contracts sound |
| Founding engineer (human) | FTE | at seed / first enterprise | prod reliability, review throughput |
| Head of Security/CISO (fractional) | Contractor→FTE | before first enterprise deal | SOC2 readiness, 0 breaches |
| Head of Growth | FTE | post product-market signal | CAC/activation/retention |
| Enterprise AE | FTE | first enterprise pipeline | closed ARR |
| Customer success lead | FTE | ~first 20 paying | NRR, churn |
| Design lead | Contractor→FTE | at scale | brand + conversion |
| SRE/on-call | FTE | at uptime SLAs | uptime, MTTR |
| **All execution roles below** | **AI agents** | now | see §3 |

**AI-agent roles (built, not hired):** strategy(Apex), engineering(Forge), marketing(Pitch), support(Guard),
growth(Surge), manufacturing(Rig) + dynamic per-goal specialists (PM/QA/DevOps/docs/finance-assist/legal-assist).

**Sequencing:** attorney (now) → entity + CFO (at revenue/raise) → founding eng + CISO (at first enterprise) →
GTM humans (post-signal) → org leads (at scale). Keep human headcount *deliberately* minimal — that's the moat.

---

## 3 · AI workforce design
- **Agents to build/deploy:** the division roster (§2) as ephemeral, per-task agents (spawn→verify→handoff→
  terminate — already built). Plus a **Supervisor/orchestrator** and (roadmap) **long-horizon operating loop**.
- **Responsibilities:** each agent = a scoped function with a workflow + success metrics (already in `AGENTS`).
- **Human↔AI model:** agents DO + DRAFT; humans APPROVE the consequential/irreducible (the "accountability
  spine"). Generator/evaluator separation enforced (no agent grades its own work).
- **Governance/permissions/monitoring (built):** policy 5-gates + per-agent matrix + spend wallet + kill-switch
  + approval inbox + observability + audit. **Gaps:** per-agent identity/secrets management at scale, richer
  audit/replay, anomaly detection on agent behavior, rate/cost budgets per agent (partial).

---

## 4 · Technology stack
| Layer | Now (free/lean) | Enterprise target | Gap |
|---|---|---|---|
| App/dev infra | Next.js/Vercel, TS strict, QA gate | multi-region, IaC (Terraform), CI/CD | IaC, staging, CI |
| AI models | Groq (free) + Claude (builds) + BYOK | multi-provider gateway, routing, evals | model evals, gateway, fallback |
| Build/exec | GitHub static + app-mode; OpenHands (pluggable) | sandboxed full-app builds at scale | OpenHands live, sandbox fleet |
| Cloud | Vercel/Supabase free tiers | AWS/GCP multi-region, autoscale | real cloud acct, cost mgmt |
| Security | SSRF guard, log scrubbing, RLS | SIEM, secrets mgr, WAF, pen-tests | SIEM, secrets vault, pen-test |
| Data | Supabase/pgvector | warehouse (Snowflake/BigQuery), DataOps | warehouse, pipelines, governance |
| DevOps/MLOps/DataOps | manual QA + cron | full CI/CD, model registry, monitoring | most of it |
| Collab/productivity | git, docs, ChatOps (Slack/TG) | SSO, IdP, internal wiki, ITSM | SSO/IdP, wiki |

---

## 5 · Business operations
- **SOPs/workflows:** encode as agent workflows + the approval inbox (partly built). Gap: a formal SOP library.
- **Docs/knowledge mgmt:** repo docs + memory (pgvector). Gap: a searchable company wiki + retention policy.
- **Decision frameworks:** every decision names its playbook (in place). Gap: a formal decision log/registry.
- **Reporting:** `/house/board` scorecard + digests (built). Gap: exec dashboards, board reporting.
- **Compliance/governance:** policy engine + audit (built, small). Gap: formal governance/compliance program.

---

## 6 · Legal & compliance (mostly HUMAN — the irreducible core)
- **Corporate structure:** **incorporate (Delaware C-corp is the fundable default)** — not done. **Critical.**
- **F1/immigration:** founder can own equity + raise, but *active work for pay* needs authorization (OPT/O-1).
  **Attorney now.** Gates real revenue, hiring, and fundraising structure.
- **IP:** assign all IP to the entity; the code is proprietary (LICENSE exists); trademark the brand. Gap: IP assignment + TM.
- **Privacy:** GDPR/CCPA, DPA, privacy policy (basic exists). Gap: full data-processing program as you hold user data.
- **Security certs:** SOC 2 Type II (→ enterprise), ISO 27001, later FedRAMP. **None yet.** 6–12+ mo each.
- **Global regulatory:** entity/tax registration per market, EU AI Act, sectoral rules. Future.
- **Contracts/policies:** MSA, ToS (exists), DPA, SLAs, employment/contractor agreements. Gap: the full set.

---

## 7 · Financial infrastructure (HUMAN-accountable)
- **Team:** fractional CFO + AI bookkeeping agents. **Systems:** accounting (QuickBooks/Rippling-tier), banking,
  Stripe/Polar (Polar wired). **Now:** none of the finance stack; Polar checkout exists but payouts blocked (F1/KYC).
- **Budget/forecast/controls:** AI-AS forecasting + human sign-off; spend governed by the wallet (built for agent spend).
- **Fundraising readiness:** data room, cap table, financial model — **not built** (fundraising kit drafted: docs/FUNDRAISING-KIT.md).
- **Investor reporting:** monthly updates — future.

---

## 8 · Product & innovation
- **PM framework:** validate-first + Shape Up (in our DNA). **QA:** verify-before-done (built). **Feedback:** funnel
  pixel + /house board (built). Gaps: research org, formal experimentation platform, product-lifecycle/roadmap tooling.

---

## 9 · Go-to-market
- **Now:** launch kit (Show HN/Reddit/X), SEO playbooks, build-in-public heartbeat, fundraising kit — drafted.
- **Sales:** AI-AS lead research + drafts → human AE for enterprise. **Marketing:** AI-OP content/SEO. **Brand:**
  wordmark done; needs a real brand system at scale. Gaps: enterprise sales motion, partnerships, community, global expansion.

---

## 10 · Enterprise readiness (the biggest chasm)
Scalability, 99.9%+ uptime SLAs, disaster recovery, business continuity, risk management, internal audit,
24/7 enterprise support — **essentially none today** (single-region serverless, no SLA, no DR). This is the
multi-year, capital-heavy frontier and the truest gap vs Microsoft. Classified mostly **Future**, gated on
customers + funding + a security/SRE org.

---

## 11 · Culture & leadership
- **Values:** Verifiable · Governed · Honest (validate-first; never fake proof) — already the brand.
- **Leadership principles:** name the playbook; human owns accountability; agents earn autonomy via verified track record.
- **AI-first culture:** default to agent execution; humans do judgment, relationships, and the irreducible.
- Gaps (at headcount): performance management, hiring philosophy doc, L&D.

---

## 12 · Resource requirements (honest costs)
- **Now (~$0):** Vercel/Supabase/GitHub/Groq free tiers; Claude for builds (~cents/build).
- **Seed-stage (~$X0k/yr):** cloud, model tokens, SOC2 audit ($15–40k), attorney + CFO (fractional), tooling (SSO/wiki/accounting), OpenHands compute.
- **Scale:** cloud + compute is the dominant line (the AWS-scale cost), then people (kept minimal), then compliance.
- Hardware: none owned (cloud); optional a build box for self-hosted OpenHands.

---

## 13 · Gap analysis (current vs ideal)
| Gap | Severity | Effort | Rough cost | Timeline |
|---|---|---|---|---|
| **Legal entity (C-corp) + IP assignment** | 🔴 Critical | low | ~$500–2k | days–weeks |
| **Immigration/work-auth path (attorney)** | 🔴 Critical | med | attorney fees | weeks–months |
| **First real customer + revenue (launch)** | 🔴 Critical | low (ready) | $0 | this week |
| **Reliable full-app builds (Claude/OpenHands)** | 🔴 Critical | med | tokens/compute | in progress |
| Long-horizon autonomous operation | 🟠 Important | med-high | eng time | 1–3 mo |
| Finance stack + fractional CFO | 🟠 Important | med | fractional | at revenue |
| Security program → SOC 2 | 🟠 Important | high | $15–40k+ | 6–12 mo |
| CI/CD + IaC + staging + MLOps | 🟠 Important | med-high | cloud | 3–6 mo |
| Enterprise readiness (SLA/DR/BC/audit/24-7) | 🟢 Future | very high | $$$ | 12–36 mo |
| Global compliance + certs (ISO/FedRAMP/AI Act) | 🟢 Future | very high | $$$ | 18–36 mo |
| Sales/marketing/CS orgs (human leads) | 🟢 Future | high | payroll | post-traction |
| Data warehouse + DataOps | 🟢 Future | high | cloud | 12+ mo |

---

## 14 · Execution roadmap
**Next 3 months (survive + prove):** launch → first users/revenue; incorporate (C-corp) + attorney (F1);
wire reliable full-app builds (Claude now, OpenHands self-host next); ship the long-horizon operating loop to
the scheduler. _Dependencies: launch unlocks budget; entity unlocks banking/fundraising._

**6 months (fund + harden):** raise a pre-seed (fundraising kit → warm intros); fractional CFO + finance stack;
start the security program (policies → SOC 2 readiness); CI/CD + staging + IaC; first human founding eng.

**12 months (enterprise-viable niche):** SOC 2 Type II; first enterprise design partner; enterprise support +
basic SLA/DR; growth motion with a human lead; expand agent divisions + connector breadth.

**24 months (scale the AI-native org):** multi-region infra + real cloud spend; ISO/global compliance track;
sales org for enterprise; the org measurably agent-run for a product line at revenue — the world-first claim,
*earned* with proof, not asserted.

**Milestones/dependencies:** entity → banking → fundraise → hire → certs → enterprise. Customers gate funding;
funding gates certs/hires; certs gate enterprise. The one thing that starts the whole chain: **a first paying user.**

---

## The one-paragraph truth
We have a real, working **AI operating core** (~42% of the machine) and a credible path to be the first
*agent-run org* — but "Microsoft-scale" is 90%+ moats (capital, time, trust, compliance, infra) that no code
shortcuts. The blueprint above maps all of it so nothing's overlooked; the **honest near-term game is: launch
→ first revenue → incorporate → raise → harden → win a niche → widen.** Everything else is downstream of the first customer.
