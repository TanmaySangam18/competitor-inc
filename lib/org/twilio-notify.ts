// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — FOUNDER CHANNEL (Twilio): agent → founder briefings + approvals over SMS / WhatsApp.
//
// Slack is the team room (agents talk to each other); Twilio is the 1:1 line to the founder's phone —
// the daily briefing and the founder-gated approvals. SMS/WhatsApp carry no per-message sender identity
// (unlike Slack), so the agent's TITLE is prefixed in-body ("Chief Executive Officer: …") to keep the
// names-are-positions mandate intact.
//
// Pure composition is tested; the send is fail-soft + inert until the Twilio creds are set. Trial-account
// reality (documented for the founder): a trial can only reach VERIFIED numbers, and WhatsApp runs through
// the sandbox — enough to prove agent→founder; reaching prospects needs an upgrade + A2P 10DLC.
// ─────────────────────────────────────────────────────────────────────────────

import { getRole } from "./organization";

// E.164 → a Twilio WhatsApp address. Idempotent (won't double-prefix an already-tagged address).
export function waAddress(num: string): string {
  const n = num.trim();
  return n.startsWith("whatsapp:") ? n : `whatsapp:${n}`;
}

// Prefix a message with the agent's title, since SMS/WhatsApp show only the shared Twilio number as the
// sender. Falls back to a plain company voice if the role is unknown.
export function withAgentPrefix(roleId: string | undefined, text: string): string {
  const title = (roleId && getRole(roleId)?.title) || "competitor.inc";
  return `${title}: ${text}`;
}

// The founder's daily briefing, phone-sized (kept short — it's a text, not the Slack post).
export function composeFounderText(companyName: string, night: number, shipped: number, needsYou: number): string {
  const needs = needsYou > 0 ? `${needsYou} need your OK` : "nothing needs you";
  return `${companyName} · night ${night}: ${shipped} shipped, ${needs}. Reply in Slack or tap the approval.`;
}

// ── Fail-soft Twilio send (inert until creds are set) ─────────────────────────

export interface TwilioConfig { sid: string; token: string; sms?: string; whatsapp?: string; founder?: string }

export function twilioConfig(): TwilioConfig | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return {
    sid,
    token,
    sms: process.env.TWILIO_NUMBER,               // SMS "from" number (E.164)
    whatsapp: process.env.TWILIO_WHATSAPP_FROM,   // WhatsApp "from" (sandbox or WA-enabled number)
    founder: process.env.TWILIO_FOUNDER_NUMBER,   // the founder's verified destination
  };
}

export interface SendResult { ok: boolean; sid?: string; error?: string }

async function twilioSend(cfg: TwilioConfig, from: string, to: string, body: string): Promise<SendResult> {
  try {
    const form = new URLSearchParams({ From: from, To: to, Body: body });
    const auth = Buffer.from(`${cfg.sid}:${cfg.token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Messages.json`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const j = (await res.json()) as { sid?: string; message?: string; code?: number };
    return res.ok ? { ok: true, sid: j.sid } : { ok: false, error: j.message || `twilio ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

// Message the founder AS an agent. Prefers WhatsApp when a WA "from" is configured, else SMS. No-op
// (ok:false, inert) when Twilio or a destination isn't configured — never throws into the caller.
export async function notifyFounder(
  roleId: string | undefined,
  text: string,
  opts?: { channel?: "sms" | "whatsapp"; to?: string },
): Promise<SendResult> {
  const cfg = twilioConfig();
  if (!cfg) return { ok: false, error: "twilio not configured (inert)" };
  const to = opts?.to || cfg.founder;
  if (!to) return { ok: false, error: "no founder destination (set TWILIO_FOUNDER_NUMBER)" };
  const body = withAgentPrefix(roleId, text);
  const wantWa = opts?.channel === "whatsapp" || (!opts?.channel && !!cfg.whatsapp);
  if (wantWa && cfg.whatsapp) return twilioSend(cfg, waAddress(cfg.whatsapp), waAddress(to), body);
  if (cfg.sms) return twilioSend(cfg, cfg.sms, to, body);
  return { ok: false, error: "no from-number (set TWILIO_NUMBER or TWILIO_WHATSAPP_FROM)" };
}
