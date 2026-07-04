# Operate Layer: EOS-Inspired Quarterly Planning

## Overview

The **Operate Layer** is competitor.inc's operating system for goal-setting and constraint-tracking, inspired by **EOS (Entrepreneurial Operating System)**.

**The promise:** You define quarterly Rocks (goals), the crew executes and tracks progress, you review weekly, and constraints bubble up as Issues for the team to resolve.

---

## Part 1: Core Concepts

### Rocks (Quarterly Goals)

A **Rock** is a significant, outcome-driven goal for the quarter.

**Characteristics:**
- **Specific**: "Reach 1,000 paying customers" (not "grow revenue")
- **Measurable**: Has a clear done/not-done verdict
- **Owned**: Assigned to one person (founder or agent)
- **Time-bound**: Q1, Q2, Q3, or Q4
- **Ambitious but achievable**: ~70% confidence you'll hit it

**Examples:**
```
Rock 1: Ship v0.1 (validate idea with 100 signups)
Rock 2: Close first $10K MRR
Rock 3: Build Slack integration (expand use case)
Rock 4: Hit 50% NPS (retain users)
```

**Status**: Done | Not Done (binary, usually reviewed at end of quarter)

### Issues (Blockers)

An **Issue** is a specific problem or blocker that, if resolved, unblocks progress on your Rocks.

**Characteristics:**
- **Narrow scope**: "Battery sourcing delays Q1 roadmap" (not "supply chain is broken")
- **Actionable**: Has a clear owner who can fix it
- **Urgent**: Blocks Rocks if unresolved

**Examples:**
```
Issue 1: Pricing not set (blocks launch)
Issue 2: Payment provider not integrated (blocks sales)
Issue 3: Customer support team not hired (blocks retention)
Issue 4: GitHub OAuth failing (blocks developer signup)
```

**Status**: Open | Resolved (binary)

### Scorecard (Leading Metrics)

The **Scorecard** tracks the metrics that predict your Rocks' success—measured nightly, not quarterly.

**Connection to Growth Loop:**
- Growth Loop closes experiments → extracts learnings → diagnoses constraint
- Constraint feeds into Scorecard metrics
- Scorecard shows progress toward the Rocks

**Example Scorecard** (updated nightly by the crew):
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Page views | 500/week | 320 | ↗ (up 20% vs last week) |
| Signup rate | 3% | 2.8% | → (stable) |
| Paying customers | 100 | 12 | ↗ (up 2 this week) |
| Revenue | $5K/mo | $480 | ↗ (up $120 vs last week) |
| NPS | 50+ | 45 | ↘ (one churn) |

**The insight**: If you're tracking `page views` and it's declining while target is 500/week, that's an Issue: _"Organic demand declining; need paid ads or new PR channel."_

---

## Part 2: Weekly Operating Rhythm

### Monday: Goal-Setting & Planning

**Who**: Founder + CEO agent
**What**: Set/refine Rocks for the week

