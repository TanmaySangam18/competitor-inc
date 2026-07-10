import { serviceClient } from "@/lib/engine/service";
import { notifyFounder } from "@/lib/engine/notify-founder";
import { draftSupportReply } from "@/lib/engine/support-desk";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Beta feedback → persists to Supabase AND emails the founder (so it actually reaches them, not just the
// Table Editor). Gated + fail-soft: no Supabase → skip the insert; no Resend → skip the email; never throws.
import { escapeHtml as esc } from "@/lib/engine/html";

export async function POST(req: Request) {
  if (await overLimit(`feedback:${clientIp(req)}`)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 4000) : "";
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 200) : "";
  const path = typeof b.path === "string" ? b.path.slice(0, 200) : "";
  if (!message) return Response.json({ error: "empty" }, { status: 400 });

  const sb = serviceClient();
  if (sb) {
    try {
      await sb.from("feedback").insert({ message, email: email || null, path: path || null, user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null });
    } catch (e) {
      console.error("[/api/feedback] insert failed:", e instanceof Error ? e.message : "unknown");
    }
  }
  // Fire-and-forget founder email (gated on Resend) — now WITH Theo's ready-to-send reply (Block 6d:
  // 24/7 support drafting, human send). One forward answers the customer; the draft never fabricates.
  const reply = draftSupportReply({ message, email: email || null });
  void notifyFounder(
    `competitor.inc — new feedback${path ? ` (${path})` : ""}`,
    `<p><b>${esc(message)}</b></p><p>From: ${esc(email || "anonymous")} · ${esc(path || "—")}</p>` +
      `<hr/><p><i>${esc(reply.author)} drafted this reply — review and forward${email ? ` to ${esc(email)}` : " if they left a contact"}:</i></p>` +
      `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px">${esc(reply.body)}</blockquote>`
  ).catch(() => {});
  return Response.json({ ok: true });
}
