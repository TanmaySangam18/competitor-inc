# Case Study: Tesla Crew in Action

> **Honesty note (2026-07-03):** this is an *illustrative scenario*, not a real customer story, and
> its dollar figures are org-modeling numbers — the product's real spend policy is
> `lib/engine/policy.ts` (hard caps, approval gates). Written to show the mechanics, not as proof.

## The Idea

**Founder**: A mechanical engineer + software person who wants to build an EV company focused on software-first architecture.

**The pitch**: "Make an EV where the software is the moat. Hardware is commodity; move fast like a SaaS company."

**Their question to competitor.inc**: "Can I validate this is worth building before I quit my job and fundraise?"

---

## Week 1: Idea to Crew

### Monday: Founder signs up
1. Creates account on competitor.inc
2. Submits idea: **"EV with software-first architecture"**
3. System generates custom crew from Tesla's org structure

### System outputs: Tesla Crew (5 agents, $1.15M/mo spend cap)

**CEO** — Elon (Strategy)
- $500K/mo spend cap
- Responsibilities: Set quarterly OKRs, diagnose constraints, allocate resources
- Playbook: Playing to Win (Lafley & Martin)

**Manufacturing Lead** — JB
- $200K/mo spend cap
- Responsibilities: Get to 10K units/week production, reduce costs, manage supply chain
- Playbook: Toyota Production System
- **Sub-agents**:
  - Supply Chain Agent ($120K): negotiate battery suppliers
  - Quality Agent ($80K): test automation, defect analysis

**Engineering Lead** — Lars
- $300K/mo spend cap
- Responsibilities: Build vehicle OS (firmware, Autopilot, OTA updates), autonomous driving
- Playbook: Shape Up (Basecamp)
- **Sub-agents**:
  - Firmware Engineer ($150K): motor control, BMS, thermal
  - ML/AI Engineer ($105K): autonomous driving models
  - Infrastructure Engineer ($45K): cloud, CI/CD, data pipeline

**Growth Lead** — Ella
- $100K/mo spend cap
- Responsibilities: Generate demand, go-to-market strategy, customer acquisition
- Playbook: Bullseye / Traction (direct-to-consumer)
- **Sub-agents**:
  - Demand Generation ($50K): paid ads, funnel optimization
  - Content Agent ($50K): PR, social, brand narrative

**Support Lead** — Alex
- $50K/mo spend cap
- Responsibilities: Customer support, Supercharger network, warranty

---

## Week 2-4: Validation Campaign (Shift 1-21)

### The plan:
Test if **demand exists** for "software-first EV" before building anything.

**CEO's constraint diagnosis**:
> Traffic is the bottleneck, not conversion. We're starting from zero signups. 
> First step: get the founder's story + the idea in front of the right people.

### Night 1-3: Growth campaign (Demand test)

**Night 1 (Tuesday):**
- Ella (Growth) runs market research: who cares about software-first EVs?
- Diagnoses: **target = Tesla engineers frustrated with pace**
- Proposes: Founder posts on Hacker News + Tesla subreddit + Twitter

**Approval Inbox**: Growth spend $500 (pixel setup, low cost → AUTO)
✅ **Execution**: Founder mentions "founding an EV company" on Twitter

**Night 2 (Wednesday):**
- CEO analyzes: 50 profile visits, 0 signups yet
- Growth proposes: Founder's longer story (email + blog)
- **Approval Inbox**: Outreach email to 100 Tesla engineers (QUEUE for outreach)

**Founder approves from Telegram**: ✅

**Night 3 (Thursday):**
- 5 reply DMs from Tesla engineers
- Growth proposes: Direct conversation with 3 interested ones (pre-order conversation)
- CEO approves interview framework
- Scorecard shows: **150 views, 2 signups**

### Night 4-7: Demand test phase 2

