# Proposal: "Blond" — a GTM-strategist agent encoding Sam Blond's playbook

**Status:** Exploration / design proposal (2026-06-30)
**Author:** competitor.inc engine team
**Research basis:** `scratchpad/sam-blond-brief.md` (sourced; every load-bearing claim has a URL).
**Honesty guardrail:** This proposal encodes *publicly documented frameworks*. It does NOT impersonate
Sam Blond, claim endorsement, or attribute benchmarks to him that he hasn't stated publicly (see
"What we will NOT claim"). Naming/branding is a separate legal/marketing decision — see §9.

---

## 0. TL;DR

Encode Sam Blond's *demand-first, augmentation-not-replacement* GTM methodology into a new specialist
agent ("the Closer" internally; public name TBD) that plugs into the **existing** competitor.inc
engine. It designs and runs an end-to-end outbound-led GTM motion — ICP → trigger-based targeting →
creative outbound → lead scoring → pipeline → lifecycle — with a hard human-in-the-loop line at the
customer conversation. It is **dual-use**: it acquires customers for competitor.inc itself (our #1 and
#2 goals: 10K signups + a company clearing $1,000) AND ships as a feature our customers deploy on their
own companies. Strongest single bet because it maps 1:1 onto what we already have: the agent roster, the
policy engine, the Approval Inbox, `distribution.ts`, and the import-and-sell on-ramp.

Crucially, **Blond's own company (Monaco) is built on exactly this human-in-the-loop thesis** —
"Monaco does not have an agent pretending to be a sales rep" ([TechCrunch](https://techcrunch.com/2026/02/11/former-founders-fund-vc-sam-blond-launches-ai-sales-startup-to-upend-salesforce/)).
That validates the design *and* defines our differentiation lane (see §8 risks: we are not Monaco).

---

## 1. Why this fits competitor.inc specifically

We already have the skeleton this agent needs:

| We already have | The Blond agent uses it for |
|---|---|
| Agent roster `ceo/engineering/marketing/support/growth` (Apex/Forge/Pitch/Guard/Surge) in `lib/engine/types.ts` | Adds/upgrades the GTM brains; Surge (Growth) is the natural host role |
| `policy.ts` `decide()` five-gate + per-agent matrix + spend caps + kill switch | Enforces the autonomy/approval boundary (§4) without new infra |
| Approval Inbox + `ApprovalItem` (`twitter`/`linkedin`/`outreach`/`spend`) | The draft→approve→send loop Blond's method demands |
| `distribution.ts` (just shipped) — research-grounded GTM drafts for imported products | The seed of the outbound engine; Blond's frameworks deepen it |
| Import-and-sell on-ramp (`importCompany`) | "I built it, can't sell it" → point the Blond agent at it |
| BKG / `bkg.ts` channel model + memory (`recall`/`remember`) | Cross-night coherence and ICP/pipeline state |
| Glass Box + Rationale Stream | Every GTM action shows the Blond principle behind it ("why: referrals convert ~3x") |

This is an **upgrade of an existing seam**, not a greenfield product. That's what makes it the
highest-ROI bet rather than a moonshot.

---

## 2. The agent's encoded knowledge (from the sourced brief)

The methodology compiles into machine-usable rules. Each is traceable to a source so the Rationale
Stream can cite *why*.

**A. ICP / targeting — the concentric-circles model.** Tiered lead-priority graph:
`personal network → investor network → employee network → customer referrals → branded cold`.
Plus **trigger-based account selection** (e.g. "recently raised, in-segment, in-geo"). Encodable as an
intent filter + a priority score. *(brief §2 ICP)*

**B. Lead scoring by source quality.** Referral > inbound > outbound > closed-lost; referrals convert
~3x. Score = f(source tier, trigger freshness, ICP fit). Track **conversion-rate-by-channel**, not raw
volume. *(brief §1F, §2)*

**C. Demand is the bottleneck.** The agent's North-Star leading metric is **new opportunities created /
week**, not conversion %. "Focus on demand until you have too much." It will *refuse* to optimize
conversion when the real constraint is demand, and say so. *(brief §1E)*

**D. Outbound philosophy = creative, brand-aligned, non-scalable-first.** Personalized value-first first
touch over templated blasts; "do not blast people who've never heard of you." The "champagne campaign"
($19K → 169 customers, ~$112 CAC) is the archetype the agent *proposes* (a creative, do-things-that-
don't-scale play), then a human executes the physical/relationship part. *(brief §1G, §3)*

**E. Pipeline management on leading indicators.** Opportunities/week, calendar-fill as the
headcount-vs-demand signal, ramp tracking. *(brief §2 pipeline)*

**F. Lifecycle / implementation obsession.** First-30-days milestone checklist as the churn predictor
("obsess over implementation"). *(brief §1H #9)*

**G. Comp/quota & hiring scorecards** — relevant when the *customer* is scaling a real sales team
(later phase / B2B customers). Encodable as structured rubrics. *(brief §2)*

### What we will NOT claim
- We will **not** state CAC-payback, the SaaS "magic number," or a specific pipeline-coverage ratio
  *in his voice* — the research found no evidence he says these publicly.
- We will **not** present paraphrased quotes as verbatim.
- We will **not** ship an agent that pretends to be a human rep to a prospect (his line, and ours).

---

## 3. Multi-agent collaboration (how the crew divides the motion)

Maps onto our existing roles; new responsibilities in **bold**. One orchestrator, four specialists,
all gated by `policy.ts`.

```
                 ┌─────────────────────────────────────────┐
                 │  Apex (CEO/orchestrator)                  │
                 │  picks the constraint: demand vs convert  │
                 └───────────────┬──────────────────────────┘
        ┌────────────────┬───────┴───────┬─────────────────┐
        ▼                ▼               ▼                  ▼
  GTM Strategist     SDR/Outbound     CRM Architect     Growth Analyst
  (Surge+Blond)      (Pitch)          (new: "Ledger")   (new: "Gauge")
  ICP, channel mix,  trigger lists,   pipeline schema,  conv-by-channel,
  campaign design,   draft sequences, stage rules,      opps/week, ramp,
  the "creative play" personalization  task automation   "what's the bottleneck"
        └────────────────┴───────┬───────┴─────────────────┘
                                 ▼
                          Customer Success (Guard)
                          first-30-day implementation checklist, churn signals
```

- **GTM Strategist** (the Blond brain, hosted on Surge): owns ICP, the concentric-circles plan, the
  channel-mix decision, and proposes the one creative non-scalable campaign.
- **SDR/Outbound** (Pitch): builds trigger-based lists, drafts personalized value-first sequences +
  3-touch follow-ups (we already do this in `distribution.ts`), queues every send for approval.
- **CRM Architect** (new role *Ledger*): defines pipeline stages, scoring rules, and the workflow
  automations (stage transitions, task creation, reminders). This is the "CRM workflows" ask.
- **Growth Analyst** (new role *Gauge*): the metrics brain — opps/week, conversion-by-channel, ramp,
  and the **bottleneck diagnosis** that tells Apex whether to push demand or fix conversion.
- **Customer Success** (Guard): first-30-day implementation milestones, churn-risk flags.

These five already share state via memory + BKG; the new roles are additions to `AgentRole`, the
`AGENTS` spec, and the policy matrix.

---

## 4. Autonomy boundary — what's autonomous vs. human-gated

Directly from Blond's own augmentation thesis (Monaco), enforced by our `policy.ts` `decide()`:

| Stage | Mode | Why |
|---|---|---|
| ICP definition & trigger lists | 🟢 Autonomous | Pure data work; reversible; no external side-effect |
| Enrichment & lead scoring | 🟢 Autonomous | Internal computation |
| Channel-mix & campaign *design* | 🟢 Autonomous (proposal) | A plan, not an action |
| Outbound copy *drafting* | 🟢 Autonomous | Draft only |
| Pipeline hygiene / metrics / bottleneck call | 🟢 Autonomous | Internal; surfaces a recommendation |
| **Sending any outbound** (email/DM/social) | 🟡 **Human-approve** | Reputation + deliverability + CAN-SPAM; existing `outreach`/`twitter`/`linkedin` approval kinds |
| **Spend** (ads, the champagne play) | 🟡 **Human-approve** | Money; existing `spend` gate + caps |
| **The customer meeting / live conversation** | 🔴 **Human-only** | Blond's hard line; we never impersonate a rep |
| **In-person / creative non-scalable touch** | 🔴 **Human-only** | The signal *is* that a human did it |
| **Pricing, contracts, discount authorization** | 🔴 **Human-only** | Commercial commitment |

This is the same draft→approve→send spine we already ship — we're not loosening any gate.

---

## 5. End-to-end motion (what a customer actually gets)

For an **imported / already-built** product (our wedge), one command — "grow this with my crew" —
triggers:

1. **ICP brief** (autonomous): concentric-circles map + 2-3 trigger segments, with rationale.
2. **Channel decision** (autonomous): which of the ~19 channels to test first, ranked by expected
   first-customer ROI (we already run a Bullseye pass in `distribution.ts`).
3. **Lead list + scoring** (autonomous): trigger-matched accounts, scored by source quality.
4. **Outbound drafts** (autonomous → queued): personalized first touch + 3-touch follow-up; one
   creative non-scalable campaign proposal. *Founder approves each send.*
5. **CRM/pipeline setup** (autonomous): stages, scoring thresholds, task automations.
6. **Nightly run** (autonomous, gated): new opportunities created, pipeline hygiene, metrics; surfaces
   the **bottleneck call** ("you have demand, fix conversion" / "stop optimizing, go get demand").
7. **Lifecycle** (autonomous + gated): first-30-day implementation checklist per new customer; churn
   flags to the founder.

Every step writes to the Glass Box with its Blond-sourced rationale. Nothing leaves the building
without a human yes.

---

## 6. Productization — reusable for our customers

Yes, and this is the strategic prize. Same engine, two deployments:

- **Inward (now):** point it at competitor.inc itself → drives our 10K-signup + first-$1,000 goals.
  This is also our proof: "we used our own GTM agent to get our first N customers" (only ever with
  *real* numbers — per our no-fake-proof rule).
- **Outward (product):** every customer who imports a built-but-unsold product gets the Blond motion as
  the core of the paid tier. This is the natural upgrade to the Operator/Founder tiers and the sharpest
  answer to "building was never the hard part."

Because it rides the existing per-company isolation, policy engine, and BYOK model, multi-tenant is
already handled — a customer's GTM agent runs on their connections, their approvals, their data.

---

## 7. Technical feasibility & roadmap

**Feasibility: HIGH.** No new infra; it's new agent roles + encoded rules + UI on rails we already run.

| Phase | Scope | Effort | Depends on |
|---|---|---|---|
| **MVP (P1)** | GTM Strategist + SDR roles; ICP brief + scored lead list + outbound drafts (deepen `distribution.ts` with concentric-circles + trigger scoring); all queued in Approval Inbox; Glass Box rationale citing sources | ~1 sprint | nothing new (works simulated; better with a model key) |
| **P2** | Growth Analyst (Gauge) — opps/week + conversion-by-channel + the bottleneck call; pipeline view | ~1 sprint | activity/metric history (have it) |
| **P3** | CRM Architect (Ledger) — pipeline stages, scoring thresholds, workflow automations; first-30-day lifecycle checklist (Guard) | ~1-2 sprints | a lightweight CRM data model (new tables) |
| **P4 (prod platform)** | Real enrichment + trigger data (funding/intent), real send integrations (email/LinkedIn) behind approvals, comp/quota + hiring-scorecard module for scaling customers | multi-sprint | **external data + send providers (cost + ToS), see blockers** |

MVP can ship on the **simulated engine** (no key) exactly like the rest of the product, then get
sharper with a model key — consistent with our "works offline, frontier-first behind a swappable
interface" posture.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Likeness/trademark** — using "Sam Blond"/Monaco branding | Encode *public frameworks* (facts/methods aren't copyrightable); do **not** use his name/likeness as the product name or imply endorsement without permission. Internal codename only until legal sign-off (§9). |
| **We look like a Monaco clone** | We're not: Monaco is a standalone enterprise sales-team replacement ($35M, Salesforce-tier ambition). Ours is GTM-for-the-builder-who-can't-sell, inside a validate→build→sell loop, for first-time/student founders. Different buyer, different wedge. |
| **Deliverability / spam law** (CAN-SPAM, Gmail/MS 2025 rules) | Keep sends human-approved; enforce SPF/DKIM/DMARC guidance, one-click unsubscribe, low per-inbox volume; never scraped blast (our standing rule). |
| **Fabricated pipeline/“results”** | Hard rule already in force: real numbers only; the agent reports drafted/queued, never "sent/closed" it didn't do. |
| **Over-automation erodes the signal** | The non-scalable/creative/in-person plays are human-only *by design* — that's where the conversion lift lives. |
| **Encoding unverified benchmarks** | The brief's "Uncertain" list is the do-not-encode list. |

---

## 9. Open decisions for the founder

1. **Naming/branding** — internal codename ("the Closer") vs. a public name. Do NOT use "Blond"/Monaco
   publicly without legal review. Recommend: ship the *capability* under a neutral name; cite the
   frameworks' public sources in the Playbooks tab (consistent with our existing "Playbooks = user
   resource" framing).
2. **Build order** — recommend **P1 now** (it directly serves the 10K/$1,000 goals and reuses
   `distribution.ts`), defer P3/P4 until first paying users validate the motion.
3. **New CRM tables** (P3) — adds schema; confirm before we touch the data model.
4. **External data/send providers** (P4) — real cost + ToS exposure; a deliberate go/no-go.

---

## 10. Expected business impact

- **Inward:** a credible engine to manufacture (and *prove*, with real receipts) competitor.inc's own
  first customers — the validation milestone the whole project is gated on.
- **Outward:** turns the import-and-sell wedge from "audit + drafts" into "a GTM operator that runs the
  whole motion" — the clearest justification for the Operator ($39) → Founder ($299) upgrade, and the
  sharpest possible expression of our positioning ("Building was never the hard part").
- **Defensibility:** the encoded, sourced methodology + the Glass-Box/approval trust model is hard to
  copy credibly and aligns with the most respected public GTM playbook in SaaS.

**Recommendation: approve P1 (MVP) as the next build after the current launch-readiness work, scoped to
deepen `distribution.ts` into the GTM-Strategist + SDR pair with concentric-circles targeting,
source-quality scoring, and the demand-bottleneck diagnosis — all on the existing approval spine.**
