// ─────────────────────────────────────────────────────────────────────────────
// lib/org/winloss.ts — WIN/LOSS ANALYSIS (customer lifetime, armed before the first close).
//
// Purpose: the sales desk's memory. Every decided deal (won or lost) lands here; the report ranks
// loss reasons, tallies competitor mentions, and states a win rate ONLY when there is enough data
// for the rate to mean something. The loss-review prompt is the structured 5-question debrief the
// sales agent runs after each loss, so the reason recorded is the real one.
//
// Rails (the honesty floor, non-negotiable):
//   · ZERO decided deals today — the empty report says exactly that ("arms itself at the first
//     close"), never a placeholder rate.
//   · A win rate below 5 decided deals is noise dressed as signal: below 5 we report the COUNT
//     ("3 decided deals so far, too few for a rate."), never a percentage.
//   · The loss review is claim-free: it asks, it never asserts what happened.
//   · Pure functions, injected window, no I/O. Rendered strings carry no em-dashes.
// ─────────────────────────────────────────────────────────────────────────────

export interface DealOutcome {
  dealId: string;
  name: string; // the deal / account name, e.g. "Northeastern pilot"
  outcome: "won" | "lost";
  amountUsd: number;
  reason: string; // the one-line why, as recorded by the loss review or the close note
  competitor?: string; // who we were up against, when known
  decidedAt: number; // epoch ms
}

// Rates need a floor to be honest. Below this we report counts only.
export const MIN_DEALS_FOR_RATE = 5;

export interface RankedCount {
  label: string;
  count: number;
}

export interface WinLossReport {
  sinceMs: number;
  total: number;
  won: number;
  lost: number;
  wonUsd: number;
  lostUsd: number;
  winRatePct: number | null; // whole percent, ONLY when total >= MIN_DEALS_FOR_RATE
  rateLine: string; // the honest sentence either way
  topLossReasons: RankedCount[]; // ranked by count desc, then alphabetically (deterministic)
  competitorMentions: RankedCount[]; // tallied across all decided deals that named one
  lines: string[];
  text: string; // the rendered report block
}

const EMPTY_REPORT_LINE = "No decided deals yet. This report arms itself at the first close.";

// Group by a normalized key but display the first-seen original text (deterministic, readable).
function tally(values: string[]): RankedCount[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    const row = counts.get(key);
    if (row) row.count += 1;
    else counts.set(key, { label: trimmed, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * The win/loss report over deals decided since `sinceMs`. Counts always; the rate only past the
 * 5-deal floor; loss reasons ranked; competitor mentions tallied. Empty input renders the armed line.
 */
export function winLossReport(outcomes: DealOutcome[], opts: { sinceMs: number }): WinLossReport {
  const inWindow = outcomes.filter((o) => o.decidedAt >= opts.sinceMs);
  const won = inWindow.filter((o) => o.outcome === "won");
  const lost = inWindow.filter((o) => o.outcome === "lost");
  const total = inWindow.length;

  if (total === 0) {
    return {
      sinceMs: opts.sinceMs,
      total: 0,
      won: 0,
      lost: 0,
      wonUsd: 0,
      lostUsd: 0,
      winRatePct: null,
      rateLine: EMPTY_REPORT_LINE,
      topLossReasons: [],
      competitorMentions: [],
      lines: [EMPTY_REPORT_LINE],
      text: EMPTY_REPORT_LINE,
    };
  }

  const wonUsd = won.reduce((sum, o) => sum + o.amountUsd, 0);
  const lostUsd = lost.reduce((sum, o) => sum + o.amountUsd, 0);

  const winRatePct = total >= MIN_DEALS_FOR_RATE ? Math.round((won.length / total) * 100) : null;
  const rateLine =
    winRatePct === null
      ? `${total} decided ${total === 1 ? "deal" : "deals"} so far, too few for a rate.`
      : `Win rate: ${winRatePct}% (${won.length} of ${total} decided deals).`;

  const topLossReasons = tally(lost.map((o) => o.reason));
  const competitorMentions = tally(inWindow.flatMap((o) => (o.competitor ? [o.competitor] : [])));

  const lines = [
    `Win/loss report.`,
    `Decided: ${total} (${won.length} won for ${usd(wonUsd)}, ${lost.length} lost worth ${usd(lostUsd)}).`,
    rateLine,
    ...(topLossReasons.length
      ? [`Top loss reasons:`, ...topLossReasons.map((r, i) => `${i + 1}. ${r.label} (${r.count})`)]
      : [`No losses recorded in this window.`]),
    ...(competitorMentions.length
      ? [`Competitors named:`, ...competitorMentions.map((c) => `- ${c.label} (${c.count})`)]
      : [`No competitors named in this window.`]),
  ];

  return {
    sinceMs: opts.sinceMs,
    total,
    won: won.length,
    lost: lost.length,
    wonUsd,
    lostUsd,
    winRatePct,
    rateLine,
    topLossReasons,
    competitorMentions,
    lines,
    text: lines.join("\n"),
  };
}

// ── Loss review ───────────────────────────────────────────────────────────────

export interface LossReview {
  dealId: string;
  intro: string;
  questions: string[]; // exactly 5, claim-free, in the order they should be asked
  text: string;
}

/**
 * The structured 5-question review the sales agent runs after each loss. Questions only, no claims:
 * the review exists to get the TRUE reason recorded, not to defend the pitch. Won deals return null
 * (there is nothing to review here; celebrate elsewhere).
 */
export function lossReviewPrompt(outcome: DealOutcome): LossReview | null {
  if (outcome.outcome !== "lost") return null;
  const intro = `Loss review for ${outcome.name} (deal ${outcome.dealId}, ${usd(outcome.amountUsd)}). Answer plainly, the honest answer is the useful one.`;
  const questions = [
    `Why did we lose ${outcome.name}? Name the real reason, not the polite one.`,
    `When in the process did we actually lose it? Point to the moment.`,
    outcome.competitor
      ? `They chose ${outcome.competitor}. What did ${outcome.competitor} have that we did not?`
      : `Who won it instead, and what did they have that we did not?`,
    `What single change on our side would have flipped the outcome?`,
    `Was this deal ever qualified, or should we not have chased it at all?`,
  ];
  return { dealId: outcome.dealId, intro, questions, text: [intro, ...questions.map((q, i) => `${i + 1}. ${q}`)].join("\n") };
}
