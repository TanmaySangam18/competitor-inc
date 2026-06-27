import { notifyCustomer } from "@/lib/engine/notify";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Send an opt-in customer-update message. The client passes the chat_id the user gave us; this route is
// GATED on TELEGRAM_BOT_TOKEN (no token ⇒ no-op { disabled }), rate-limited, and fail-soft. Telegram
// only delivers to users who already messaged the bot, so the blast radius is limited to opted-in chats.
export async function POST(req: Request) {
  if (rateLimited(`notify:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const chatId = typeof b.chatId === "string" ? b.chatId.trim() : "";
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 1000) : "";
  if (!chatId || !text) return Response.json({ error: "chatId and text required" }, { status: 400 });

  const r = await notifyCustomer({ telegramChatId: chatId }, text);
  return Response.json({ ok: r.ok, channel: r.channel, disabled: r.disabled, error: r.error });
}
