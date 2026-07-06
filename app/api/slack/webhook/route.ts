import crypto from "node:crypto";
import { runChat, detectChatApproval } from "@/lib/engine/server";
import { serviceClient } from "@/lib/engine/service";
import { recordChatOps } from "@/lib/engine/chatops";
import { postToSlack } from "@/lib/engine/slack";

export const runtime = "nodejs";

// Slack → here for (A) messages in a connected channel and (B) Approve/Reject button taps.
// Mirrors /api/telegram/webhook: verify signature (fail-closed), record decisions via the service
// client WITHOUT touching app state, always answer 200 so Slack doesn't retry-storm.
// Inert until SLACK_SIGNING_SECRET + SLACK_BOT_TOKEN are set.

// Verify Slack's request signature over the RAW body (must be read before parsing).
function signatureOk(headers: Headers, rawBody: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false; // fail-closed: unconfigured ⇒ ignore everything

  const timestamp = headers.get("x-slack-request-timestamp") || "";
  const signature = headers.get("x-slack-signature") || "";
  if (!timestamp || !signature) return false;

  // Reject replays older than 5 minutes.
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
  if (!Number.isFinite(age) || age > 300) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${crypto.createHmac("sha256", secret).update(base).digest("hex")}`;
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text(); // read raw body FIRST — the signature covers these exact bytes
  if (!signatureOk(req.headers, raw)) return Response.json({ ok: true }); // quiet 200, no retry-storm

  // Interactivity payloads arrive form-encoded as payload=<json>; events arrive as plain JSON.
  let body: Record<string, unknown> = {};
  try {
    if (raw.startsWith("payload=")) {
      body = { payload: JSON.parse(decodeURIComponent(raw.slice("payload=".length).replace(/\+/g, "%20"))) };
    } else {
      body = JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    return Response.json({ ok: true });
  }

  // (0) URL-verification handshake (one-time, at subscribe time).
  if (body.type === "url_verification" && typeof body.challenge === "string") {
    return Response.json({ challenge: body.challenge });
  }

  // (A) Channel message — the crew replies in-thread; consequential asks get flagged for the Inbox.
  const event = body.event as
    | { type?: string; text?: string; channel?: string; ts?: string; thread_ts?: string; bot_id?: string }
    | undefined;
  if (body.type === "event_callback" && event?.type === "message" && event.text && event.channel) {
    if (event.bot_id) return Response.json({ ok: true }); // never reply to ourselves
    const text = event.text.trim();
    if (text && !text.startsWith("/")) {
      try {
        const company = { name: "competitor.inc", idea: "the proof-first AI co-founder that validates demand before building" };
        const soul =
          "You are the crew at competitor.inc, replying to the founder in Slack. Be concise and in-character. If the ask implies a consequential move (spending, posting, deploying), say you'll DRAFT it and queue it for approval — never claim you already shipped it.";
        const reply = await runChat(company, text, soul);
        const appr = detectChatApproval(text);
        const note = appr ? `\n\n🔔 That's consequential — I'll queue "${appr.title}" in your Approval Inbox for your yes.` : "";
        await postToSlack(event.channel, `${reply}${note}`, event.thread_ts || event.ts);
        // Reflect the exchange in the web CrewBox (fail-soft).
        const sbS = serviceClient();
        if (sbS) { await recordChatOps(sbS, { source: "slack", direction: "in", text }); await recordChatOps(sbS, { source: "slack", direction: "out", text: reply, agent: "ceo" }); }
      } catch {
        /* fail-soft */
      }
    }
    return Response.json({ ok: true });
  }

  // (B) Button tap on an approval card.
  const payload = body.payload as
    | { type?: string; actions?: Array<{ value?: string }>; response_url?: string }
    | undefined;
  if (payload?.type === "block_actions") {
    const value = payload.actions?.[0]?.value || "";
    const [approvalId, decision] = value.split(":");
    if (!approvalId || (decision !== "approved" && decision !== "rejected")) return Response.json({ ok: true });

    const sb = serviceClient();
    if (sb) {
      try {
        await sb.from("approval_decisions").upsert(
          { approval_id: approvalId, decision, source: "slack" },
          { onConflict: "approval_id" }
        );
      } catch (e) {
        console.error("[/api/slack/webhook] record failed:", e instanceof Error ? e.message : "unknown");
      }
    }

    if (payload.response_url) {
      try {
        await fetch(payload.response_url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: `${decision === "approved" ? "✅ Approved" : "✋ Rejected"} by you. Your workspace will apply it on next sync.`,
            replace_original: true,
          }),
        });
      } catch {
        /* fail-soft */
      }
    }
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true });
}
