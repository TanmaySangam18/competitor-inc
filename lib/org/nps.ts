// ─────────────────────────────────────────────────────────────────────────────
// lib/org/nps.ts — NPS / CSAT + CLOSE-THE-LOOP (customer lifetime, armed before response #1).
//
// Purpose: measure whether customers would recommend us (NPS 0..10) or were satisfied (CSAT 1..5),
// and close the loop on every response: a detractor becomes a PREPARED founder decision (an
// EnqueueInput returned to the caller, never enqueued here), a promoter becomes a human-approved
// testimonial-ask suggestion, a passive gets no automated follow-up.
//
// Rails (the honesty floor, non-negotiable):
//   · ZERO responses today — summaries say so plainly ("arms itself at the first response").
//   · Below 5 responses NO score is reported as a number, only the counts. A 2-response NPS of
//     "100" would be a fabricated brag; we refuse to compute one for anyone to quote.
//   · Testimonial asks are ALWAYS human-approved, never sent automatically (a suggestion object,
//     not an action).
//   · Out-of-range or non-integer scores are dropped, not rounded into the data.
//   · Pure functions, injected window. Rendered strings carry no em-dashes.
// ─────────────────────────────────────────────────────────────────────────────

import type { EnqueueInput } from "./decision-queue";

// Scores need a floor to be honest numbers. Below this we report counts only.
export const MIN_RESPONSES_FOR_SCORE = 5;

// ── NPS ───────────────────────────────────────────────────────────────────────

export interface NpsResponse {
  customerId: string;
  score: number; // 0..10 integer; anything else is dropped by the summary
  comment?: string;
  at: number; // epoch ms
}

export type NpsSegment = "promoter" | "passive" | "detractor";

/** The standard cut: 9..10 promoter, 7..8 passive, 0..6 detractor. */
export function npsSegment(score: number): NpsSegment {
  return score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor";
}

export interface NpsSummary {
  n: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number | null; // rounded (promoters - detractors) / n * 100, ONLY when n >= MIN_RESPONSES_FOR_SCORE
  line: string; // the honest sentence either way
}

const NPS_ARMED_LINE = "No NPS responses yet. This summary arms itself at the first response.";

const validNps = (r: NpsResponse) => Number.isInteger(r.score) && r.score >= 0 && r.score <= 10;

/**
 * Summarize NPS responses received since `sinceMs`. Counts always; the NPS number only past the
 * 5-response floor. Empty input renders the armed line, never a score.
 */
export function npsSummary(responses: NpsResponse[], opts: { sinceMs: number }): NpsSummary {
  const inWindow = responses.filter((r) => r.at >= opts.sinceMs && validNps(r));
  const n = inWindow.length;
  const promoters = inWindow.filter((r) => npsSegment(r.score) === "promoter").length;
  const passives = inWindow.filter((r) => npsSegment(r.score) === "passive").length;
  const detractors = inWindow.filter((r) => npsSegment(r.score) === "detractor").length;

  if (n === 0) return { n: 0, promoters: 0, passives: 0, detractors: 0, nps: null, line: NPS_ARMED_LINE };

  if (n < MIN_RESPONSES_FOR_SCORE) {
    return {
      n,
      promoters,
      passives,
      detractors,
      nps: null,
      line: `${n} ${n === 1 ? "response" : "responses"} so far (promoters ${promoters}, passives ${passives}, detractors ${detractors}). Too few for an NPS number, the score unlocks at ${MIN_RESPONSES_FOR_SCORE} responses.`,
    };
  }

  const nps = Math.round(((promoters - detractors) / n) * 100);
  return {
    n,
    promoters,
    passives,
    detractors,
    nps,
    line: `NPS ${nps} from ${n} responses (promoters ${promoters}, passives ${passives}, detractors ${detractors}).`,
  };
}

// ── CSAT ──────────────────────────────────────────────────────────────────────

export interface CsatResponse {
  customerId: string;
  score: number; // 1..5 integer; anything else is dropped by the summary
  comment?: string;
  at: number; // epoch ms
}

