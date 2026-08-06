# The Workflow Gap Analysis — every software-company workflow vs. what the 56 actually run

**Date:** 2026-08-06 · **Method:** canonical SaaS workflow map (20-200 person company, grounded in the
GitLab handbook, Google SRE, PagerDuty, Atlassian playbooks, Gainsight/RevOps standards) crossed
against the implemented codebase (SOPs, loops, org modules, cron tick, playbooks). Three verdicts per
workflow: **✓ implemented** · **◐ partial** · **✗ missing** · **n/a** (humans-only concern that a
56-agent company genuinely does not need, or needs in a different shape).

## The one-paragraph verdict

The org is strongest exactly where software companies are usually weakest (governed execution:
build→test→review→deploy with receipts) and weakest where every company's calendar lives: **the
workflows that run a company across time.** We do work superbly; we do not yet close months, forecast
weeks, review quarters, or run the customer's post-sale life. Of the ten existential workflows, we
fully hold five, partially hold four, and are missing one entirely — and the missing one (invoicing/
collections) has been task R1 all along. The gap list below is the 98-plan's missing chapter.

## Crosswalk by department

### Engineering — the strongest department
| Workflow | Status | Where |
|---|---|---|
| Standup / async status | ✓ | recurring standups on the daily tick |
| Sprint plan → build → review cycle | ✓ | org-run DAG + loop engine (plan→build→test→review→fix→deploy→monitor→learn) |
| Code review, two-reviewer norm | ✓ | Design-Lead gate + reviewer gates + merge queue (P2) |
| Release management + QA gate | ✓ | Release/Certification SOPs, `npm run qa` locally + CI on every push |
| Incident response | ✓ | incident loop + Incident SOP + kill switch/freeze |
| Blameless postmortem artifact | ◐ | learnings are captured; no formal postmortem doc per Sev-1 with tracked action items |
| ADRs / RFC process | ✓ | 27 ADRs; architect-knowledge feeds builds |
| Tech-debt register (recurring) | ✗ | Debt-Zero was a one-off; no recurring triage |
| Dependency/security patching (automated) | ✗ | license shield ✓, but no Renovate-style patch cadence; node_modules corruption is handled by hand |
| On-call / 24-7 | n/a→✓ | the org is always-on by construction; escalation to the human queue |

### Product
| Workflow | Status | Where |
|---|---|---|
| Spec/PRD + review | ✓ | Spec SOP + validation gate |
| Roadmap + prioritization | ✓ | loop objectives + evaluate |
| Analytics/funnel review + experiments | ✓ | revenue loop, growth_experiments, attribution |
| Launch checklist | ✓ | launch-week playbook |
| Continuous discovery (user interviews) | ✗ | no human-interview motion; validation gate is inference, not conversation |
| Beta program / CAB | ✗ | becomes real at customers > 0 |
| Pricing review cadence | ◐ | tiers exist as decisions, not as a quarterly review ritual |
| Design critique / craft bar | ✓ | design-lead review (craft bar) |
| Usability testing | ✗ | none |

### Marketing — broad after this month
| Workflow | Status |
|---|---|
| Campaign/Content/SEO/Social/Lifecycle | ✓ 5 SOPs + SEO factory + Video Factory + receipts campaign |
| Attribution + funnel reporting | ✓ attribution.ts + pixel + revenue_events |
| Competitive intel / battlecards | ✓ market watch (scan→diff→battlecard) |
| Events | ◐ hackathon radar/run is our events motion; no webinar/booth analog (fine) |
| Win/loss analysis | ✗ no ritual for why deals are won/lost (needs deals first, but the SOP can exist) |
| PR moments | ◐ buildinpublic exists; no press-release/media-list motion (big-bang launch will need it) |

