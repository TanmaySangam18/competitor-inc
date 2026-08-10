import { describe, it, expect } from "vitest";
import { lossReviewPrompt, winLossReport, MIN_DEALS_FOR_RATE, type DealOutcome } from "./winloss";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
const SINCE = NOW - 90 * DAY;

const deal = (over: Partial<DealOutcome>): DealOutcome => ({
  dealId: "d-1",
  name: "Northeastern pilot",
  outcome: "lost",
  amountUsd: 12000,
  reason: "budget freeze",
  decidedAt: NOW - DAY,
  ...over,
});

const EM_DASH = /[—–]/;

describe("winLossReport — counts always, a rate only when it means something", () => {
  it("empty ⇒ the armed line, no counts dressed up as insight", () => {
    const r = winLossReport([], { sinceMs: SINCE });
    expect(r.total).toBe(0);
    expect(r.winRatePct).toBeNull();
    expect(r.text).toBe("No decided deals yet. This report arms itself at the first close.");
  });

  it("below the 5-deal floor: counts reported, NO rate anywhere", () => {
    const r = winLossReport(
      [deal({ dealId: "d-1", outcome: "won" }), deal({ dealId: "d-2" }), deal({ dealId: "d-3" })],
      { sinceMs: SINCE },
    );
    expect(r.total).toBe(3);
    expect(r.won).toBe(1);
    expect(r.lost).toBe(2);
    expect(r.winRatePct).toBeNull();
    expect(r.rateLine).toBe("3 decided deals so far, too few for a rate.");
    expect(r.text).not.toMatch(/%/); // no percentage leaks into the rendering below the floor
  });

  it("at the floor: the rate appears, computed honestly", () => {
    const outcomes = [
      deal({ dealId: "d-1", outcome: "won", amountUsd: 10000 }),
      deal({ dealId: "d-2", outcome: "won", amountUsd: 5000 }),
      deal({ dealId: "d-3", outcome: "won", amountUsd: 1000 }),
      deal({ dealId: "d-4", outcome: "lost", amountUsd: 8000 }),
      deal({ dealId: "d-5", outcome: "lost", amountUsd: 2000 }),
    ];
    expect(outcomes.length).toBe(MIN_DEALS_FOR_RATE);
    const r = winLossReport(outcomes, { sinceMs: SINCE });
    expect(r.winRatePct).toBe(60);
    expect(r.rateLine).toBe("Win rate: 60% (3 of 5 decided deals).");
    expect(r.wonUsd).toBe(16000);
    expect(r.lostUsd).toBe(10000);
  });

  it("loss reasons ranked by count, competitor mentions tallied, ties broken deterministically", () => {
    const r = winLossReport(
      [
        deal({ dealId: "d-1", reason: "price", competitor: "Cofounder" }),
        deal({ dealId: "d-2", reason: "Price", competitor: "Viktor" }),
        deal({ dealId: "d-3", reason: "no security review", competitor: "Cofounder" }),
        deal({ dealId: "d-4", reason: "timing" }),
        deal({ dealId: "d-5", outcome: "won", reason: "receipts", competitor: "Viktor" }),
        deal({ dealId: "d-6", outcome: "won", reason: "receipts" }),
      ],
      { sinceMs: SINCE },
    );
    expect(r.topLossReasons[0]).toEqual({ label: "price", count: 2 }); // case-insensitive grouping
    expect(r.topLossReasons.map((x) => x.label)).toEqual(["price", "no security review", "timing"]);
    expect(r.competitorMentions).toEqual([
      { label: "Cofounder", count: 2 },
      { label: "Viktor", count: 2 },
    ]); // tie ⇒ alphabetical, and won-deal mentions count too
  });

  it("the sinceMs window is real: older decisions fall out", () => {
    const r = winLossReport([deal({ decidedAt: SINCE - 1 }), deal({ dealId: "d-2", decidedAt: SINCE + 1 })], { sinceMs: SINCE });
    expect(r.total).toBe(1);
  });
});

describe("lossReviewPrompt — the 5-question debrief, claim-free", () => {
  it("exactly five questions, referencing the deal, asking rather than asserting", () => {
    const review = lossReviewPrompt(deal({ competitor: "Cofounder" }))!;
    expect(review.questions).toHaveLength(5);
    expect(review.questions[0]).toContain("Why did we lose Northeastern pilot?");
    expect(review.questions[2]).toContain("Cofounder");
    expect(review.questions[4]).toContain("qualified");
    // claim-free: every question ends in a question mark or invites pointing at evidence
    expect(review.text).toContain("deal d-1");
    for (const q of review.questions) expect(q).toMatch(/\?/);
  });

  it("no competitor named ⇒ the who-won question asks instead of assuming", () => {
    const review = lossReviewPrompt(deal({}))!;
    expect(review.questions[2]).toContain("Who won it instead");
  });

  it("won deals return null: there is no loss to review", () => {
    expect(lossReviewPrompt(deal({ outcome: "won" }))).toBeNull();
  });
});

describe("honesty rails — no em-dashes in any rendered string", () => {
  it("reports and reviews render em-dash free", () => {
    const rendered: string[] = [];
    rendered.push(winLossReport([], { sinceMs: SINCE }).text);
    rendered.push(winLossReport([deal({}), deal({ dealId: "d-2", outcome: "won", competitor: "Viktor" })], { sinceMs: SINCE }).text);
    rendered.push(
      winLossReport(
        [1, 2, 3, 4, 5].map((n) => deal({ dealId: `d-${n}`, outcome: n <= 2 ? "won" : "lost", competitor: "Cofounder" })),
        { sinceMs: SINCE },
      ).text,
    );
    const review = lossReviewPrompt(deal({ competitor: "Cofounder" }))!;
    rendered.push(review.text, review.intro, ...review.questions);
    expect(rendered.length).toBeGreaterThan(5);
    for (const s of rendered) expect(s).not.toMatch(EM_DASH);
  });
});
