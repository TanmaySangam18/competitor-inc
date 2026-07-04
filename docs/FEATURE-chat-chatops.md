# Chat + ChatOps: Conversational Crew Management

## Overview

**Chat** is a conversational interface that lets you ask the crew questions in natural language. **ChatOps** routes consequential actions (spend, deploy, outreach) through Telegram for approval, so you can manage approvals from your phone.

Together, they create a human-in-loop automation system: you converse with the crew, they propose actions, and you approve from anywhere via Telegram.

---

## Part 1: Chat Interface

### How Chat Works

**Flow:**
1. You ask a question: _"Should we run paid ads?"_
2. Message goes to `/api/engine` with `kind: "chat"`
3. Server calls the model (CEO agent by default) to formulate a contextual reply
4. Response streams back to UI and renders in real-time

**Code Path:**
- **UI**: `components/dashboard/ChatTab.tsx` — renders message input, sends to `/api/engine`
- **API**: `app/api/engine/route.ts` — routes `kind: "chat"` to `streamChatReply()`
- **Engine**: `lib/engine/server.ts` → `runChat()` calls the model with `chatSystem()` prompt
- **Model prompt**: Includes company idea + founder question → CEO agent replies in-character

### Fallback Behavior

If no model is configured (no API key), the chat uses `simulatedReply()` — a deterministic keyword-based system that responds based on the question topic:

- **"hello"** → "Hey! I'm running {company} with you. What should we tackle tonight?"
- **"valid/demand/market fit"** → "Before building more, I'd re-check demand..."
- **"cost/spend/budget"** → "Every action is in the Glass Box with its cost..."
- **"deploy/build/ship"** → "I can ship that. Deploys route through your Approval Inbox first..."
- **"market/ads/launch/outreach"** → "I'll draft the campaign and launch post..."
- **Default** → "Got it. For '{idea}' I'd line up the next highest-signal task..."

This means chat works **offline** and provides a consistent UX even without API keys.

### Real-Time Token Streaming

When a model is available, chat uses **true token streaming** (not simulated):

- `streamChatReply()` opens a streaming connection
- Tokens arrive incrementally and render in real-time
- If the stream fails or returns empty, gracefully falls back to `simulatedReply()`

This creates a **feel of live conversation** with minimal latency.

---

## Part 2: ChatOps — Telegram Approval Routing

### What Is ChatOps?

ChatOps extends chat by routing **consequential actions** (ones that need approval) to Telegram, so you can approve from your phone.

**The promise:** You ask the crew to "run a $5K ad campaign," they draft it, queue it for approval in your Inbox, *and* notify you on Telegram with Approve/Reject buttons.

**Flow:**
1. You ask: _"Run a $5K ad campaign"_
2. Chat detects intent: this is a `spend` + `outreach` action
3. Crew replies: _"I'll draft the campaign. That's consequential — I'll queue it in your Approval Inbox for your yes."_
4. Telegram notification arrives with Approve/Reject buttons
5. You tap Approve from your phone
6. Action executes on next sync

### Enabling Telegram

**Prerequisites:**
1. Create a Telegram bot via @BotFather (get `TELEGRAM_BOT_TOKEN`)
2. Generate a webhook secret (e.g., `openssl rand -hex 32`)
3. Set env vars:
   - `TELEGRAM_BOT_TOKEN` — from BotFather
   - `TELEGRAM_WEBHOOK_SECRET` — your secret
   - `TELEGRAM_CHAT_ID` — (optional) default destination; users can override in Settings

**One-time webhook setup:**
```bash
# Set webhook so Telegram calls your /api/telegram/webhook endpoint
curl -X POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.vercel.app/api/telegram/webhook",
    "secret_token": "{TELEGRAM_WEBHOOK_SECRET}"
  }'
```

**User opt-in:**
- User opens app → Settings → "Get build updates" → pastes Telegram chat ID
- Or in Telegram: send `/start` to bot, bot replies with their chat ID

### Intent Detection

The function `detectChatApproval()` uses keyword matching to detect consequential actions:

| Intent | Keywords | Approval Kind | Details |
|--------|----------|---------------|---------|
| **Spend** | spend, buy, pay, $500 | `spend` | Triggers on verb or dollar amount |
| **Deploy** | deploy, ship, release, go live, push to prod | `deploy` | Code/product shipping |
| **Outreach** | email, post, tweet, campaign, launch, ads | `outreach` | Public messaging, marketing spend |
| **Delete** | delete, remove, shut down, cancel | `delete` | Destructive operations |

**Example:**
```typescript
detectChatApproval("run a $5000 ad campaign")
// Returns:
// {
//   agent: "growth",
//   kind: "outreach",
//   title: "Approve outreach",
//   detail: "You asked: \"run a $5000 ad campaign\"",
//   amount: 5000
// }
```

### Approval Flow (End-to-End)

**Step 1: Chat detects intent**
```
User: "Run a $5K ad campaign"
detectChatApproval() → { kind: "outreach", amount: 5000 }
```

**Step 2: Crew replies + queues approval**
```
Chat reply: "I'll draft the campaign. That's consequential — I'll queue 'Approve outreach' in your Approval Inbox for your yes."
Supabase: INSERT into approvals { title, amount, status: "pending" }
```

**Step 3: Telegram notification**
```
Your phone ← "Approve outreach: Run a $5K ad campaign"
         [✅ Approve] [❌ Reject]
```

