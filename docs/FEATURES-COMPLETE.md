# Complete Feature Architecture: competitor.inc v0.4

> **Honesty note (2026-07-03):** dollar figures in crew examples below ($500K/mo caps etc.) are
> *illustrative org-modeling numbers* from the benchmark data — they are **not** the product's real
> spend policy. The real policy lives in `lib/engine/policy.ts` (hard per-transaction/daily caps,
> kill switch); the UI shows crew budget *shares*, never these fictional dollar amounts.

## Overview

competitor.inc is a **proof-first AI co-founder platform** that validates startup ideas through real demand testing before building. It uses:

1. **Dynamic Crew Generation** (Levels.fyi-powered org structures)
2. **Sub-Agent Orchestration** (Paperclip-style hierarchical execution)
3. **Chat + ChatOps** (conversational crew management + Telegram approvals)
4. **Approval Inbox** (human-in-loop action gating)
5. **Operate Layer** (EOS-inspired quarterly planning)
6. **Growth Loop** (deterministic revenue validation)

---

## Architecture Layers

### Layer 1: Dynamic Crew (lib/engine/dynamic-crew.ts)

**What it does:**
- User submits idea (e.g., "EV with software-first")
- System maps idea to benchmark company (Tesla, Notion, Slack, Zapier, etc.)
- Scrapes job descriptions from Levels.fyi
- Generates custom agent crew with profiles, responsibilities, spend caps

**Key files:**
- `lib/engine/dynamic-crew.ts` — crew generation
- `lib/engine/job-parser.ts` — job description parsing
- `docs/examples/tesla-crew.json` — example output

**Output:**
```json
{
  "idea": "EV with software-first architecture",
  "benchmarkCompany": "tesla",
  "agents": [
    {
      "name": "Elon (CEO)",
      "role": "ceo",
      "responsibilities": [...],
      "spendCap": 500000,
      "subAgents": []
    },
    {
      "name": "Manufacturing Lead",
      "role": "manufacturing",
      "spendCap": 200000,
      "subAgents": [
        { "name": "Supply Chain Agent", "spendCap": 120000 },
        { "name": "Quality Agent", "spendCap": 80000 }
      ]
    },
    ...
  ]
}
```

---

### Layer 2: Sub-Agent Orchestration (lib/engine/sub-agent-executor.ts)

**What it does:**
- Parent agent (Manufacturing) is assigned complex work
- System spawns child sub-agents (Supply Chain, QA) with allocated budgets
- Sub-agents execute in parallel, respecting blocking dependencies
- All activities logged hierarchically to Glass Box

**Key files:**
- `lib/engine/sub-agent-executor.ts` — spawning + execution
- `lib/engine/types.ts` — SubAgent + Activity types
- `lib/engine/manufacturing-orchestration.test.ts` — integration tests

**Flow:**
```
Manufacturing assigned: "Reduce cost per unit by 15%" ($200K)
  ↓
Spawn sub-agents:
  - Supply Chain ($120K): negotiate suppliers
  - Quality ($80K): design test automation
  ↓
Execute sequentially (Quality waits for Supply Chain):
  - Supply Chain runs → logs activity → updates spend
  - Quality waits on Supply Chain completion
  - Quality runs → logs activity → updates spend
  ↓
Glass Box shows hierarchy:
  Parent: "Reduce cost per unit"
    ├─ Sub-activity: "Supply Chain negotiation" ($50K spent)
    └─ Sub-activity: "QA framework" ($30K spent)
```

---

### Layer 3: Chat + ChatOps (lib/engine/server.ts + app/api/telegram/webhook/route.ts)

**What it does:**
- Conversational interface: ask crew questions in natural language
- Real-time token streaming or simulated replies (works offline)
- Intent detection: consequential actions (spend, deploy, outreach) queued for approval
- Telegram integration: approve from phone via buttons

**Key files:**
- `lib/engine/server.ts` — `runChat()`, `streamChatReply()`, `detectChatApproval()`
- `app/api/engine/route.ts` — `/api/engine { kind: "chat" }`
- `app/api/telegram/webhook/route.ts` — Telegram integration
- `components/dashboard/ChatTab.tsx` — Chat UI
- `docs/FEATURE-chat-chatops.md` — complete documentation

**Example:**
```
You:    "Run a $5K ad campaign"
Crew:   "I'll draft the campaign. That's consequential — 
         I'll queue it in your Approval Inbox for your yes."
Telegram: [Approve] [Reject] buttons arrive

You tap: [Approve] from phone
Result: Approval recorded, action queues for execution
```

