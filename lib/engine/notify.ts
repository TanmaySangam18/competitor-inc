// Customer-update notifications — provider-agnostic so the channel can change without touching callers.
// Today: Telegram (free bot API). Tomorrow: Linqapp (native iMessage, paid), SMS, or email all implement
// the same shape. GATED + fail-soft: with no provider env set, every send is a no-op { disabled:true }.
//
// HONEST LIMITATION (by design, not a bug): you cannot DM a stranger out of nowhere. A Telegram bot can
// only message a user who has messaged the bot first (we keep that chat_id); SMS/iMessage need a number
// the user gives us. So the customer OPTS IN with a handle/number — we never auto-pull it from their
// Google sign-in. This module is the seam where Linqapp/SMS drop in later without changing callers.

export interface NotifyTarget {
  telegramChatId?: string;
  phone?: string; // SMS / iMessage (Linqapp) — later
  email?: string; // fallback — later
}

export interface NotifyResult {
  ok: boolean;
  channel: string;
  disabled?: boolean;
  error?: string;
}

async function viaTelegram(chatId: string, text: string): Promise<NotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, channel: "telegram", disabled: true };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) return { ok: false, channel: "telegram", error: `telegram ${res.status}` };
    return { ok: true, channel: "telegram" };
  } catch (e) {
    return { ok: false, channel: "telegram", error: e instanceof Error ? e.message : "unknown" };
  }
}

// True when at least one customer-notify channel is configured server-side.
export function customerNotifyLive(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

// Pick the first available channel for this target. Provider-agnostic: add Linqapp/SMS/email here later
// (the callers and the opt-in UI never change).
export async function notifyCustomer(target: NotifyTarget, text: string): Promise<NotifyResult> {
  const msg = text.slice(0, 1000);
  if (target.telegramChatId) return viaTelegram(target.telegramChatId, msg);
  // Future: if (target.phone && linqappLive()) return viaLinqapp(target.phone, msg);
  return { ok: false, channel: "none", disabled: true };
}

// ── ChatOps: interactive approvals (approve consequential moves from your phone) ──────────────
// The shape we deliver to Telegram with Approve/Reject buttons. callback_data carries the approval id so
// the webhook can record the decision; the app then applies it through its normal resolveApproval path.
export interface ApprovalRequest {
  id: string;
  agent: string;
  kind: string;
  title: string;
  detail?: string;
  amount?: number;
  company?: string;
}

const TG = (token: string, method: string) => `https://api.telegram.org/bot${token}/${method}`;

// callback_data is capped at 64 bytes by Telegram — "ap:" + a uuid + ":y" is ~41, safe.
export function approvalCallbackData(id: string, approve: boolean): string {
  return `ap:${id}:${approve ? "y" : "n"}`;
}
export function parseApprovalCallback(data: string): { id: string; approve: boolean } | null {
  const m = /^ap:([0-9a-fA-F-]{6,40}):(y|n)$/.exec(data || "");
  return m ? { id: m[1], approve: m[2] === "y" } : null;
}

// Send a consequential approval to Telegram with inline Approve / Reject buttons. Gated + fail-soft.
export async function sendTelegramApproval(chatId: string, a: ApprovalRequest): Promise<NotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, channel: "telegram", disabled: true };
  const money = typeof a.amount === "number" && a.amount > 0 ? ` ($${a.amount.toFixed(2)})` : "";
  const text =
    `🔔 <b>${escapeHtml(a.company || "Your company")}</b> — needs your ok\n` +
    `<b>${escapeHtml(a.title)}</b>${money}\n` +
    (a.detail ? `${escapeHtml(a.detail)}\n` : "") +
    `<i>from ${escapeHtml(a.agent)} · nothing happens until you approve.</i>`;
  try {
    const res = await fetch(TG(token, "sendMessage"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Approve", callback_data: approvalCallbackData(a.id, true) },
            { text: "✋ Reject", callback_data: approvalCallbackData(a.id, false) },
          ]],
        },
      }),
    });
    if (!res.ok) return { ok: false, channel: "telegram", error: `telegram ${res.status}` };
    return { ok: true, channel: "telegram" };
  } catch (e) {
    return { ok: false, channel: "telegram", error: e instanceof Error ? e.message : "unknown" };
  }
}

// After a button tap: stop the spinner on the button + rewrite the message so the chat reflects the call.
export async function telegramAck(callbackQueryId: string, note: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(TG(token, "answerCallbackQuery"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: note }),
    });
  } catch { /* ignore */ }
}
export async function telegramEditText(chatId: string | number, messageId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(TG(token, "editMessageText"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" }),
    });
  } catch { /* ignore */ }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
