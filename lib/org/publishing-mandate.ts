// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT PUBLISHING MANDATE (ADR-0012, founder amendment 2026-07-18).
//
// Amends REQUIREMENTS §1's "any public statement is T3/founder": routine outbound — social posts,
// launch listings (HN/PH), scripts, generated video — is now approved INSIDE the owning department,
// by its LEAD, under five rails. The founder keeps the irreducible floor only (money over caps,
// contracts, deletion, pricing, legal statements, prod-deploys of paying customers).
//
// THE FIVE RAILS (all must hold, or the post queues for the founder exactly as before):
//   1. SEPARATION  — the approver is the department lead and is NOT the author (C3: no self-grading).
//   2. HONESTY     — content claims are receipt-backed or labeled simulation (the platformMarketing
//                    gate, generalized). No fabricated numbers, ever — the floor outranks the mandate.
//   3. DISCLOSURE  — the artifact carries the named-AI disclosure (standing rail since 7/08).
//   4. CAPS       — inside the channel's daily cap (runaway-posting containment).
//   5. AUDIENCE   — own/opted-in audience only (never scraped graphs — hard NO, unchanged).
//   6. JUDGMENT   — the content gate (ADR-0025, lib/core/content-gate.ts): receipt-clean prose can
//                   still be cruel, tragedy-adjacent, political, or bait. Any flag ⇒ a HUMAN reviews;
//                   the mandate never clears flagged content, whoever approved it.
// Kill switch and forbidden floor sit ABOVE this mandate and are checked before it, as everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const PUBLISH_KINDS: ReadonlySet<string> = new Set([
  "bluesky", "mastodon", "twitter", "linkedin", "reddit", "hackernews", "producthunt",
  "instagram", "video", "script", "blogpost",
]);

export interface PublishRequest {
  kind: string;
  author: string; // role id of the drafter
  approver: string; // role id of the department lead signing off
  approverIsLead: boolean; // resolved by the caller from the org tree (kept boolean here: pure module)
  honestyVerified: boolean; // claims receipt-backed or explicitly labeled simulation
  disclosed: boolean; // named-AI disclosure present on the artifact
  postsTodayOnChannel: number;
  audience: "own" | "opted_in" | "scraped" | "unknown";
  contentFlags: string[]; // from screenContent() on the artifact's text — [] = judgment-clean
}

export interface MandateVerdict {
  allow: boolean;
  reason: string;
}

export const CHANNEL_DAILY_CAP = 6; // per channel per day — generous for a real team, fatal for a runaway

export function deptSelfApprove(req: PublishRequest): MandateVerdict {
  if (!PUBLISH_KINDS.has(req.kind)) return { allow: false, reason: `${req.kind} is not a publish kind — not this mandate's lane` };
  if (req.audience === "scraped") return { allow: false, reason: "scraped audience — forbidden, no mandate can allow it" };
  if (req.audience === "unknown") return { allow: false, reason: "audience unverified — queue for the founder" };
  if (!req.honestyVerified) return { allow: false, reason: "claims not receipt-backed/simulation-labeled — the honesty floor outranks the mandate" };
  if (!req.disclosed) return { allow: false, reason: "named-AI disclosure missing — required on every outbound artifact" };
  if (!req.approverIsLead) return { allow: false, reason: "approver is not the department lead — queue" };
  if (req.approver === req.author) return { allow: false, reason: "author cannot approve their own post (separation of duties)" };
  if (req.postsTodayOnChannel >= CHANNEL_DAILY_CAP) return { allow: false, reason: `channel daily cap (${CHANNEL_DAILY_CAP}) reached — queue or wait` };
  if (req.contentFlags.length > 0) {
    return { allow: false, reason: `judgment screen flagged: ${req.contentFlags.join(" · ")} — queues for a human, the mandate cannot clear it` };
  }
  return { allow: true, reason: `lead-approved within the department mandate (${req.approver} signed ${req.author}'s ${req.kind})` };
}