**Step 4: Founder approves from phone**
```
You tap: ✅ Approve
Telegram: Sends callback_query to /api/telegram/webhook
Webhook: Records decision in approval_decisions table
Message updates: "✅ Approved by you. Your workspace will apply it on next sync."
```

**Step 5: Workspace syncs**
```
Next page load or /api/sync:
  - Reads approval_decisions
  - If approved: executes the action (spend, deploy, etc.)
  - Adds to Activity log
  - Updates Glass Box
```

### The Webhook Handler

**Location:** `app/api/telegram/webhook/route.ts`

**Two message types handled:**

1. **Free-text messages** (user asks question)
   - Verify webhook secret (constant-time comparison)
   - Call `runChat()` to generate reply
   - Detect intent with `detectChatApproval()`
   - Send reply + approval notification to Telegram

2. **Button taps** (user approves/rejects)
   - Parse the callback data to extract approval ID + decision
   - Record in `approval_decisions` table via service client
   - Acknowledge the tap + update message to show decision

**Security:**
- Webhook secret verified via constant-time comparison (prevents replay)
- Service client used (Supabase service role) — only records decisions, no state mutation
- Fail-soft: returns 200 even on errors (prevents Telegram retry storms)
- No sensitive data logged

---

## Part 3: Integration with Approval Inbox

ChatOps + Approval Inbox are **two sides of the same coin:**

- **Approval Inbox** (in-app) → see all pending actions, approve/reject
- **ChatOps (Telegram)** → push notifications + quick approve/reject from phone

**When an action is queued:**
1. Appears in Approval Inbox (UI: `components/dashboard/ApprovalCard.tsx`)
2. Telegram notification sent (if chat ID configured)
3. You can approve from either place; decision syncs to both

---

## Part 4: Example Conversations

### Example 1: Ask about validation

```
You:   "Should we keep running the landing page test?"
Crew:  "Let's look at the numbers. You've got 150 views, 3 signups — 
        that's a 2% conversion rate. Compare to your target of 3%.
        One more week and we'll have a clearer signal. Keep it running."
```

### Example 2: Propose a campaign (triggers ChatOps)

```
You:   "Let's run a tweet campaign about our launch"
Crew:  "I'll draft launch tweets and a pinned post. That's consequential
        — I'll queue 'Approve outreach' in your Approval Inbox for your yes.
        
        🔔 You'll get a Telegram notification to approve from your phone."

[Telegram notification arrives 2 seconds later]
You:   [taps ✅ Approve on phone]
Crew:  [tweets post, logs to Glass Box]
```

### Example 3: Question about spending

```
You:   "How much have we spent so far?"
Crew:  "So far this shift: $12,500. Breakdown:
        - Ad spend: $8K
        - Content: $2.5K
        - Tools: $2K
        
        Your monthly cap is $25K, so you have $12.5K left."
```

### Example 4: Strategic question

```
You:   "What's blocking growth right now?"
Crew:  "Traffic is the bottleneck. You've got 150 views/week but you need
        500+ to test conversion meaningfully. My rec:
        
        1. Get 5 warm intros from your network (free)
        2. Post to 1-2 niche communities where your ICP hangs out
        3. If those hit, we scale with $2-3K in ad spend
        
        This beats big ad spend while you're still validating."
```

---

## Part 5: Troubleshooting

### Chat not streaming / using simulated replies
- Check `ANTHROPIC_API_KEY` env var
- Verify model is set: `MODEL_ID` or defaults to `claude-opus-4-8`
- Check API calls aren't rate-limited

### Telegram notifications not arriving
- Verify `TELEGRAM_BOT_TOKEN` is set
- Confirm user's `TELEGRAM_CHAT_ID` in Settings
- Check webhook is registered: `curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo`
- Check webhook secret matches env `TELEGRAM_WEBHOOK_SECRET`

### Approvals not syncing after Telegram tap
- Check `approval_decisions` table in Supabase
- Verify service role key is set: `SUPABASE_SERVICE_KEY`
- Check app is calling `/api/sync` or reloading page

### Intent detection wrong
- `detectChatApproval()` uses keyword matching (not ML)
- Edit `lib/engine/server.ts` → `detectChatApproval()` to adjust patterns
- Conservative approach: fewer false positives than false negatives

---

## Part 6: Code Reference

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `runChat()` | `lib/engine/server.ts` | Generate chat reply (model or simulated) |
| `streamChatReply()` | `lib/engine/server.ts` | Stream tokens in real-time |
| `detectChatApproval()` | `lib/engine/server.ts` | Detect consequential intent |
| `ChatTab` | `components/dashboard/ChatTab.tsx` | Chat UI component |
| `POST /api/engine` | `app/api/engine/route.ts` | Handles `kind: "chat"` requests |
| `POST /api/telegram/webhook` | `app/api/telegram/webhook/route.ts` | Telegram integration |

### Types

```typescript
// Chat request
{ kind: "chat", company: { name, idea }, message, soul?, byok? }

// Chat approval detection
interface ChatApproval {
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
}
```

---

## Summary

Chat + ChatOps = **conversational crew management from anywhere**:

- **Chat**: Ask questions, get crew replies streamed in real-time
- **ChatOps**: Approve consequential actions from Telegram (with fallback to in-app Inbox)
- **Fallbacks**: Works offline with simulated replies; degrades gracefully if model unavailable
- **Safety**: All actions gated by policy + require approval before execution

**Next**: See [FEATURE-approval-inbox.md](./FEATURE-approval-inbox.md) to understand the full approval lifecycle.
