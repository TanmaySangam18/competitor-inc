// lib/core/outreach-send.ts — PHASE 4 seam: the governed SEND step of the reach rail.
//
// Turns a drafted first-touch into a compliant, named-AI message and (when a send credential is present)
// transmits it — but ONLY through the rails: the no-spam gate is re-checked here (defense in depth, so a
// blocked lead can never be emailed even if something upstream slipped), every message carries the AI
// disclosure + an opt-out (CAN-SPAM), and with no credential it FAILS CLOSED (nothing sent). The actual
// transport (the founder's Gmail/Workspace, or a relay) wires at the connect phase; this is the safety +
// compliance wrapper that owns the honesty rail regardless of provider.

import { outreachGate, type Lead, type FirstTouch } from "@/lib/org/outreach";

const AI_DISCLOSURE = "— Sent by competitor.inc's named AI team on behalf of a real company. Reply STOP to opt out.";

export function outreachConfigured(): boolean {
  return !!(process.env.GMAIL_SEND_TOKEN || process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

// Assemble the message that actually goes out: the draft + a mandatory AI disclosure + opt-out (CAN-SPAM).
export function compliantMessage(draft: FirstTouch, opts: { unsubscribe?: string } = {}): FirstTouch {
  const footer = `\n\n${AI_DISCLOSURE}${opts.unsubscribe ? `\nUnsubscribe: ${opts.unsubscribe}` : ""}`;
  return { subject: draft.subject, body: `${draft.body.trimEnd()}${footer}` };
}

export interface SendResult { sent: boolean; reason: string; message?: FirstTouch }

// Governed send. Never sends to a gate-blocked lead; fails CLOSED without a credential.
export async function sendFirstTouch(input: { lead: Lead; draft: FirstTouch; to: string; unsubscribe?: string }): Promise<SendResult> {
  const gate = outreachGate(input.lead);
  if (!gate.allowed) return { sent: false, reason: `blocked by the no-spam rail: ${gate.reason}` };
  if (!input.to) return { sent: false, reason: "no recipient address" };

  const message = compliantMessage(input.draft, { unsubscribe: input.unsubscribe });
  if (!outreachConfigured()) return { sent: false, reason: "email not configured — add a send credential to enable", message };

  try {
    // The transport wires here at the connect phase (founder Workspace / relay), lazily, so it never
    // loads keyless. Until then we assemble the compliant message but honestly report it wasn't sent.
    return { sent: false, reason: "send provider not wired yet — message is compliant + ready", message };
  } catch {
    return { sent: false, reason: "send failed (fail-soft)", message };
  }
}
