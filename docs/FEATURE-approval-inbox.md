# Approval Inbox: Human-in-Loop Autonomous Actions

## Overview

The **Approval Inbox** is where consequential actions (spending money, deploying code, posting publicly, deleting things) wait for your approval before execution.

**The promise:** Autonomous crew runs efficiently on small tasks, but consequential work stops and asks for your sign-off before proceeding. You stay in control.

---

## Part 1: Approval Lifecycle (End-to-End)

### Step 1: Agent Proposes Action

During a nightly shift, an agent decides to propose a consequential action:

```typescript
// Example: CEO proposes $50K ad spend
const proposal = {
  agent: "growth",
  kind: "spend",
  title: "Run demand-capture ad campaign",
  detail: "Target: 1000 sign-ups. Budget: $50K across Meta + LinkedIn. Copy A/B tested on landing page variants.",
  amount: 50000
};
```

### Step 2: Policy Enforcement (BEFORE Approval Inbox)

The **policy engine** runs BEFORE any approval is queued. It asks: _"Should this action be approved immediately (AUTO), queued for human review (QUEUE), or blocked entirely (BLOCK)?"_

**Five deterministic gates:**
1. **Credential gate**: Does the action have required keys? (e.g., `RESEND_API_KEY` for email)
2. **Compliance gate**: Is the action forbidden by policy? (e.g., no social posts on holiday weekends)
3. **Spend cap gate**: Does the spend fit within daily/monthly limits?
4. **Observable gate**: Is there a way to verify this work actually happened?
5. **Reversible gate**: Can the action be undone if it fails?

**Verdict:** `AUTO` | `QUEUE` | `BLOCK`

```typescript
// Example: $50K spend
decide({ kind: "spend", amount: 50000, agent: "growth" })
// Returns:
// {
//   verdict: "QUEUE",  // Consequential → needs founder approval
//   reason: "Spend $50K > daily cap $10K; requires approval"
// }
```

**Default rules:**
- Spend > $1K → QUEUE
- Email outreach → QUEUE
- Social media posts → QUEUE (especially public announcements)
- Code deploy → QUEUE (safety-critical)
- Delete operation → BLOCK (never auto-execute)

### Step 3: Queued to Approval Inbox

If verdict is `QUEUE`, an `ApprovalItem` is created:

```typescript
interface ApprovalItem {
  id: string;           // UUID
  night: number;        // which shift
  agent: AgentRole;     // who proposed it
  kind: ApprovalKind;   // "spend" | "deploy" | "outreach" | "delete" | ...
  title: string;        // user-friendly title
  detail: string;       // context, hypothesis, numbers
  amount?: number;      // $amount for spend/outreach
  resolved?: "approved" | "rejected";
}
```

**Stored in:** Supabase `approvals` table (multi-tenant via `company_id` RLS)

### Step 4: Displayed in Inbox UI

**Location:** `components/dashboard/ApprovalCard.tsx` + `app/dashboard/page.tsx`

The UI shows:
- **Title**: "Run demand-capture ad campaign"
- **Detail**: The full context (numbers, copy, target)
- **Amount**: "$50,000"
- **Agent**: "Growth" (with icon)
- **Night**: "Shift 15"
- **Two buttons**: ✅ Approve | ❌ Reject

### Step 5: Founder Approves (In-App or Telegram)

**Option A: In-App (Approval Inbox)**
```
You click: ✅ Approve
Frontend: PATCH /api/execute { approvalId, decision: "approved" }
```

**Option B: Via Telegram**
```
Telegram notification arrives: "Approve spend: Run demand-capture ad campaign [$50K]"
You tap: ✅ Approve on your phone
Webhook: Records decision in approval_decisions table
```

### Step 6: Authorization Check (RLS)

When you approve, the server runs a **second policy check** before executing:

1. **Ownership verification:** Is this approval for YOUR company? (RLS enforces this)
2. **Policy re-validation:** Does the action still fit policy? (prevents drift)
3. **Amount verification:** Are you approving the exact amount proposed?

**Code:** `app/api/execute/route.ts` → check both `policy.decide()` and RLS

### Step 7: Execution

Once approved, the action executes:
- GitHub commit → build ships
- Email → sent via Resend
- Ad spend → recorded in metrics
- Social post → published

**Result:** Activity logged to Glass Box with proof

```typescript
{
  id: "activity-123",
  night: 15,
  agent: "growth",
  action: "Ran demand-capture campaign on Meta + LinkedIn",
  cost: 50000,
  status: "done",
  proof: { kind: "metric", value: "1050 signups attributed" }
}
```

### Step 8: Rejection Path

If you reject:
```
You click: ❌ Reject
Status updates: resolved = "rejected"
Action is NOT executed
Approval disappears from Inbox
Crew learns: this type of action was rejected (informs next shift)
```

---

## Part 2: What Gets Queued vs. Auto-Shipped

### Auto-Shipped (Verdict: AUTO)
- Internal logging activities (no side effects)
- Small tweaks (< $100 spend)
- Analysis & recommendations
- Testing framework updates

### Queued for Approval (Verdict: QUEUE)
- **Spend** > $1,000
- **Outreach**: Email campaigns, social posts, DMs, ads
- **Deploy**: Code to production
- **Delete**: Destructive operations (drop tables, delete users, etc.)