**Night 4 (Friday - Weekly Review):**
```
Scorecard:
  Views: 150 (target 500/week)
  Signups: 2 (target 10/week)
  Constraint: TRAFFIC (need more reach)

Rocks:
  - Rock 1: Get 100 paying pre-orders by Month 3 (2/100) ✗
  
Issues:
  - [ ] Twitter/HN reach limited (need bigger platform)
  - [ ] No dedicated landing page (just Twitter)
  - [ ] Pricing not defined (can't pre-sell yet)

Next week:
  - Build landing page (explain software-first approach)
  - Reach out to 5 VCs interested in EV + ask for intros to customer
  - Set founding member pricing ($10K pre-order)
```

**Night 5-7 (Mon-Wed of Week 3):**
- Engineering builds simple landing page (1 day)
- Growth publishes "Why software-first? " blog post
- CEO reaches out to 5 VCs for warm intros
- Scorecard: **400 views, 15 signups**

**Night 8 (Thursday):**
- CEO sees: views up 3x, but conversion is 3.75% (target 3%) ✓
- Growth proposes: "Founding member pre-order tier" ($10K)
- **Approval Inbox**: Spend $3K on targeted ads (Meta + LinkedIn)

**Founder approves**: ✅

### End of Week 3: The Results

```
Scorecard (measured real data):
  Views: 400
  Signups: 15
  Pre-orders: 0 (pricing just launched)
  Revenue: $0 (awaiting traction)

Constraint: Now CONVERSION (have traffic, but low signup rate)

CEO insight:
> "Good news: demand signal is there (400 views from cold start).
> Bad news: only 3.75% conversion. People are interested but not confident.
> Hypothesis: narrow the offer to ONE thing: who's this for + why software matters.
> Next: test a 3x narrower landing page (B2B: fleet operators only)."

Approve next: Conversion test landing page (copy test, no new spend)
```

---

## Week 4-8: Monetization Test

### The shift: From "is there demand?" to "will they pay?"

**Night 9-14 (Week 4):**
- Growth tests: "Founding member pre-order: $10K deposit"
- CEO frames: "First 100 get 10% lifetime discount + board seat in advisory"
- **Approval Inbox**: Social posts + email (QUEUE for outreach)

**Founder approves from phone while on a hike**: ✅ (Telegram button tap)

