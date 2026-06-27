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