1. **Review last quarter's Rocks**
   - Which hit? Which missed? Why?
   - Document learnings (feed into next quarter's planning)

2. **Set Rocks for this quarter** (if not done)
   - Usually 3-5 per quarter
   - Assign each to founder or to an agent
   - Set target metrics (e.g., "1000 signups by Q1 end")

3. **Identify blockers (Issues)**
   - What's blocking each Rock?
   - Create Issues with clear owners
   - Prioritize (which Issue, if resolved, unblocks the most?)

### Tuesday-Friday: Execution & Metric Updates

**Who**: Crew (all agents)
**What**: Execute work, update Scorecard nightly

**Each night's shift includes:**
1. Run experiments aimed at the binding constraint (from Growth Loop)
2. Log activities to Glass Box
3. Update Scorecard metrics (from tracking pixel, manual updates, or integrations)
4. Resolve Issues if their conditions are met

**Example:** Manufacturing ship proposal → Supply Chain sub-agent sources new battery supplier → Issue resolved: _"Battery sourcing delays Q1"_ → Scorecard updated

### Friday: Weekly Review

**Who**: Founder + CEO agent (ideally in a team call)
**What**: Assess progress, resolve blockers, plan next week

**The review covers:**
1. **Did we make progress on Rocks?**
   - Look at Scorecard metrics
   - Are we on track for quarterly target?

2. **Did we resolve Issues?**
   - Which Issues are still open?
   - Is there a new blocker?

3. **What's the constraint?**
   - Demand? Conversion? Monetization?
   - Does Scorecard reveal a new bottleneck?

4. **What's next week's focus?**
   - One constraint to address
   - One new experiment to run

---

## Part 3: Integration with Growth Loop

**The connection:**

```
Every Shift:
  1. Growth Loop runs → closes experiments, diagnoses constraint
  2. Constraint informs Crew's next proposal
  3. Crew executes → updates Scorecard
  4. Scorecard shows progress toward Rocks
  5. Founder (weekly) reviews Scorecard + Issues → plans next week
```

**Example flow:**

```
Night 1: Growth Loop diagnoses constraint = TRAFFIC (only 50 views)
         → CEO proposes: "One founder post in 3 communities"
         → Scorecard updated: views = 50

Night 2: Post goes live
         → Scorecard updated: views = 150

Night 3: Still low conversion (2% vs target 3%)
         → Growth Loop diagnoses constraint = CONVERSION
         → CEO proposes: "Narrow headline to ONE buyer"
         → Scorecard updated: views = 200, conversion = 2.2%

Friday:  Founder reviews Scorecard
         → "Views trending up, but conversion is the blocker"
         → Resolves Issue: "Positioning not clear" (fixed this week)
         → Creates new Issue: "Need customer development calls"
```

---

## Part 4: Schema & Storage

### Rock & Issue Storage

**Location:** Supabase tables (per-company, RLS-protected)

```sql
CREATE TABLE rocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- RLS: Users see only their own Rocks & Issues
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
```

### Scorecard (Client-Side + Cached)

The Scorecard is NOT persisted to Supabase yet (design TBD). Instead:
- **Client-side source of truth**: Stored in `useEngine` hook
- **Derived from**: Funnel data + nightly activities + user inputs
- **Updated nightly**: When Growth Loop runs

**In the future**, Scorecard could sync to Supabase for historical trending.

---

## Part 5: UI & Components

### Operate Tab

**Location:** `app/dashboard/page.tsx` → `tab === "operate"` → `<OperateTab />`

Shows:
1. **Rocks panel**: List of quarterly Rocks, status (done/not done)
   - Add/edit/delete Rocks
   - Mark done when hit
2. **Issues panel**: Open blockers
   - Add/resolve Issues
   - Link Issues to Rocks (which Rock does this unblock?)
3. **Scorecard**: Metrics updated nightly
   - Trend arrows (↗ ↘ →)
   - Target vs actual
   - Link to Growth Loop learnings

### Weekly Review Template

CEO agent can generate a weekly review summary:

```markdown
## Weekly Review — Week of June 10

### Rocks Progress
- Rock 1 (1000 signups): 240/1000 (24%) — on track (need 250/week)
- Rock 2 ($10K MRR): $480 — behind (need $2.5K/week)
- Rock 3 (Slack integration): Not started — **blocker: battery sourcing issue**

### Scorecard
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Views | 500/w | 320 | ↗ +60% |
| Conversion | 3% | 2.8% | → |
| Paying | 100 | 12 | ↗ +2 |
| Revenue | $5K/mo | $480 | ↗ |

### Constraint Diagnosis
**Binding constraint**: TRAFFIC (views trending up, but still 35% short)
**Recommendation**: Double down on community posts (highest ROI per $ spent)

### Open Issues
- [ ] Pricing not set (blocking pre-order capture) — Owner: CEO
- [ ] GitHub OAuth failing (5% signup drop) — Owner: Forge
- [x] Battery supplier found — RESOLVED

### Next Week's Focus
1. Test: 5 warm intros + 3 community posts (traffic push)
2. Issue: Resolve GitHub OAuth within 2 days
3. Experiment: Narrow headline to ONE buyer (conversion)
```

---

## Part 6: Best Practices

### Setting Rocks
- **3-5 per quarter** (not 10+) — focus over noise
- **One north star metric** (revenue, customers, or adoption)
- **80/20**: Which 2-3 Rocks, if hit, make the biggest impact?
- **Assign explicitly**: "Founder leads Rock 1. Forge leads Rock 3."

### Managing Issues
- **Create immediately** when you find a blocker (don't wait for weekly)
- **Assign owner** (CEO can't own all Issues — delegate)
- **Resolve aggressively** (every unresolved Issue delays progress)
- **Link to Rocks** ("This Issue blocks Rock 2; prioritize it")

### Reading the Scorecard
- **Trends matter more than absolute numbers**
  - Views down 50% → ALERT (constraint may have shifted)
  - Views up 50% → CONTINUE (keep feeding this channel)
- **Look for leading indicators** (views → signups → revenue)
- **Weekly review is not daily optimization** (don't tweak every day; let experiments run)

### Weekly Review Tempo
- **Same day, same time** (e.g., Friday at 5pm)
- **15 minutes**: Quick review of Scorecard + Issues
- **30 minutes** (monthly): Deeper dive on Rocks progress + quarterly planning

---

## Part 7: Examples

### Example 1: Startup's First Rocks (Q1)

```
Rock 1: Validate demand (200 paying signups by Q1 end)
  - Owner: CEO
  - Scorecard metric: "Paying customers"
  - Issue blocking it: "Pricing not set" → RESOLVED (week 2)

Rock 2: Ship v0.1 product (live on GitHub Pages by Q1 end)
  - Owner: Forge (Engineering)
  - Scorecard metric: "Build deployment success rate"
  - Issue blocking it: "GitHub OAuth not working" → RESOLVED (week 1)

Rock 3: Win first customer reference (1 public testimonial by Q1 end)
  - Owner: Pitch (Marketing)
  - Scorecard metric: "Customer satisfaction (NPS)"
  - Issue blocking it: "Customer support process not defined" → RESOLVED (week 3)
```

### Example 2: Scaling Phase (Q3)

```
Rock 1: Hit $100K MRR (vs current $25K)
  - Owner: CEO
  - Scorecard: "Revenue, payingCustomers, churn rate"
  - Issues: "Sales team not hired", "Support overwhelmed"

Rock 2: Launch on 3 new channels (community, API, partnerships)
  - Owner: Pitch (Marketing)
  - Scorecard: "New channel adoption rate"
  - Issues: "API docs not complete", "Partner contracts not signed"

Rock 3: Reduce churn from 8% to 5%
  - Owner: Guard (Support)
  - Scorecard: "Churn %, NPS, retention"
  - Issues: "Onboarding flow broken", "Documentation gaps"
```

---

## Part 8: Advanced Topics

### Rock Dependencies

If Rock A requires Rock B to be done first:
1. Set Rock B in Q(n-1)
2. Set Rock A in Q(n)
3. In Issues, note the dependency

Example:
```
Q2 Rock: "Hit $50K MRR"
Q1 Rock: "Ship v0.1 product" ← blocks Q2

Issue: "Q1 product delayed 2 weeks" → delay Q2 Rock start
```

### Cascading Scorecard Metrics

The crew updates Scorecard nightly; you refine it weekly:

```
Monday: CEO suggests Scorecard = [views, signup rate, revenue]
Tuesday-Friday: Crew updates daily
Friday: Founder reviews, adds custom metrics (e.g., "customer effort score")
Next week: Crew tracks both default + custom metrics
```

### Quarterly Sabbatical

Every Q4, pause new Rocks and focus on:
- Consolidating gains from Q1-Q3
- Fixing debt (tech debt, support backlog, churn)
- Planning next year (strategy + Rocks for Q1)

---

## Part 9: Code Reference

### Key Types

```typescript
interface Rock {
  id: string;
  title: string;
  done: boolean;
}

interface Issue {
  id: string;
  title: string;
  resolved: boolean;
}

interface OperateData {
  rocks: Rock[];
  issues: Issue[];
}

interface GrowthGoal {
  northStar: "revenue" | "paying_customers" | "signups";
  target: number;
  setAt: number;
}
```

### Key Functions (useEngine hook)

```typescript
// Create/update Rocks
upsertRock(rock: Rock): void
deleteRock(id: string): void

// Create/resolve Issues
upsertIssue(issue: Issue): void
resolveIssue(id: string): void

// Get Scorecard (derived from activities + funnel)
scorecard(): Scorecard
```

---

## Summary

**Operate = clarity + accountability:**

1. **Rocks** clarify what matters this quarter (3-5 big goals)
2. **Issues** surface blockers that need immediate attention
3. **Scorecard** tracks leading metrics nightly (views, signups, revenue)
4. **Weekly review** assesses progress + resolves Issues + plans next week
5. **Growth Loop** diagnoses constraints → Scorecard → feeds into Rocks planning

**The rhythm:** Monday (set Rocks) → Tue-Fri (execute + track) → Friday (review) → repeat

**Next:** See [FEATURES-COMPLETE.md](./FEATURES-COMPLETE.md) for the full architecture.
