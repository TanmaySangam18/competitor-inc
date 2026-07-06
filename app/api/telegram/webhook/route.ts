import crypto from "node:crypto";
import { serviceClient } from "@/lib/engine/service";
import { parseApprovalCallback, telegramAck, telegramEditText, notifyCustomer } from "@/lib/engine/notify";
import { runChat, detectChatApproval } from "@/lib/engine/server";
import { recordChatOps } from "@/lib/engine/chatops";

export const runtime = "nodejs";

// Telegram → here, when the founder taps Approve/Reject on an approval message. GATED + fail-soft:
//  - verifies the X-Telegram-Bot-Api-Secret-Token header (set at setWebhook time) — constant-time;
//  - records the decision in approval_decisions (service role) WITHOUT touching the app's pending state;
//  - acks the tap + rewrites the message so the chat shows the call.
// Always returns 200 (even on noise) so Telegram doesn't retry-storm. Inert until the bot token, the
// webhook secret, and Supabase are all set. See docs/CHATOPS.md for the one-time setWebhook step.

function secretOk(req: Request): boolean {
  const want = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!want) return false; // fail-closed: no secret configured ⇒ ignore everything
  const got = Buffer.from(req.headers.get("x-telegram-bot-api-secret-token") || "", "utf8");
  const exp = Buffer.from(want, "utf8");
  return got.length === exp.length && crypto.timingSafeEqual(got, exp);
}

export async function POST(req: Request) {
  if (!secretOk(req)) return Response.json({ ok: true }); // ignore unverified callers, quietly (200, no retry-storm)

  let update: Record<string, unknown> = {};
  try { update = (await req.json()) as Record<string, unknown>; } catch { return Response.json({ ok: true }); }

  // (A) Free-text message — a suggestion or question. The crew reads it and replies in-character; a
  // /start (or /id) hands the chat id back so the user can opt in from Settings. Company context defaults
  // to competitor.inc (the House / customer-zero); per-customer company mapping (chat_id → company) is the
  // documented next step. runChat is gated — it returns a simulated reply when no model is configured.
  const msg = update.message as { text?: string; chat?: { id: number } } | undefined;
  if (msg?.text && msg.chat?.id != null) {
    const text = msg.text.trim();
    const chatId = String(msg.chat.id);
    if (/^\/(start|id)\b/i.test(text)) {
      await notifyCustomer({ telegramChatId: chatId }, `👋 You're connected. Your chat id is ${chatId} — paste it into competitor.inc → Settings → "Get build updates" to receive approvals + updates here.`);
      return Response.json({ ok: true });
    }
    if (!text.startsWith("/")) {
      try {
        const company = { name: "competitor.inc", idea: "the proof-first AI co-founder that validates demand before building" };
        const soul = "You are the crew at competitor.inc, replying to the founder on Telegram. Be concise and in-character. If the suggestion implies a consequential move (spending, posting, deploying), say you'll DRAFT it and queue it for approval — never claim you already shipped it.";
        const reply = await runChat(company, text, soul);
        const appr = detectChatApproval(text);
        const note = appr ? `\n\n🔔 That's consequential — I'll queue “${appr.title}” in your Approval Inbox for your yes.` : "";
        await notifyCustomer({ telegramChatId: chatId }, `${reply}${note}`);
        // Reflect the exchange in the web CrewBox (fail-soft).
        const sbT = serviceClient();
        if (sbT) { await recordChatOps(sbT, { source: "telegram", direction: "in", text }); await recordChatOps(sbT, { source: "telegram", direction: "out", text: reply, agent: "ceo" }); }
      } catch { /* fail-soft */ }
    }
    return Response.json({ ok: true });
  }

  // (B) Button tap on an approval message.
  const cq = update.callback_query as
    | { id: string; data?: string; message?: { message_id: number; chat?: { id: number } } }
    | undefined;
  if (!cq?.data) return Response.json({ ok: true }); // neither a known message nor a button tap

  const parsed = parseApprovalCallback(cq.data);
  if (!parsed) { await telegramAck(cq.id, "Unrecognized."); return Response.json({ ok: true }); }

  const sb = serviceClient();
  if (sb) {
    try {
      await sb.from("approval_decisions").upsert(
        { approval_id: parsed.id, decision: parsed.approve ? "approved" : "rejected", source: "telegram" },
        { onConflict: "approval_id" },
      );
    } catch (e) {
      console.error("[/api/telegram/webhook] record failed:", e instanceof Error ? e.message : "unknown");
    }
  }

  const verdict = parsed.approve ? "✅ Approved" : "✋ Rejected";
  await telegramAck(cq.id, `${verdict} — recorded.`);
  const chatId = cq.message?.chat?.id;
  const msgId = cq.message?.message_id;
  if (chatId != null && msgId != null) {
    await telegramEditText(chatId, msgId, `${verdict} by you. Your workspace will apply it on next sync.`);
  }
  return Response.json({ ok: true });
}
