import { describe, it, expect } from "vitest";
import { draftColdOutreach, evaluateOutreach } from "./outreach";

const seller = { name: "Plantly", idea: "a marketplace for rare houseplants", link: "https://plantly.example" };

describe("cold outreach drafting (Predictable Revenue)", () => {
  const draft = draftColdOutreach(seller, { name: "Dana Lee", company: "GreenThumb Co", hook: "Saw GreenThumb just expanded its plant line." });

  it("personalizes (first name + their company + hook) and attributes to competitor.inc", () => {
    expect(draft.body).toContain("Hi Dana");
    expect(draft.body).toContain("GreenThumb Co");
    expect(draft.body).toContain("competitor.inc");
    expect(draft.subject).toContain("GreenThumb Co");
  });

  it("includes an opt-out + a single response path (CAN-SPAM)", () => {
    expect(draft.body.toLowerCase()).toContain("stop");
    expect(evaluateOutreach(draft).pass).toBe(true);
  });

  it("evaluator rejects no-opt-out, spammy, or blast-length drafts", () => {
    expect(evaluateOutreach({ subject: "hi", body: "buy now from competitor.inc, reply no" }).pass).toBe(false); // no opt-out
    expect(evaluateOutreach({ subject: "WINNER!!!", body: "GUARANTEED free money competitor.inc unsubscribe reply no" }).pass).toBe(false);
    expect(evaluateOutreach({ subject: "hi", body: "x".repeat(1000) + " competitor.inc unsubscribe reply no" }).pass).toBe(false);
  });
});
