import { notifyCustomer, sendTelegramApproval, type ApprovalRequest } from "@/lib/engine/notify";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Send an opt-in customer notification. The client passes the chat_id the user gave us. Two shapes:
//   { chatId, text }       → a plain update message
//   { chatId, approval:{} } → a consequential approval with inline Approve/Reject buttons (ChatOps)
// GATED on TELEGRAM_BOT_TOKEN (no token ⇒ no-op { disabled }), rate-limited, fail-soft. Telegram only
// delivers to users who already messaged the bot, so the blast radius is limited to opted-in chats.
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
  if (!chatId) return Response.json({ error: "chatId required" }, { status: 400 });

  // Approval (buttoned) path.
  if (b.approval && typeof b.approval === "object") {
    const a = b.approval as Record<string, unknown>;
    const id = typeof a.id === "string" ? a.id : "";
    const title = typeof a.title === "string" ? a.title.slice(0, 200) : "";
    if (!id || !title) return Response.json({ error: "approval id and title required" }, { status: 400 });
    const appr: ApprovalRequest = {
      id,
      title,
      agent: typeof a.agent === "string" ? a.agent : "your crew",
      kind: typeof a.kind === "string" ? a.kind : "action",
      detail: typeof a.detail === "string" ? a.detail.slice(0, 400) : undefined,
      amount: typeof a.amount === "number" ? a.amount : undefined,
      company: typeof a.company === "string" ? a.company.slice(0, 80) : undefined,
    };
    const r = await sendTelegramApproval(chatId, appr);
    return Response.json({ ok: r.ok, channel: r.channel, disabled: r.disabled, error: r.error });
  }

  // Plain text path.
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 1000) : "";
  if (!text) return Response.json({ error: "text or approval required" }, { status: 400 });
  const r = await notifyCustomer({ telegramChatId: chatId }, text);
  return Response.json({ ok: r.ok, channel: r.channel, disabled: r.disabled, error: r.error });
}
