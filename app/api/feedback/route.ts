import { createClient } from "@supabase/supabase-js";
import { notifyFounder } from "@/lib/engine/notify-founder";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Beta feedback → persists to Supabase AND emails the founder (so it actually reaches them, not just the
// Table Editor). Gated + fail-soft: no Supabase → skip the insert; no Resend → skip the email; never throws.
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c));
}

export async function POST(req: Request) {
  if (rateLimited(`feedback:${clientIp(req)}`)) {
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      await sb.from("feedback").insert({ message, email: email || null, path: path || null, user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null });
    } catch (e) {
      console.error("[/api/feedback] insert failed:", e instanceof Error ? e.message : "unknown");
    }
  }
  // Fire-and-forget founder email (gated on Resend).
  void notifyFounder(
    `competitor.inc — new feedback${path ? ` (${path})` : ""}`,
    `<p><b>${esc(message)}</b></p><p>From: ${esc(email || "anonymous")} · ${esc(path || "—")}</p>`
  ).catch(() => {});
  return Response.json({ ok: true });
}