### Sales
| Workflow | Status |
|---|---|
| Prospecting sequences + CRM hygiene | ✓ SOPs + competitive-selling pipeline (in progress, #74) |
| Discovery/demo | ◐ services + /room; live demo = founder today |
| Proposal/quote → checkout | **✗ R1** — the cash register is still not live (task #56) |
| Weekly pipeline review + forecast call | ✗ no forecast cadence anywhere |
| Negotiation/contracts | n/a by design — human floor (founder signs) |
| Sales→CS handoff | ✓ kickoff + customer mandate |

### Customer Success — the biggest structural hole
| Workflow | Status |
|---|---|
| Support triage/SLA + escalation | ✓ support loops + SOPs + abuse intake |
| Customer onboarding | ✓ the 30-minute rail (ADR-0027) is exactly this |
| Health scoring | ✗ none (abuse-freeze exists; health ≠ abuse) |
| Customer QBR / receipt review | ✗ planned as "weekly receipt digests to buyers," not built |
| Renewal management (90-120d pre) | ✗ none |
| Churn-risk save plays | ✗ none |
| NPS/CSAT + close-the-loop | ✗ none |
| KB upkeep | ◐ docs exist; no customer-facing KB motion |

### Finance
| Workflow | Status |
|---|---|
| Spend control / budgets | ✓ treasury envelopes + caps + unit economics |
| Finance reporting | ✓ finance-report loop |
| Payroll (agent analog: model spend) | ✓ per-agent routing + envelopes |
| Invoicing/AR/collections | ◐ Polar-as-MoR will carry it — **gated on R1** |
| Month-end close ritual | ✗ no reconciliation/close checklist (Polar↔ledger↔treasury) |
| 13-week cash forecast | ✗ none |
| Budget-vs-actuals variance review | ◐ envelopes are budgets; no variance ritual |
| Board/investor pack | ✓ funding-pack (genuinely ahead of most startups) |
| Tax/filings | n/a — human floor + accountant |
| Procurement/vendor + license audit | ✓ Procurement SOP; sentry (ADR-0027 slice) adds renewals |

### People (reimagined for agents)
| Workflow | Status |
|---|---|
| Hiring/onboarding (agents) | ✓ personas + agent-lifecycle + role map |
| Performance DATA | ✓ agent-performance.ts |
| Performance CYCLE (calibrate → coach → retire) | ✗ we measure agents but never formally review, tune, or retire them on cadence |
| Offboarding/access revocation | ✓ kill switch, freeze, key revocation |
| Comp cycle (agent analog: model-tier assignment) | ◐ per-agent model routing exists; never revisited on cadence |
| Human-HR (benefits, engagement, ER) | n/a until employee #2 |

### Legal/Compliance
| Workflow | Status |
|---|---|
| Privacy/DSAR | ✓ Data-Request SOP + GDPR module |
| License/IP hygiene | ✓ license shield + notices |
| ToS/policies | ◐ pending entity + lawyer (C1) |
| Contract redlines | n/a by design — human floor |
| SOC 2 evidence collection cadence | ✗ trust center states the gap honestly; no evidence pipeline yet |
| Vendor security review | ◐ footage/source allowlists exist; no general vendor review |

### Executive
| Workflow | Status |
|---|---|
| Decision log | ✓✓ decision queue + append-only audit (better than most human companies) |
| Weekly leadership sync | ◐ deliberation engine (#72) is designed, not built; /room is the surface |
| All-hands/WBR | ◐ daily digest ≈ WBR lite; no weekly KPI scorecard ritual |
| OKR cycle (set → check → score → retro) | ◐ loop objectives + evidence-based evaluate = the mechanism; no quarterly scoring retro |
| Investor updates | ✓ funding pack + receipts |
| Strategy cycle | ✓ the 98-plan/memos process (founder + operator) |

### IT/Ops
| Workflow | Status |
|---|---|
| Access provisioning/deprovisioning | ✓ connect rail + revocation |
| Credential health / renewal calendar | ◐ connection sentry designed (ADR-0027 slice 5), not built |
| Backup restore VERIFICATION | ✗ Supabase backups exist; never test-restored |
| DR drills / tabletop | ◐ failover/freeze/rotation drills planned (P5), not run |
| Device/MDM/office | n/a |

## The existential-ten scorecard

1. Cash close + runway — **◐** (treasury ✓, close ritual + 13-week forecast ✗)
2. Payroll (model-spend analog) — **✓**
3. Invoicing + collections — **✗ = R1, task #56** ← the one fully-missing existential workflow
4. Incident response — **✓**
5. Release + QA gate — **✓**
6. Pipeline gen + weekly forecast — **◐** (generation ✓, forecast ritual ✗)
7. Renewals + churn saves — **✗** (moot at 0 customers; existential at customer #1 — must exist before the campus pilot)
8. Support SLA triage — **✓**
9. Deprovisioning + patching — **◐** (revocation ✓, automated patching ✗)
10. Goal cadence + saying no — **◐** (validation gate = saying no ✓; quarterly scoring retro ✗)

## What to build, ranked (the missing chapter of the 98-plan)

1. **R1 — checkout live.** Already queued; this analysis makes it the only red existential box. Nothing else on this list matters until money can arrive.
2. **The Retention Desk** (one coherent build): customer health scoring → weekly receipt-review digest to each buyer → renewal motion starting 90 days out → churn-save play that escalates to the founder. Must exist before the first campus pilot signs, because in subscription business retention IS the business.
3. **The Forecast Ritual**: weekly pipeline + cash view on the daily tick (13-week cash forecast from treasury + Polar data; pipeline stages from the selling pipeline). One digest section, enormous blindness removed.
4. **The Close**: monthly reconciliation ritual (Polar ↔ revenue_events ↔ treasury ledger), producing a signed monthly close receipt. For the company whose moat is verified numbers, closing the books publicly is brand.
5. **Boring death-preventers**: automated dependency patching (Renovate config + CI), quarterly backup test-restore, and running the P5 drills that are already designed.
6. **The Agent Review Cycle**: quarterly calibrate → retune → retire ritual over agent-performance data; the People function for a workforce of software. (Also a launch-marketing story nobody else can tell.)
7. **Retro/postmortem artifacts**: formal postmortem doc per Sev-1 with tracked action items; quarterly OKR-style scoring of loop objectives.
8. **Learning-from-market loops**: win/loss SOP + NPS/CSAT once customers exist.
9. **Discovery with humans**: user-interview motion + beta program at first pilot.
10. **SOC 2 evidence pipeline** when institutional funding lands (trust center already promises this honestly).

## What we deliberately do NOT need (and should say so proudly)

Meeting theater (the org's "meetings" are the audit log), calendar tetris, glue-work heroics (the
loop driver IS the glue), commissions, engagement surveys, office IT, comp negotiations, and the
entire class of workflows that exist because human attention is scarce and human memory is lossy.
Roughly a third of the canonical map dissolves when the workforce is software — that dissolution,
stated precisely, is the pitch.
