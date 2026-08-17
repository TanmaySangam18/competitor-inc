// lib/core/publish-gate.ts — THE ONE DOOR EVERY OUTBOUND POST GOES THROUGH.
//
// WHY THIS EXISTS, stated plainly because the finding is embarrassing and instructive:
//
// The department publishing mandate (lib/org/publishing-mandate.ts, ADR-0012) was written, tested, and
// wired to NOTHING. `deptSelfApprove` had exactly one reference in the entire repository: its own
// definition. Meanwhile three real publishers, Bluesky, Mastodon and Reddit, were making live HTTP calls
// to real platforms with no mandate check between the draft and the send.
//
// That is precisely the defect we point at in competitors. Naive's own docs concede that 222 of their 271
// tools assert no gate at all. A gate that exists but is not wired is worth the same as no gate, and
// claiming governance while shipping an ungated pipe is worse than claiming nothing, because someone
// believes it.
//
// So: publishers no longer decide anything. They receive a token that only this module can mint, and it
// is only minted after every rail has been checked, in a fixed order, with the result written to the
// audit ledger whether it passed or failed. A publisher that is handed no token cannot send, because it
// has nothing to send with.
//
// THE ORDER IS LOAD-BEARING. Cheapest and most absolute first, so an engaged kill switch is never
// second-guessed by a content model, and a scraped audience is rejected before anyone asks whether the
// prose was polite.
//
//   1. KILL SWITCH   — global, per-agent, per-customer. Above every mandate, always.
//   2. CONTENT GATE  — screenContent(): hostility, tragedy adjacency, politics, medical, legal, bait.
//   3. HONESTY       — when the caller names the belief behind the claim, its PROVENANCE decides. An
//                      observed belief with a source may be quoted; an assertion or an inference may not.
//   4. MANDATE       — the five rails: separation, honesty, disclosure, caps, audience, judgment.
//   5. AUDIT         — appended either way. A refusal is a record, not a silence.
//
// Steps 2 and 3 are ordered that way on purpose: the mandate ACCEPTS content flags as an input, so the
// screen has to run first to produce them. Passing an empty array would quietly disable rail 6.

import { killSwitch } from "./killswitch";
import { screenContent } from "./content-gate";
import { auditLog } from "./audit";
import { deptSelfApprove, CHANNEL_DAILY_CAP, type PublishRequest } from "@/lib/org/publishing-mandate";
import { claimSupport, type BeliefStore } from "./beliefs";

/** Platforms this gate knows how to reason about. Must stay a subset of the mandate's PUBLISH_KINDS. */
export type PublishChannel = "bluesky" | "mastodon" | "reddit" | "linkedin" | "twitter";

export interface PublishAttempt {
  channel: PublishChannel;
  text: string;
  /** Role id of the agent that drafted it. */
  author: string;
  /** Role id of the department lead signing off. Must not be the author. */
  approver: string;
  /** Resolved from the org tree by the caller. */
  approverIsLead: boolean;
  /**
   * Claims are receipt-backed or explicitly labelled simulation. The honesty floor outranks everything.
   * This is a caller ASSERTION and therefore the weak form. Prefer `claim` below, which is checked.
   */
  honestyVerified: boolean;
  /**
   * The belief this post's factual claim rests on. When supplied, the gate CHECKS it against the belief
   * store and ignores `honestyVerified` entirely, because a rail you can satisfy by setting a boolean is
   * not a rail. Only an OBSERVED belief with a source can back a public claim (lib/core/beliefs.ts), which
   * is what the mandate means by "receipt-backed" and what nobody else in the category governs.
   */
  claim?: { store: BeliefStore; subject: string; predicate: string; at?: number };
  /** Posts already made on this channel today, for the runaway cap. */
  postsTodayOnChannel: number;
  audience: "own" | "opted_in" | "scraped" | "unknown";
  /** Optional scope so a stopped agent or frozen customer is caught by the kill switch. */
  customer?: string;
}

/**
 * The capability token. A publisher cannot construct one: the only field that matters is `granted`, and
 * it is minted here or not at all. Carrying the cleared text means a publisher physically cannot send
 * something other than what was approved.
 */
export interface PublishPermit {
  readonly granted: true;
  readonly channel: PublishChannel;
  readonly text: string;
  readonly reason: string;
  readonly auditSeq: number;
}

export interface PublishRefusal {
  readonly granted: false;
  readonly channel: PublishChannel;
  /** Which rail stopped it, so a human reading the queue knows what to fix. */
  readonly rail: "kill-switch" | "content-gate" | "mandate" | "disclosure" | "honesty" | "empty";
  readonly reason: string;
  readonly auditSeq: number;
}

export type PublishDecision = PublishPermit | PublishRefusal;

/** The named-AI disclosure every outbound artifact carries. Standing rail since 2026-07-08. */
export const AI_DISCLOSURE = "Posted by an AI agent of competitor.inc, on behalf of a named human.";

/**
 * Is the disclosure actually present? Checked on the TEXT rather than trusted as a caller-supplied
 * boolean, because the mandate's `disclosed` flag is exactly the kind of field a caller sets to true out
 * of habit. A rail you can satisfy by asserting it is not a rail.
 */
