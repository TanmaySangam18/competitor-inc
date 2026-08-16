// ─────────────────────────────────────────────────────────────────────────────
// AGENTMAIL — two-way email for the agents (ADR-0019). Each department agent gets its own inbox
// (send + RECEIVE + reply), via AgentMail's API (YC S25). Upgrades the send-only "Email sending"
// connection to real conversations: support reads a ticket and replies in-thread, sales handles
// replies, finance sends receipts.
//
// Governed like everything else: sending is an outbound act → passes governAction (kill switch →
// policy → audit) BEFORE the network, carries the named-AI disclosure + opt-out (CAN-SPAM), and fails
// closed with no key. RECEIVING/listing is read-only (T1 mcp_read-class) and auto-runs. BYOK: the
// customer's AGENTMAIL_API_KEY, their inboxes, their ownership.
// ─────────────────────────────────────────────────────────────────────────────

import { governAction, type GovernOptions } from "@/lib/core/govern";
import type { AgentRole } from "@/lib/core/types";

const BASE = "https://api.agentmail.to/v0";
const AI_DISCLOSURE = "\n\n— Sent by competitor.inc's named AI team on behalf of a real company. Reply STOP to opt out.";

/** Pure: every outbound body carries the named-AI disclosure + opt-out (CAN-SPAM). Unit-testable. */
export function withDisclosure(text: string): string {
  return text.includes("Reply STOP to opt out") ? text : text + AI_DISCLOSURE;
}

export function agentMailReady(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.AGENTMAIL_API_KEY);
}

export type MailResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string; governed?: "BLOCK" | "QUEUE" };

async function call(path: string, init: RequestInit, env: Record<string, string | undefined>, fetchImpl: typeof fetch): Promise<MailResult> {
  const key = env.AGENTMAIL_API_KEY;
  if (!key) return { ok: false, error: "AgentMail not connected (set AGENTMAIL_API_KEY)" };
  try {
    const res = await fetchImpl(`${BASE}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) return { ok: false, error: `AgentMail → HTTP ${res.status}` };
    return { ok: true, result: await res.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, error: `network: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

/** READ inbound mail for a department's inbox. Read-only → T1 mcp_read, auto-runs (never sends). */
export async function listInbound(
  inbox: string, dept: AgentRole,
  opts: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined>; govern?: GovernOptions } = {},
): Promise<MailResult> {
  const env = opts.env ?? process.env;
  const g = governAction({ type: "mcp_read", agent: dept, reversible: true, hasCredential: true }, { ...opts.govern, input: `agentmail:list ${inbox}` });
  if (g.decision.verdict !== "AUTO") return { ok: false, error: `governed: ${g.decision.verdict} — ${g.decision.reason}`, governed: g.decision.verdict as "BLOCK" | "QUEUE" };
  return call(`/inboxes/${encodeURIComponent(inbox)}/messages`, { method: "GET" }, env, opts.fetchImpl ?? fetch);
}

/** SEND / reply. Outbound → governed as "outreach" (T2 → queues unless the mandate promotes it), disclosure
 *  + opt-out appended here (defense in depth), fails closed with no key. */
export async function sendMail(
  msg: { inbox: string; to: string; subject: string; text: string; replyToThread?: string; dept: AgentRole },
  opts: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined>; govern?: GovernOptions } = {},
): Promise<MailResult> {
  const env = opts.env ?? process.env;
  const g = governAction({ type: "outreach", agent: msg.dept }, { ...opts.govern, input: `agentmail:send ${msg.to} :: ${msg.subject}` });
  if (g.decision.verdict !== "AUTO") return { ok: false, error: `governed: ${g.decision.verdict} — ${g.decision.reason}`, governed: g.decision.verdict as "BLOCK" | "QUEUE" };
  const body = JSON.stringify({ to: msg.to, subject: msg.subject, text: withDisclosure(msg.text), ...(msg.replyToThread ? { thread_id: msg.replyToThread } : {}) });
  return call(`/inboxes/${encodeURIComponent(msg.inbox)}/messages/send`, { method: "POST", body }, env, opts.fetchImpl ?? fetch);
}
