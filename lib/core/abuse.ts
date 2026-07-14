// lib/core/abuse.ts — CUSTOMER-ABUSE CONTAINMENT (REQUIREMENTS §14, Tier A4).
//
// "Their misuse is your legal exposure." Two gates: (1) intake screening against a prohibited-use list
// BEFORE a customer company activates; (2) activity classifiers on a running customer → auto-freeze that
// customer's namespace (via the A1 kill switch — blast-radius containment) + escalate to a human. Frozen
// customers keep their data; a human decides disposition.
//
// HONEST scope: the classifier is a deterministic HEURISTIC, not a trained model — it flags, it doesn't
// adjudicate. The actual Acceptable-Use Policy is written + signed by a real lawyer (HUMAN_TODO §Legal);
// this code enforces the mechanism, not the legal judgment. Borderline intake → "review" (a human), never
// a silent allow or deny.

import { killSwitch as defaultSwitch, type KillSwitch } from "./killswitch";
import { auditLog as defaultLog, type AuditLog } from "./audit";

export type IntakeDecision = "allow" | "review" | "deny";

export interface IntakeResult {
  decision: IntakeDecision;
  category?: string; // the prohibited/sensitive category matched, if any
  matched: string[]; // the terms that triggered it (for the human's context)
  reason: string;
}

// Hard-deny categories (unlawful / harmful on their face) and sensitive categories that route to a human.
const HARD_DENY: { category: string; terms: string[] }[] = [
  { category: "malware", terms: ["malware", "ransomware", "keylogger", "botnet", "ddos", "exploit kit"] },
  { category: "fraud", terms: ["phishing", "carding", "stolen card", "money laundering", "ponzi", "fake reviews"] },
  { category: "csam/violence", terms: ["csam", "child abuse", "terrorism", "weapon manufacture", "human trafficking"] },
  { category: "spam", terms: ["scraped list", "bulk unsolicited", "spam blast", "mass cold email", "robocall"] },
];
const REVIEW: { category: string; terms: string[] }[] = [
  { category: "surveillance", terms: ["surveillance", "track a person", "facial recognition", "stalk"] },
  { category: "regulated", terms: ["gambling", "crypto token", "ico", "prescription", "controlled substance", "firearm"] },
  { category: "political", terms: ["political campaign", "election", "disinformation"] },
];

function scan(text: string, table: { category: string; terms: string[] }[]): { category: string; matched: string[] } | null {
  const t = text.toLowerCase();
  for (const row of table) {
    const matched = row.terms.filter((term) => t.includes(term));
    if (matched.length) return { category: row.category, matched };
  }
  return null;
}

// Screen an intake description before a customer company activates.
export function screenIntake(input: { summary: string }): IntakeResult {
  const text = (input.summary || "").trim();
  if (!text) return { decision: "review", matched: [], reason: "no description provided — a human should look" };
  const deny = scan(text, HARD_DENY);
  if (deny) return { decision: "deny", category: deny.category, matched: deny.matched, reason: `prohibited use (${deny.category})` };
  const review = scan(text, REVIEW);
  if (review) return { decision: "review", category: review.category, matched: review.matched, reason: `sensitive use (${review.category}) — needs human + AUP check` };
  return { decision: "allow", matched: [], reason: "no prohibited or sensitive signals" };
}

// ── Running-customer activity classifier ─────────────────────────────────────
export interface ActivitySignals {
  emailsSent?: number;
  bounceRate?: number; // 0–1
  complaintRate?: number; // 0–1 (spam complaints / sent)
  chargebacks?: number;
  failedLogins?: number;
  contentFlags?: string[]; // upstream content-classifier hits
}

export type Risk = "low" | "elevated" | "high";
export interface ActivityAssessment {
  risk: Risk;
  flags: string[];
  recommend: "monitor" | "review" | "freeze";
}

// Deterministic thresholds (industry-typical starting points; tune with evidence, never in a prompt).
export function classifyActivity(s: ActivitySignals): ActivityAssessment {
  const flags: string[] = [];
  if ((s.complaintRate ?? 0) > 0.001) flags.push("spam-complaint rate above 0.1%");
  if ((s.bounceRate ?? 0) > 0.1) flags.push("bounce rate above 10% (scraped-list signal)");
  if ((s.chargebacks ?? 0) >= 3) flags.push("3+ chargebacks (fraud signal)");
  if ((s.failedLogins ?? 0) >= 100) flags.push("100+ failed logins (credential-stuffing signal)");
  if ((s.contentFlags?.length ?? 0) > 0) flags.push(`content flags: ${s.contentFlags!.join(", ")}`);

  // High: any fraud/deception/content signal, or two+ signals at once. Elevated: a single soft signal.
  const severe = flags.some((f) => /chargeback|content flags|complaint/.test(f));
  const risk: Risk = severe || flags.length >= 2 ? "high" : flags.length === 1 ? "elevated" : "low";
  const recommend = risk === "high" ? "freeze" : risk === "elevated" ? "review" : "monitor";
  return { risk, flags, recommend };
}

export interface FreezeOutcome {
  frozen: boolean;
  customer: string;
  reason: string;
  disposition: "preserve_and_notify_human"; // frozen data is preserved; a human decides fate (§14)
  auditId: number;
}

// Enforce a freeze on a customer's namespace when the classifier says so. Uses the out-of-band kill switch
// (per-customer level) — one bad customer is contained without touching any other.
export function enforceFreeze(
  customer: string,
  assessment: ActivityAssessment,
  deps: { log?: AuditLog; switch?: KillSwitch } = {},
): FreezeOutcome {
  const log = deps.log ?? defaultLog;
  const ks = deps.switch ?? defaultSwitch;
  const shouldFreeze = assessment.recommend === "freeze";
  const reason = shouldFreeze ? `abuse classifier: ${assessment.flags.join("; ")}` : "below freeze threshold";
  if (shouldFreeze) ks.freezeCustomer(customer);
  const entry = log.record({
    actor: "system", action: shouldFreeze ? "freeze_customer" : "abuse_review", customer,
    tier: "T3", verdict: shouldFreeze ? "BLOCK" : "QUEUE", rationale: reason,
    output: shouldFreeze ? "namespace frozen; data preserved; escalated to human" : "flagged for human review",
  });
  return { frozen: shouldFreeze, customer, reason, disposition: "preserve_and_notify_human", auditId: entry.seq };
}
