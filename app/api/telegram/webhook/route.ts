import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { parseApprovalCallback, telegramAck, telegramEditText } from "@/lib/engine/notify";

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

  const cq = update.callback_query as
    | { id: string; data?: string; message?: { message_id: number; chat?: { id: number } } }
    | undefined;
  if (!cq?.data) return Response.json({ ok: true }); // not a button tap — nothing to do

  const parsed = parseApprovalCallback(cq.data);
  if (!parsed) { await telegramAck(cq.id, "Unrecognized."); return Response.json({ ok: true }); }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false } });
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
