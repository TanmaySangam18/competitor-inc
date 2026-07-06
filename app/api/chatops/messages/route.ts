import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { readChatOps } from "@/lib/engine/chatops";
import { isFounderEmail } from "@/lib/engine/founders";

export const runtime = "nodejs";

// Recent ChatOps messages for the CrewBox to reflect. FOUNDER-GATED: ChatOps (Slack/Telegram) is the
// founder's own operator channel, so only a signed-in FOUNDER gets these — a non-founder (or guest) gets an
// empty list, never someone else's messages. Single-founder today; when chat_id→user mapping lands, switch
// this to `readChatOps(sb, since, uid)` for per-user scoping (the user_id column already exists). Reads via
// the service role behind the check. Fail-soft: empty list when unauthenticated, non-founder, or unmigrated.
export async function GET(req: Request) {
  const ses = await getServerSupabase();
  const { data } = (await ses?.auth.getUser()) ?? { data: null };
  if (!data?.user || !isFounderEmail(data.user.email)) return Response.json({ messages: [] });

  const sb = serviceClient();
  if (!sb) return Response.json({ messages: [] });

  const since = new URL(req.url).searchParams.get("since") || new Date(Date.now() - 60_000).toISOString();
  const messages = await readChatOps(sb, since);
  return Response.json({ messages });
}
