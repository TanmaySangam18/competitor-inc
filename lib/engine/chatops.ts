import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// ChatOps reflection store — the founder's Slack/Telegram messages + the crew's replies, so the web CrewBox
// can show them. All calls fail-soft (the table may not be migrated yet): a store error never breaks a
// webhook reply or the box. Writes happen via the service role in the webhooks; reads via the auth-gated API.

export type ChatOpsSource = "telegram" | "slack";
export interface ChatOpsMessage {
  id: string;
  source: ChatOpsSource;
  direction: "in" | "out";
  text: string;
  agent?: string | null;
  createdAt: string;
}

export async function recordChatOps(
  sb: SupabaseClient,
  m: { source: ChatOpsSource; direction: "in" | "out"; text: string; agent?: string },
): Promise<void> {
  try {
    await sb.from("chatops_messages").insert({
      source: m.source,
      direction: m.direction,
      text: (m.text || "").slice(0, 2000),
      agent: m.agent ?? null,
    });
  } catch {
    /* fail-soft: table not migrated / offline */
  }
}

export async function readChatOps(sb: SupabaseClient, sinceISO: string, limit = 20): Promise<ChatOpsMessage[]> {
  try {
    const { data } = await sb
      .from("chatops_messages")
      .select("id, source, direction, text, agent, created_at")
      .gt("created_at", sinceISO)
      .order("created_at", { ascending: true })
      .limit(limit);
    return ((data ?? []) as Array<{ id: string; source: ChatOpsSource; direction: "in" | "out"; text: string; agent: string | null; created_at: string }>).map(
      (r) => ({ id: r.id, source: r.source, direction: r.direction, text: r.text, agent: r.agent, createdAt: r.created_at }),
    );
  } catch {
    return [];
  }
}
