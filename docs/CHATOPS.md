# ChatOps — approve from your phone (Telegram interactive approvals)

The Approval Inbox, on your phone. When the crew queues a consequential move (spend, outreach, deploy,
delete), it lands in Telegram with **✅ Approve / ✋ Reject** buttons. Tap one and the decision is recorded;
your workspace applies it on next sync — effects run exactly once, through the same `resolveApproval` path
the in-app inbox uses (no double-charging, no drift).

Decision rationale (why Telegram, not Slack/Discord) lives in the founder memory + the chat log: the niche is
solo first-time founders, and Telegram gives one-tap mobile approvals with zero workspace setup. Everything is
provider-agnostic (`lib/engine/notify.ts`), so Slack/WhatsApp/iMessage can slot in later for teams.

## How the loop works

1. **Send** — when an approval is created, the client calls `POST /api/notify` with `{ chatId, approval }`.
   `sendTelegramApproval` posts a message with inline Approve/Reject buttons (`callback_data = ap:<id>:y|n`).
2. **Tap** — Telegram calls `POST /api/telegram/webhook`. It verifies the `X-Telegram-Bot-Api-Secret-Token`
   header (constant-time) against `TELEGRAM_WEBHOOK_SECRET`, records the call in `approval_decisions`
   (service role — deliberately NOT `approvals.resolved`, so it doesn't clobber the app's pending state),
   acks the tap, and rewrites the message.
3. **Apply** — the app polls `GET /api/telegram/decisions?ids=…` for its pending approvals and applies each
   via `resolveApproval` (idempotent). The normal sync then writes `resolved` + the ledger/activity back.

Everything is **gated + fail-soft**: with no bot token / webhook secret / Supabase, all of it is inert.

## One-time setup (Block 0)

1. **Create the bot** — message `@BotFather` → `/newbot` → copy the token → set `TELEGRAM_BOT_TOKEN`.
2. **Pick a webhook secret** — any long random string → set `TELEGRAM_WEBHOOK_SECRET`.
3. **Run the migrations** incl. `supabase/migrations/0007_approval_decisions.sql` (needs Supabase + the
   service role key for the webhook to record decisions).
4. **Register the webhook** with Telegram (one curl):

   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://<your-domain>/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```

5. **Opt in** — message your bot once (so it can DM you), then paste the chat id into
   Settings → Integrations → *Get build updates*. (Telegram bots can't DM someone who hasn't messaged them
   first — that's why it's opt-in, and why we never auto-pull a handle from your sign-in.)

## Typed replies (not just buttons)

You can also just **type** to the bot — a suggestion or a question, not only Approve/Reject:
- The crew reads it and replies in-character (`runChat`, gated → simulated when no model is set).
- If your message implies a consequential move (spend, post, deploy), the reply flags it: *"I'll queue that
  in your Approval Inbox for your yes"* — it never claims it shipped.
- **`/start`** (or `/id`) makes the bot reply with your **chat id**, so opt-in is one step: message the bot →
  copy the id → paste it in Settings.

Context today defaults to **competitor.inc** (the House / customer-zero), which is right for the founder
directing their own crew. Routing a *customer's* typed reply to *their* company needs a `chat_id → company`
mapping — that's the next step (it also unlocks "approve the action I just suggested, from this same chat").

## Honest limits (today)

- Works for **signed-in users with Supabase on** (the House/Operators) — the round-trip needs a server
  store. The offline/localStorage demo can send a ping but can't reconcile a remote tap.
- The reconcile is a light poll (every ~8s) while approvals are pending — not a push. Good enough for the
  human-in-the-loop cadence; can move to webhooks/realtime later.