---

### Layer 4: Approval Inbox (app/api/execute/route.ts + lib/engine/policy.ts)

**What it does:**
- Policy engine decides: AUTO (ship immediately) | QUEUE (ask founder) | BLOCK (forbidden)
- Queued actions appear in Approval Inbox UI
- Founder approves/rejects with full context
- RLS ensures only owner can approve their approvals
- Second policy check before execution

**Key files:**
- `lib/engine/policy.ts` — 5-gate decision engine
- `app/api/execute/route.ts` — authorization + execution
- `components/dashboard/ApprovalCard.tsx` — Inbox UI
- `docs/FEATURE-approval-inbox.md` — complete documentation

**Five gates:**
1. Credential gate — has required keys?
2. Compliance gate — forbidden action?
3. Spend cap gate — within budget?
4. Observable gate — can we verify it happened?
5. Reversible gate — can it be undone?

**Default policy:**
- Spend > $1K → QUEUE
- Social media posts → QUEUE
- Code deploy → QUEUE
- Email outreach → QUEUE
- Delete operations → BLOCK

---

### Layer 5: Operate Layer (lib/engine/types.ts + app/dashboard/page.tsx)

**What it does:**
- Rocks: quarterly goals (3-5 per quarter)
- Issues: blockers that, if resolved, unblock Rocks
- Scorecard: leading metrics (views, signups, revenue) updated nightly
- Weekly review: assess progress, resolve Issues, plan next week

**Key files:**
- `lib/engine/types.ts` — Rock, Issue, OperateData
- `app/dashboard/page.tsx` — Operate tab UI
- `docs/FEATURE-operate-layer.md` — complete documentation

**Integration with Growth Loop:**
```
Every shift:
  1. Growth Loop diagnoses constraint (traffic/conversion/monetization)
  2. Constraint informs crew's proposal
  3. Crew executes → updates Scorecard metrics
  4. Scorecard shows progress toward Rocks
  5. Founder (weekly) reviews → identifies new Issues → plans next week
```

---

### Layer 6: Growth Loop (lib/engine/growth.ts)

**What it does:**
- Closes due experiments (measured verdict: won/lost/inconclusive)
- Diagnoses binding constraint (traffic, conversion, monetization)
- Proposes next experiments aimed at constraint
- Never invents data (honesty invariant)

**Key files:**
- `lib/engine/growth.ts` — experiment lifecycle
- `lib/engine/gtm.ts` — constraint diagnosis
- `docs/PLAYBOOK-conversion-gating.md` — framework reference

**The honesty invariant:**
```
Experiment closes with:
  - WON (metric ≥ target, basis = "real")
  - LOST (metric ≤ baseline, basis = "real")
  - INCONCLUSIVE (moved but missed, or estimate/missing data)
  
NEVER closes as success without data.
NEVER invents a number.
```

---

## End-to-End Example: Tesla Crew

### Setup
User submits idea: **"EV with software-first architecture"**

### System generates crew (5 agents, 7 sub-agents):
```
CEO ($500K/mo)
  - Strategy, resource allocation, constraint diagnosis

Manufacturing ($200K/mo)
  ├─ Supply Chain Agent ($120K): sourcing, supplier relationships
  └─ Quality Agent ($80K): QA, test automation

Engineering ($300K/mo)
  ├─ Firmware Engineer ($150K): motor control, embedded systems
  ├─ ML/AI Engineer ($105K): neural networks, inference
  └─ Infrastructure Engineer ($45K): cloud, CI/CD

Growth ($100K/mo)
  ├─ Demand Generation Agent ($50K): ads, conversion
  └─ Content Agent ($50K): blog, social, brand

Support ($50K/mo)
```

### Night 1: CEO shift
- **Diagnoses**: Traffic is bottleneck (50 views/week, need 500)
- **Proposes**: Founder story posts in 3 communities + email outreach
- **Constraint**: Traffic needs demand, not conversion fixes

### Night 2-4: Growth campaign
- **Demand Gen** runs Facebook pixel setup ($500, auto-shipped)
- **Content** drafts 5 launch posts
- **CEO** approves launch post (spend = $5K, QUEUE)
- **Founder** approves from phone
- **Growth** publishes → Scorecard updated: 150 views

