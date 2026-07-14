# AGENT_ROLE_MAP.md — our roster → the canonical 56 (map before build)

**Purpose (MASTER_DIRECTIVE Phase 0 + prime rule "map before you build"):** ORG_56_ROLES.md defines the
canonical **56 roles across 8 departments**. Our current model ([lib/org/organization.ts](lib/org/organization.ts))
has **65 roles across 11 departments** with different names. This file is the authoritative correspondence:
every canonical role → the current role that becomes it (`map`/`rename`), or `ADD` (build new), plus the
current roles we **fold or remove** (no quarantine — merged into their canonical home or deleted). The C1
code reconcile (task #88) executes exactly this map.

**Two structural changes the spec forces:**
1. **No CEO agent.** The human owner IS the CEO. The top agent is the **Chief of Staff** (reports to the
   human); the **Auditor** reports to the human only. Our `Chief Executive Officer` role is removed.
2. **Flatter.** The canonical org has no "VP" / "Team Lead" sub-layer — one lead per department, then ICs.
   Our team-lead roles fold into their department lead or into an IC.

**Permission-trim principle (INFRASTRUCTURE §2, REQUIREMENTS §4):** each role's JD is its permission set.
Narrower role = tighter least-privilege. Every mapped role gets its vault-scoped tokens trimmed to exactly
what its JD needs; anything broader than the JD is a Tier-3 grant.

---

## EXECUTIVE & GOVERNANCE (4)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 1 | Chief of Staff (Orchestrator) | Chief of Staff | map (now reports to **human**, not CEO) |
| 2 | Program Manager | — | **ADD** (cross-project deps, deadlines, contention) |
| 3 | Auditor (independent) | — | **ADD** (samples T0/T1, hunts drift + metric-gaming; reports to human only) |
| 4 | Risk Scoring Officer | — | **ADD** (owns the tier rubric — Tier A2; every rubric change is T3) |

## PRODUCT & DESIGN (6)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 5 | Head of Product | Chief Product Officer | rename |
| 6 | Product Manager | Product Manager | map |
| 7 | UX Researcher | UX Researcher | map |
| 8 | Product Designer | Product Designer | map (absorbs Brand Designer) |
| 9 | Market Research Analyst | Market Research Analyst | map |
| 10 | Competitive Intelligence Analyst | — | **ADD** (public-source competitor tracking; feeds market-watch service) |

## ENGINEERING (12)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 11 | Engineering Lead | Chief Technology Officer (+ VP of Engineering) | rename + fold |
| 12 | Frontend Engineer | Frontend Engineer | map (absorbs Frontend Team Lead) |
| 13 | Backend Engineer | Backend Engineer | map (absorbs Backend Team Lead, Full-Stack Engineer/Lead) |
| 14 | API / Integrations Engineer | API Engineer | rename |
| 15 | Database Engineer | Data Engineer | rename (schemas/migrations/integrity; distinct from analytics) |
| 16 | Mobile Engineer | Mobile Engineer | map (absorbs Mobile Engineering Lead) |
| 17 | AI / Prompt Engineer | Reliability & Prompt Engineer | rename (owns customer-agent prompts, evals) |
| 18 | DevOps Engineer | — | **ADD** (CI/CD, staging deploy automation) |
| 19 | Platform / Infrastructure Engineer | Platform Engineering Lead | rename |
| 20 | Code Reviewer | — | **ADD** (mandatory 2nd reviewer; never reviews own lineage — Tier C3) |
| 21 | Refactoring / Tech-Debt Engineer | — | **ADD** |
| 22 | Documentation Engineer | — | **ADD** (repo docs, runbooks) |

## QUALITY & SECURITY (8)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 23 | QA Lead | Head of Quality | rename (certification authority) |
| 24 | Functional Test Engineer | Manual QA Analyst (+ QA Automation Engineer) | rename + fold |
| 25 | Regression Test Engineer | — | **ADD** (reruns suite on every prompt/model change — Tier A3/C3) |
| 26 | Performance Test Engineer | — | **ADD** |
| 27 | Security Engineer (defensive) | Security Engineer | map |
| 28 | Red Team Agent (offensive) | — | **ADD** (attacks the platform + its agents; direct line to human) |
| 29 | Dependency / Supply-Chain Auditor | — | **ADD** (CVE/license/maintenance vetting; blocks CI) |
| 30 | Accessibility & Standards Tester | — | **ADD** (WCAG on customer-facing) |

## PRODUCTION & OPERATIONS (7)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 31 | Release Manager | — | **ADD** (staged rollout + rollback; prod release = T3 always) |
| 32 | SRE / Monitoring | Site Reliability Engineer | map |
| 33 | Incident Commander | — | **ADD** |
| 34 | Support Agent — Tier 1 | Support Engineer, Tier 1 | rename |
| 35 | Support Agent — Tier 2 | Support Engineer, Tier 2 | rename |
| 36 | Customer Success Manager | Customer Success Manager | map (absorbs Head of Customer Success, Onboarding Specialist) |
| 37 | Status & Comms Coordinator | — | **ADD** (every public statement is T3) |

## BUSINESS & FINANCE (6)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 38 | Finance Controller | Chief Financial Officer (+ Financial Analyst) | rename + fold |
| 39 | Bookkeeper | Revenue Operations Analyst | rename (ledger hygiene, read-only feeds) |
| 40 | Unit Economics Analyst | — | **ADD** (cost per task/agent/customer — Tier B1) |
| 41 | Procurement Agent | — | **ADD** (vendor research; never signs/pays) |
| 42 | Legal & Compliance Analyst | Compliance Officer (+ General Counsel, Contracts Specialist) | rename + fold (advisory only; never signs) |
| 43 | Regulatory Watch Agent | — | **ADD** (EU AI Act etc., provider-ToS changes) |

## GROWTH — MARKETING & SALES (8)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 44 | Marketing Lead | Head of Marketing (+ Head of Growth, Performance Marketer) | rename + fold |
| 45 | Content Writer | Content Marketer | rename |
| 46 | SEO Specialist | SEO Specialist | map |
| 47 | Social Media Manager | Social Media Manager | map |
| 48 | Email / Lifecycle Marketer | Lifecycle Marketing Manager | rename |
| 49 | Sales Development Rep | Sales Development Representative | map |
| 50 | Account Executive | Account Executive | map (absorbs VP of Sales, Sales Engineer, Partnerships Manager) |
| 51 | Sales Ops / CRM Administrator | Business Operations Manager | rename (absorbs Growth Engineer) |

## KNOWLEDGE & MEMORY (5)
| # | Canonical role | From our model | Action |
|---|---|---|---|
| 52 | Librarian (Ground-Truth Gatekeeper) | — | **ADD** (sole authority on what counts as fact; agents cite it — REQUIREMENTS §6) |
| 53 | Precedent Clerk | — | **ADD** (human rulings → machine-readable policy — Tier C4) |
| 54 | Playbook Author | — | **ADD** (completed projects → reusable playbooks) |
| 55 | Technical Writer (customer-facing) | — | **ADD** (help center, product/API docs) |
| 56 | Data Steward | Data Protection Officer | rename (retention, GDPR export/delete — Tier D) |

---

## Folded / removed from our 65 (no quarantine — merged or deleted)
- **Chief Executive Officer** → removed (the human is CEO).
- **VP of Engineering** → Engineering Lead. **Backend/Frontend/Full-Stack/Mobile/Data Team Leads** → their
  IC role (flatter). **Full-Stack Engineer** → Backend Engineer.
- **Group Product Manager, Technical Product Manager** → Product Manager. **Product Analyst** → Unit Economics
  Analyst / Data (analytics has no separate dept in the canon).
- **Head of Design, Brand Designer** → Head of Product owns design; Product Designer absorbs brand.
- **QA Automation Engineer** → Functional/Regression Test Engineers.
- **VP of Sales, Sales Engineer** → Account Executive. **Head of Growth, Growth Engineer, Performance
  Marketer** → Marketing Lead / Email-Lifecycle / Sales Ops.
- **Head of Customer Success, Onboarding Specialist** → Customer Success Manager.
- **Licensing dept (Head of Licensing, Licensing Ops, Billing Ops, Partnerships Manager)** → the canon has no
  licensing dept: billing → Bookkeeper/Finance Controller; partnerships → Account Executive; licensing terms →
  Legal & Compliance Analyst.
- **Finance: Financial Analyst** → Finance Controller. **Data dept (Head of Analytics, Data Analyst, Business
  Intelligence Engineer)** → Unit Economics Analyst / Data Steward / Bookkeeper (no standalone Data dept in the
  canon). **General Counsel, Contracts Specialist** → Legal & Compliance Analyst.

**Count check:** 56 canonical = 4 + 6 + 12 + 8 + 7 + 6 + 8 + 5. New roles to ADD: 24. Renamed: 13. Directly
mapped: 19. Folded/removed source roles: ~29 (into their canonical homes).

## Reporting map (canonical)
Human → Auditor (3) direct · Human → Chief of Staff (1) → department leads: Head of Product (5), Engineering
Lead (11), QA Lead (23), Release Manager (31) + Customer Success Manager (36), Finance Controller (38) [anomaly
line to human], Marketing Lead (44) + Account Executive (50). Knowledge & Memory report to CoS. Program Manager
(2) + Risk Scoring Officer (4) staff the CoS.