export interface CsatSummary {
  n: number;
  satisfied: number; // 4..5
  neutral: number; // 3
  dissatisfied: number; // 1..2
  csatPct: number | null; // rounded satisfied / n * 100, ONLY when n >= MIN_RESPONSES_FOR_SCORE
  line: string;
}

const CSAT_ARMED_LINE = "No CSAT responses yet. This summary arms itself at the first response.";

const validCsat = (r: CsatResponse) => Number.isInteger(r.score) && r.score >= 1 && r.score <= 5;

/** The CSAT variant: 1..5 scale, satisfied = 4..5, same 5-response floor before any percentage. */
export function csatSummary(responses: CsatResponse[], opts: { sinceMs: number }): CsatSummary {
  const inWindow = responses.filter((r) => r.at >= opts.sinceMs && validCsat(r));
  const n = inWindow.length;
  const satisfied = inWindow.filter((r) => r.score >= 4).length;
  const neutral = inWindow.filter((r) => r.score === 3).length;
  const dissatisfied = inWindow.filter((r) => r.score <= 2).length;

  if (n === 0) return { n: 0, satisfied: 0, neutral: 0, dissatisfied: 0, csatPct: null, line: CSAT_ARMED_LINE };

  if (n < MIN_RESPONSES_FOR_SCORE) {
    return {
      n,
      satisfied,
      neutral,
      dissatisfied,
      csatPct: null,
      line: `${n} ${n === 1 ? "response" : "responses"} so far (satisfied ${satisfied}, neutral ${neutral}, dissatisfied ${dissatisfied}). Too few for a CSAT percentage, the score unlocks at ${MIN_RESPONSES_FOR_SCORE} responses.`,
    };
  }

  const csatPct = Math.round((satisfied / n) * 100);
  return {
    n,
    satisfied,
    neutral,
    dissatisfied,
    csatPct,
    line: `CSAT ${csatPct}% from ${n} responses (satisfied ${satisfied}, neutral ${neutral}, dissatisfied ${dissatisfied}).`,
  };
}

// ── Close the loop ────────────────────────────────────────────────────────────

export interface TestimonialAsk {
  kind: "ask-testimonial";
  customerId: string;
  note: string; // why we are suggesting the ask; a human approves and sends, never automatic
}

export type LoopAction = EnqueueInput | TestimonialAsk | null;

/**
 * Close the loop on one NPS response:
 *   detractor (0..6)  → an EnqueueInput for the founder (who, score, their comment, the proposed
 *                       follow-up). Returned, not enqueued; the caller feeds the decision queue.
 *   promoter (9..10)  → a TestimonialAsk SUGGESTION. Human-approved, never sent automatically.
 *   passive (7..8)    → null. No automated follow-up for a shrug.
 * Invalid scores → null (we do not act on data we would not count).
 */
export function closeTheLoop(response: NpsResponse): LoopAction {
  if (!Number.isInteger(response.score) || response.score < 0 || response.score > 10) return null;
  const segment = npsSegment(response.score);

  if (segment === "detractor") {
    const comment = response.comment?.trim();
    const artifact = [
      `Detractor follow-up, prepared for the founder.`,
      `Who: customer ${response.customerId}.`,
      `Score: ${response.score} out of 10.`,
      comment ? `Their comment: "${comment}"` : `They left no comment. The call below is where we learn why.`,
      `Proposed follow-up: the founder replies personally within 24 hours, asks what broke, and offers a 20 minute call this week. No template, no defense, just listen and fix one named thing.`,
      `Nothing sends until you approve. A human makes the contact.`,
    ].join("\n");
    return {
      kind: "other",
      title: `NPS detractor: customer ${response.customerId} scored ${response.score} of 10`,
      summary: `Customer ${response.customerId} scored us ${response.score} out of 10.${comment ? ` Their comment: "${comment}"` : " No comment left."} Proposed: a personal founder reply within 24 hours plus a short call.`,
      artifact,
      preparedBy: "nps-desk",
    };
  }

  if (segment === "promoter") {
    return {
      kind: "ask-testimonial",
      customerId: response.customerId,
      note: `Customer ${response.customerId} scored ${response.score} of 10. Suggest asking for a short testimonial while the win is fresh. This ask requires human approval and is never sent automatically.`,
    };
  }

  return null; // passive
}