### Night 5: Manufacturing proposes work
- **CEO diagnoses**: Traffic improved (150 → 200 views), now test conversion
- **Manufacturing** proposes: cost reduction research ($100K)
- **Policy decides**: QUEUE (spend > $1K)
- **Approval Inbox** shows: "Manufacturing spend: Supplier negotiation + QA framework [$100K]"
- **Founder** approves
- **Manufacturing spawns sub-agents**:
  - Supply Chain Agent: negotiate battery supplier ($60K budget)
  - Quality Agent: design test automation ($40K budget)
- **Both sub-agents execute in parallel** (Quality waits for Supply Chain)
- **Glass Box logs hierarchy**:
  ```
  Activity: "Reduce cost per unit by 15%"
    ├─ Sub-activity: "Supply Chain: Negotiate new battery supplier" ($50K spent)
    └─ Sub-activity: "Quality: Design test automation framework" ($30K spent)
  ```

### Night 6: Growth diagnoses binding constraint
- **Scorecard metrics**:
  - Views: 200 (up from 50, on track ✓)
  - Conversion rate: 2.5% (target 3%, still low ✗)
- **Growth Loop decides**: Constraint shifted to CONVERSION
- **CEO proposes**: Narrow landing page headline to ONE buyer job
- **Growth drafts** copy variants → Approval Inbox (outreach, QUEUE)
- **Founder approves from Telegram**
- **Growth publishes** → Scorecard updated

### Friday: Weekly Review
- **Rocks progress**:
  - Rock 1 (1000 signups): 100/1000 (on track, need 250/week)
  - Rock 2 ($10K MRR): $200 (behind, need $2.5K/week)
- **Scorecard**:
  - Views: ↗ (200 vs target 500/week)
  - Conversion: → (2.5% vs target 3%)
  - Revenue: ↗ ($200 attributed, new)
- **Issues resolved**:
  - ✓ Battery sourcing (Manufacturing completed)
  - ✓ Positioning clarity (Growth tested)
- **New Issues**:
  - [ ] Customer support process undefined (blocks growth)
  - [ ] Pricing not set (blocks monetization)
- **Next week focus**:
  - Resolve: "Pricing not set" (enable pre-order capture)
  - Propose: Founding member pre-order offer ($249)

---

## Integration Test Checklist

✅ Dynamic crew generation from idea
✅ Job description parsing (Levels.fyi → responsibilities, metrics)
✅ Sub-agent spawning (parent spend cap → children allocations)
✅ Sequential execution (respecting blocking dependencies)
✅ Policy enforcement (5 gates, verdict: AUTO | QUEUE | BLOCK)
✅ Approval Inbox queuing
✅ RLS + authorization checks
✅ Chat intent detection
✅ Telegram approval routing
✅ Growth Loop constraint diagnosis
✅ Glass Box hierarchical logging
✅ Scorecard metric updates
✅ E2E scenario: idea → crew → shift → approvals → execution

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Node.js, Supabase (PostgreSQL + Auth + RLS)
- **LLM**: Claude (Opus 4.8 / Sonnet 5 / Haiku 4.5)
- **Real integrations**: GitHub, Resend, Polar, Vercel, Telegram
- **Testing**: Vitest + property tests (fast-check)

---

## Documentation Map

| Document | Topic |
|----------|-------|
| [FEATURE-chat-chatops.md](./FEATURE-chat-chatops.md) | Chat UI + Telegram ChatOps |
| [FEATURE-approval-inbox.md](./FEATURE-approval-inbox.md) | Policy enforcement + Approval Inbox |
| [FEATURE-operate-layer.md](./FEATURE-operate-layer.md) | Rocks, Issues, Scorecard, weekly review |
| [PLAYBOOK-conversion-gating.md](../PLAYBOOK-conversion-gating.md) | Value-before-capture framework |
| [CASE-STUDY-TESLA-CREW.md](./CASE-STUDY-TESLA-CREW.md) | Full example walkthrough |

---

## Next Steps

**v0.5 Roadmap:**
1. Office vs House two-layer agent architecture
2. Per-agent model routing (Opus/Sonnet/Haiku)
3. ChatOps for Slack (in addition to Telegram)
4. Sub-agent governance (prevent agent jailbreaks)
5. Persistent Scorecard history (trending over time)
6. Automated weekly review (founder digest)
7. Partner integration (integrate founders' own agents)

---

**Status**: ✅ v0.4 Feature-complete (all layers wired, tested, documented)

**Deployment**: `competitor-inc-zeta.vercel.app` (founder's live link)

**Authors**: Sangam + Claude Code + team

---

For detailed deep-dives, see individual FEATURE docs linked above.
