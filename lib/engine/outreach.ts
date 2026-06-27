// Cold-outreach drafting — the Predictable Revenue way (targeted + personalized, NOT a blast). The agents
// draft a personalized B2B cold email per prospect, attributed to competitor.inc (sent on the user's
// behalf, branded), with a one-line ask + an easy opt-out. An evaluator gates each draft for compliance
// before it's queued. SENDING is deferred to a SEPARATE warmed competitor.inc sending domain (never the
// transactional one, and never a mass blast) — that's the founder's cold-email infra step.
//
// Why B2B only: cold-emailing businesses with a clear opt-out is lawful (CAN-SPAM); cold-emailing
// consumers (B2C) is spam + illegal under GDPR. The anti-Polsia is relevance + restraint + human approval.

export interface Prospect {
  name: string;
  company: string;
  hook?: string; // a specific, personal reason you're reaching out (the difference between outreach and spam)
  email?: string;
}

export interface OutreachDraft {
  to?: string;
  subject: string;
  body: string;
}

export function draftColdOutreach(seller: { name: string; idea: string; link?: string }, prospect: Prospect): OutreachDraft {
  const first = (prospect.name || "").trim().split(/\s+/)[0] || "there";
  const idea = (seller.idea || "").replace(/[.!?]+$/, "");
  const subject = `quick idea for ${prospect.company}`;
  const body =
    `Hi ${first},\n\n` +
    `${prospect.hook ? prospect.hook.trim() + " " : ""}I'm reaching out on behalf of ${seller.name} — ${idea}.\n\n` +
    `Thought it might be worth a look for ${prospect.company}.${seller.link ? " " + seller.link : ""}\n\n` +
    `If it's not relevant, just reply "no" and I won't follow up.\n\n` +
    `— sent via competitor.inc on behalf of ${seller.name}\n` +
    `Don't want these? Reply STOP to unsubscribe.`;
  return { to: prospect.email, subject, body };
}

const SPAM = [/\bfree money\b/i, /\bact now\b/i, /\blimited time\b/i, /\bguaranteed\b/i, /!!!/, /\$\$\$/, /\bwinner\b/i];

// Compliance gate: is this safe + lawful + non-spammy to send (with one human campaign approval)?
export function evaluateOutreach(d: OutreachDraft): { pass: boolean; reason: string } {
  const text = `${d.subject}\n${d.body}`;
  if (!/unsubscribe|reply stop/i.test(d.body)) return { pass: false, reason: "no opt-out (CAN-SPAM)" };
  if (!/competitor\.inc/i.test(d.body)) return { pass: false, reason: "missing competitor.inc attribution" };
  if (d.body.length > 900) return { pass: false, reason: "too long — reads like a blast, not a 1:1" };
  if (!/\b(no|reply)\b/i.test(d.body)) return { pass: false, reason: "no clear single response path" };
  for (const re of SPAM) if (re.test(text)) return { pass: false, reason: "spam-trigger phrasing" };
  return { pass: true, reason: "compliant + personalized" };
}