**Night 10:**
- 1 pre-order placed (founder's friend, but counts as real signal)
- CEO proposes: Interview the buyer (why'd you commit? what's missing?)
- **Result**: Founder learns: **buyers care about software updates, not hardware specs**

**Night 11-14:**
- Growth repositions: "Update the car every week like your phone" (not "better battery")
- Scorecard: **600 views, 50 signups, 3 pre-orders ($30K revenue)**
- **Constraint shifts to MONETIZATION**: Getting commits now

### Night 15 (Friday - Weekly Review, Week 5)

```
Rocks Progress:
  - Rock 1 (100 pre-orders): 3/100 (3%) - BEHIND but with momentum
  
Scorecard:
  Views: 600 (↑50% week-over-week)
  Conversion: 8.3% (↑from 3.75%) 
  Pre-orders: 3 / Pre-order rate: 6% (3 / 50 signups)
  Revenue: $30K
  
Constraint: MONETIZATION
  (have 600 views, 50 signups, 6% converting to pre-order)
  
CEO recommendation:
> "You have proof: 3 real customers with real money.
> Now iterate on why they bought. Next week:
> 1. Interview all 3 pre-order customers (30 min each)
> 2. Identify: what one thing made them decide?
> 3. A/B test that one thing on the landing page"

Issues resolved:
  ✓ Pricing defined ($10K pre-order)
  
Issues created:
  [ ] Manufacturing specs (need to tell them what they're getting)
  [ ] Battery roadmap (customers asking: when's the first batch?)
```

---

## Week 8-12: Product Reality Check

### Manufacturing steps in

**Night 16+ (Week 6):**

CEO sees: 3 pre-orders = founder should start thinking about actually building this.

CEO proposes: **Manufacturing feasibility study**
- Cost breakdown: battery, motors, electronics, assembly
- Supply chain check: can I actually get 100 units in 12 months?
- Timeline: how long to first prototype?

**Cost: $100K deep-dive (policy verdict: QUEUE for spend)**

**Founder approves from home office**: ✅

**Manufacturing spawns sub-agents:**
1. **Supply Chain Agent** ($60K budget)
   - Researches battery suppliers (CATL? BYD? LFP cells?)
   - Checks lead times (3-6 months to first batch?)
   - Preliminary cost: $4K per battery pack (target: $3K)

2. **Quality Agent** ($40K budget)
   - Designs test protocol (what tests matter for first 100?)
   - Safety requirements (NHTSA crash tests? Not for first run)
   - Quality gate: max 1% defect rate

**Night 17-21:**
Both sub-agents execute. Results flow into Manufacturing's proposal.

**Manufacturing reports:**
```
Feasibility: POSSIBLE but HARD

Battery cost: $4K/unit (vs target $3K)
  → Blocker: Battery sourcing at volume

Timeline to first 100 units: 12 months minimum
  → Critical path: battery supply contract (6 month lead time)

Quality plan: Test on first 10, then ramp to 100

Recommendation: Get battery supplier CONTRACT SIGNED in next 30 days
  This is the bottleneck. Everything else is doable.
```

**CEO insight:**
> "Manufacturing just gave us the hard answer: we're hardware-constrained.
> The software-first thing? That's real + differentiated.
> But the battery supply is the real moat blocker.
> 
> Founder: Do you have relationships in battery space?
> Can you talk to CATL/BYD? Can you fundraise off this proof?"

**Founder's decision point:**
- 3 pre-orders (real customers)
- Manufacturing feasibility confirmed
- Bottleneck identified: battery sourcing
- Next decision: Go dark for 3 months to secure battery + raise, OR pivot to software focus (no hardware)?

---

## Learnings: What This Reveals About Founder

**From the validation data:**
1. ✓ **Demand exists** (600 views, 50 signups, 3 paying = repeatable pattern)
2. ✓ **Differentiation is software** (customers mentioned updates, not specs)
3. ✓ **Market is willing to pay** (3 founders committed real money)
4. ✗ **Hardware is the blocker** (battery sourcing = 6 month lead time)
5. ✗ **Timing mismatch** (12 month build vs 30 day capital window)

**Founder's playbook options:**
A) Go full-hardware: Raise $30M, hire manufacturing team, navigate supply chain (10 years to profitability)
B) Software-first pivot: Build the OS first, license to existing OEMs (Tesla, VW, etc.) (3-5 years to market)
C) Abandon: Demand validates software interest, but founder is hardware-person (pivot to software tools)

---

## The Verdict

**competitor.inc enabled in 8 weeks:**
- ✓ Validated demand ($30K pre-orders from cold start)
- ✓ Identified key differentiation (software updates)
- ✓ Uncovered the real blocker (battery sourcing)
- ✓ Made a data-driven decision (pivot vs fundraise)

**Without competitor.inc's crew:**
- Founder would have spent months building before learning customer wanted software focus
- Hardware complexity would have surprisedsummer in month 6 (not week 6)
- Capital would have been wasted on the wrong thing

**Result**: Founder doesn't quit their job yet. Instead, they pivot to SaaS tool for EV makers (licensing the software). Different market, same customers, no hardware blocker.

---

## Key Takeaways

1. **Crew adapted to idea**: Tesla org structure made sense for an EV idea
2. **Sub-agents unblocked work**: Manufacturing dilemma needed two perspectives (supply chain + quality)
3. **Policy protected founder**: Every spend > $1K needed approval (never blank-check)
4. **Chat + ChatOps kept founder in loop**: Could approve from phone, never lost control
5. **Growth Loop identified constraint**: Traffic → Conversion → Monetization → Manufacturing reality-check
6. **Operate layer clarified decision**: Scorecard + Rocks showed exactly what succeeded + what didn't

**Bottom line**: Validation is the product. competitor.inc ran the validation, founder stayed in control, decision was made on real data, not intuition.

---

**Status**: ✅ Idea validated (decision made in 8 weeks, $0 wasted, founder stayed employed)

**Next**: Founder either fundraises for hardware or pivots to software tools. Either way, with proof.
