import { describe, it, expect } from "vitest";
import { assertAllowedSource, provenanceRecord, gateCard, planStoryboard, VIDEO_TEMPLATES } from "./video-factory";

const CLEAN = {
  company: "competitor.inc",
  tagline: "the company that runs itself. governed by you.",
  honestLine: "pre-launch. watch us earn the first customer in public.",
  chatLines: ["draft this week's investor update", "on it. pulling the real numbers first."],
};

describe("video factory (ADR-0026) — governed video, $0 marginal", () => {
  it("only allowlisted PD/CC0 collections pass the source gate", () => {
    expect(assertAllowedSource("prelinger").ok).toBe(true);
    const bad = assertAllowedSource("youtube-rips");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toContain("allowlist");
  });

  it("provenance requires identifier + matching URL for every clip; empty videos refused", () => {
    expect(provenanceRecord([]).ok).toBe(false);
    const good = provenanceRecord([
      { identifier: "Office1952", collection: "prelinger", license: "Public Domain (Prelinger Archives)", sourceUrl: "https://archive.org/details/Office1952" },
    ]);
    expect(good.ok).toBe(true);
    expect(good.record).toContain("Office1952");
    const incomplete = provenanceRecord([
      { identifier: "X", collection: "prelinger", license: "PD", sourceUrl: "https://archive.org/details/other" },
    ]);
    expect(incomplete.ok).toBe(false);
  });

  it("cards with unreceipted metric/money claims are blocked; receipt marker unblocks", () => {
    const blocked = gateCard("Trusted by 10,000 customers and $2M revenue");
    expect(blocked.ok).toBe(false);
    expect(gateCard("Settled revenue this month: $49 [receipt: 9f3a2c]").ok).toBe(true);
    expect(gateCard("the company that runs itself").ok).toBe(true);
  });

  it("judgment gate rides along: hostile/tragedy cards are flagged out of videos too", () => {
    const r = gateCard("Their layoffs are your opportunity");
    expect(r.ok).toBe(false);
  });

  it("storyboards come from templates only, carry the AI disclosure, and cap at 60s", () => {
    expect(planStoryboard("freeform-anything", CLEAN).ok).toBe(false);
    for (const t of VIDEO_TEMPLATES) {
      const r = planStoryboard(t, CLEAN);
      expect(r.ok, t).toBe(true);
      if (r.ok) {
        expect(r.board.totalSeconds).toBeLessThanOrEqual(60);
        const end = r.board.shots[r.board.shots.length - 1];
        expect(end.text).toContain("made by AI agents");
      }
    }
    const tooLong = planStoryboard("teletype-story", { ...CLEAN, chatLines: Array(50).fill("a line of chat") });
    expect(tooLong.ok).toBe(false);
  });

  it("a dishonest input poisons the whole board, not just the one card", () => {
    const r = planStoryboard("eras-trailer", { ...CLEAN, tagline: "already serving 500 companies" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join()).toContain("receipt");
  });
});
