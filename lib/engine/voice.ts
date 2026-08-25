// ─────────────────────────────────────────────────────────────────────────────
// OUTBOUND VOICE, with the rails that make it legal.
//
// THE LAW THIS FILE EXISTS TO RESPECT, not route around: the FCC ruled in February 2024 that
// AI-generated voices are "artificial" under the TCPA. A marketing call using one requires PRIOR
// EXPRESS WRITTEN CONSENT. Without it the exposure is $500 to $1,500 per call WITH a private right of
// action, meaning the person called can sue directly. Massachusetts additionally requires two-party
// consent to record, and that one is criminal rather than civil.
//
// So this module cannot place a call to a number that has not been recorded as consenting, and the
// consent is a required argument rather than a flag someone can forget. There is no parameter that
// disables it. A "cold call" mode would be the single most legally dangerous feature in this codebase.
//
// The AI also identifies itself as an AI in the first sentence, before anything is sold. That is both
// the house rule and a growing statutory requirement, and it makes the call MORE impressive rather
// than less.
// ─────────────────────────────────────────────────────────────────────────────

export interface Consent {
  /** Where the consent came from, in words a regulator could read. */
  basis: string;
  /** When it was given. */
  at: string;
  /** Who recorded it. */
  recordedBy: string;
}

export interface CallRequest {
  to: string;
  /** Consent is not optional and not a boolean. Absence of a reason is absence of consent. */
  consent: Consent;
  /** What the agent says. Must already contain the AI disclosure; verified, not trusted. */
  script: string;
  agentName: string;
}

export type CallVerdict =
  | { placed: true; sid: string; disclosedAt: "first-sentence" }
  | { placed: false; reason: string };

/** The disclosure that must appear before anything is sold. Checked in the text, never asserted. */
export const AI_DISCLOSURE_MARK = /\b(I am|I'm|this is) an? (AI|artificial intelligence|automated)\b/i;

export function hasDisclosure(script: string): boolean {
  // Must be in the OPENING, not buried at the end after the pitch.
  const opening = script.trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return AI_DISCLOSURE_MARK.test(opening);
}

export function withDisclosure(script: string, agentName: string, principal: string): string {
  if (hasDisclosure(script)) return script;
  return `Hi, this is ${agentName}. I am an AI agent calling on behalf of ${principal}. ${script.trim()}`;
}

/** E.164 or we do not dial it. A malformed number is a wrong number. */
export function validNumber(n: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(n.trim());
}

export function twilioConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return !!(env.TWILIO_ACCOUNT_SID?.trim() && env.TWILIO_AUTH_TOKEN?.trim() && env.TWILIO_NUMBER?.trim());
}

/** Escape for TwiML, so a script containing punctuation cannot break the XML or inject verbs. */
function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * The TwiML spoken on the call. Inline, so no public webhook is needed, which is what makes this
 * demonstrable from a laptop.
 */
export function buildTwiml(script: string): string {
  return `<Response><Say voice="Polly.Matthew-Neural">${xmlEscape(script)}</Say></Response>`;
}

/**
 * Place the call.
 *
 * Refuses, in order: no consent reason, an invalid number, a missing AI disclosure, no credentials.
 * Every refusal names what is missing.
 */
export async function placeCall(
  req: CallRequest,
  deps: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined> } = {}
): Promise<CallVerdict> {
  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (!req.consent?.basis?.trim()) {
    return { placed: false, reason: "No consent basis was recorded. An AI voice call without prior express consent is a TCPA violation, so this cannot proceed." };
  }
  if (!validNumber(req.to)) {
    return { placed: false, reason: `"${req.to}" is not a valid E.164 number, and a malformed number is a wrong number.` };
  }
  if (!hasDisclosure(req.script)) {
    return { placed: false, reason: "The script does not identify the caller as an AI in its opening sentences. Use withDisclosure() first." };
  }
  if (!twilioConfigured(env)) {
    return { placed: false, reason: "Twilio is not configured (needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_NUMBER)." };
  }

  const sid = env.TWILIO_ACCOUNT_SID!.trim();
  const body = new URLSearchParams({
    To: req.to.trim(),
    From: env.TWILIO_NUMBER!.trim(),
    Twiml: buildTwiml(req.script),
  });

  try {
    const res = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: {
        authorization: "Basic " + Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN!.trim()}`).toString("base64"),
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const j = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!res.ok || !j.sid) {
      // Twilio's own words. On a trial account the common one is number-not-verified, and guessing at
      // that would waste the time this message saves.
      return { placed: false, reason: `Twilio refused: ${j.message ?? `HTTP ${res.status}`}${j.code ? ` (code ${j.code})` : ""}` };
    }
    return { placed: true, sid: j.sid, disclosedAt: "first-sentence" };
  } catch (e) {
    return { placed: false, reason: `Network error placing the call: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