export function hasDisclosure(text: string): boolean {
  return /\bAI agent\b/i.test(text) && /competitor\.inc/i.test(text);
}

/** Append the disclosure if it is missing, so callers do not have to remember the exact wording. */
export function withDisclosure(text: string): string {
  return hasDisclosure(text) ? text : `${text.trimEnd()}\n\n${AI_DISCLOSURE}`;
}

/** Per-platform hard limits, checked before a send rather than discovered as a 400. */
export const CHANNEL_LIMITS: Record<PublishChannel, number> = {
  bluesky: 300,
  mastodon: 500,
  reddit: 40_000,
  linkedin: 3_000,
  twitter: 280,
};

/**
 * Run every rail and mint a permit only if all of them hold. This is the ONLY function that returns a
 * granted permit, and publishers accept nothing else.
 */
export function requestPublish(attempt: PublishAttempt): PublishDecision {
  const { channel } = attempt;
  const text = (attempt.text ?? "").trim();

  const record = (verdict: string, rationale: string): number =>
    auditLog.record({
      actor: attempt.author,
      action: `publish:${channel}`,
      customer: attempt.customer,
      verdict,
      input: text.slice(0, 140),
      rationale,
      reversible: false, // a published post is not reversible in any meaningful sense
    }).seq;

  if (!text) {
    return { granted: false, channel, rail: "empty", reason: "nothing to post", auditSeq: record("BLOCK", "empty text") };
  }

  // 1. KILL SWITCH — above every mandate.
  const halt = killSwitch.haltReason({ agent: attempt.author, customer: attempt.customer });
  if (halt) {
    return { granted: false, channel, rail: "kill-switch", reason: halt, auditSeq: record("BLOCK", halt) };
  }

  // The disclosure is checked against the text, not against a caller's claim about the text.
  if (!hasDisclosure(text)) {
    const reason = "named-AI disclosure missing from the post text";
    return { granted: false, channel, rail: "disclosure", reason, auditSeq: record("BLOCK", reason) };
  }

  const overLimit = text.length > CHANNEL_LIMITS[channel];
  if (overLimit) {
    const reason = `${text.length} characters exceeds the ${channel} limit of ${CHANNEL_LIMITS[channel]}`;
    return { granted: false, channel, rail: "mandate", reason, auditSeq: record("BLOCK", reason) };
  }

  // 2. HONESTY, CHECKED RATHER THAN CLAIMED. When the caller names the belief behind the post, the grade
  //    decides: evidence may be quoted, an assertion or an inference may not, however confident it is.
  let honest = attempt.honestyVerified;
  if (attempt.claim) {
    const support = claimSupport(attempt.claim.store, attempt.claim.subject, attempt.claim.predicate, attempt.claim.at ?? Date.now());
    if (!support.supported) {
      const reason = `claim not receipt-backed: ${support.reason}`;
      return { granted: false, channel, rail: "honesty", reason, auditSeq: record("QUEUE", reason) };
    }
    honest = true;
  }

  // 3. CONTENT GATE — produces the flags the mandate's judgment rail consumes.
  const screen = screenContent(text);

  // 4. MANDATE — the five rails, unchanged and unduplicated. This module composes it, never reimplements
  //    it, so there is one definition of what a department lead may approve.
  const req: PublishRequest = {
    kind: channel,
    author: attempt.author,
    approver: attempt.approver,
    approverIsLead: attempt.approverIsLead,
    honestyVerified: honest,
    disclosed: true, // established above by inspecting the text
    postsTodayOnChannel: attempt.postsTodayOnChannel,
    audience: attempt.audience,
    contentFlags: screen.flags,
  };
  const verdict = deptSelfApprove(req);
  if (!verdict.allow) {
    return {
      granted: false,
      channel,
      rail: screen.flags.length ? "content-gate" : "mandate",
      reason: verdict.reason,
      auditSeq: record("QUEUE", verdict.reason),
    };
  }

  return { granted: true, channel, text, reason: verdict.reason, auditSeq: record("AUTO", verdict.reason) };
}

/** Convenience for surfaces that want to explain the rails without attempting a post. */
export function publishRails(): { name: string; rule: string }[] {
  return [
    { name: "Kill switch", rule: "A global, per-agent or per-customer stop halts every post before any other check runs." },
    { name: "Disclosure", rule: `Every post carries the named-AI disclosure, verified in the text: "${AI_DISCLOSURE}"` },
    { name: "Separation", rule: "The approver is the department lead and is never the author. Nobody signs off their own work." },
    { name: "Honesty", rule: "Claims are receipt-backed or labelled as simulation. The honesty floor outranks the mandate." },
    { name: "Caps", rule: `At most ${CHANNEL_DAILY_CAP} posts per channel per day, which is generous for a team and fatal for a runaway.` },
    { name: "Audience", rule: "Own or opted-in audiences only. A scraped audience is refused and no mandate can clear it." },
    { name: "Judgment", rule: "Hostility, tragedy adjacency, politics, medical and legal claims, and engagement bait all route to a human." },
  ];
}