### Blocked (Verdict: BLOCK)
- Actions without required credentials
- Forbidden operations (e.g., spam, scraping)
- Spending beyond policy cap
- Unverifiable actions

**Example Matrix:**
| Action | Cost | Auto? | Reason |
|--------|------|-------|--------|
| Log activity | $0 | ✅ AUTO | No side effects |
| Update config | $0 | ✅ AUTO | Reversible |
| Small tweak | $50 | ✅ AUTO | Below threshold |
| Ad campaign | $5K | ❌ QUEUE | Spend > $1K |
| Email outreach | $200 | ❌ QUEUE | Public messaging |
| Deploy to prod | $0 | ❌ QUEUE | Safety-critical |
| Delete user | $0 | ❌ BLOCK | Unrecoverable |

---

## Part 3: Integration with Chat + ChatOps

When you ask the crew to do something consequential:

1. **Chat detects intent** (e.g., "run a $5K ad campaign")
2. **Crew proposes action** ("I'll draft the campaign...")
3. **Policy decides QUEUE** (spend > $1K)
4. **Approval Inbox shows it** ("Run demand-capture ad campaign [$5K]")
5. **Telegram notifies you** (if configured)
6. **You approve from phone or inbox**
7. **Action executes on next sync**

---

## Part 4: Policy Configuration

The policy engine is configured in `lib/engine/policy.ts`:

```typescript
const POLICY = {
  // Spend caps
  spendLimits: {
    perTransaction: 50000,   // Single action max: $50K
    perDay: 100000,          // Daily spend max: $100K
    perMonth: 500000,        // Monthly spend max: $500K
  },
  
  // Kill switch
  killSwitch: false,         // If true: block ALL spending
  
  // Forbidden actions
  forbidden: ["spam", "scrape", "impersonate"],
  
  // Per-agent + per-kind approval matrix
  approvals: {
    spend: "QUEUE",          // Always queue spend
    deploy: "QUEUE",         // Always queue deploys
    outreach: "QUEUE",       // Always queue outreach
    internal: "AUTO",        // Auto-approve internal logging
  }
};

// Decide verdict
const verdict = decide(proposal); // Returns: AUTO | QUEUE | BLOCK
```

**To modify policy:**
1. Edit `lib/engine/policy.ts`
2. Restart server
3. New approvals use updated policy

---

## Part 5: Database Schema

### approvals table (Supabase)

```sql
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  night INTEGER,
  agent TEXT,  -- AgentRole
  kind TEXT,   -- ApprovalKind: "spend" | "deploy" | "outreach" | "delete" | ...
  title TEXT,
  detail TEXT,
  amount INTEGER,  -- cents for spend/outreach
  resolved TEXT,   -- NULL (pending) | "approved" | "rejected"
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- RLS: Users can only see approvals for their own company
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see only their own approvals"
  ON approvals FOR SELECT
  USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));
```

### approval_decisions table (Supabase)

Records approval decisions from Telegram (service role only):

```sql
CREATE TABLE approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id),
  decision TEXT,  -- "approved" | "rejected"
  source TEXT,    -- "telegram" | "web"
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

## Part 6: Troubleshooting

### Action not queued when it should be
- Check policy in `lib/engine/policy.ts`
- Verify amount is > threshold
- Ensure agent is not in "AUTO" list
- Check credentials are set (credential gate might BLOCK instead)

### Approval appears but can't approve
- Verify you're signed in (RLS requires auth)
- Check Supabase connection in Settings
- Ensure company is yours (RLS check)

### Approval executed without approval
- Check if action amount was below threshold
- Verify it's not in AUTO-approved list
- Search `approval` table for that night; confirm verdict

### Telegram notifications not triggering
- Check `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`
- Verify user's chat ID in Settings
- See [FEATURE-chat-chatops.md](./FEATURE-chat-chatops.md#enabling-telegram)

---

## Part 7: Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `lib/engine/policy.ts` | Policy engine (decide() function) |
| `lib/engine/execution.ts` | Approval verification before execution |
| `app/api/execute/route.ts` | Approval routing + RLS enforcement |
| `components/dashboard/ApprovalCard.tsx` | Inbox UI component |
| `app/dashboard/page.tsx` | Dashboard (shows Inbox) |
| `app/api/telegram/webhook/route.ts` | Telegram button taps |

### Key Functions

```typescript
// Policy engine
decide(proposal: Proposal): Verdict // AUTO | QUEUE | BLOCK

// Approval creation
insertApproval(company, proposal) // Insert into Supabase

// Execution verification
requireApprovalWithin(approvalId) // Check it exists + is approved

// Chat intent → approval conversion
detectChatApproval(message) // Returns ChatApproval
```

### Types

```typescript
interface ApprovalItem {
  id: string;
  night: number;
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
  resolved?: "approved" | "rejected";
}

type Verdict = "AUTO" | "QUEUE" | "BLOCK";

interface Proposal {
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
}
```

---

## Summary

**Approval Inbox = trust + transparency:**

1. **Consequential actions wait for approval** before execution (no surprises)
2. **Policy engine enforces rules** (spend caps, forbidden actions, reversibility)
3. **Two approval paths**: in-app Inbox or Telegram (approve from anywhere)
4. **RLS prevents leaking** approvals across users
5. **Full traceability**: every approval decision logged

**Next:** See [FEATURE-operate-layer.md](./FEATURE-operate-layer.md) for how approvals connect to quarterly planning.
