import { describe, it, expect } from "vitest";
import { emptyQueue, enqueue, type EnqueueInput } from "./decision-queue";
import {
  closeTheLoop,
  csatSummary,
  npsSegment,
  npsSummary,
  MIN_RESPONSES_FOR_SCORE,
  type CsatResponse,
  type NpsResponse,
  type TestimonialAsk,
} from "./nps";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
const SINCE = NOW - 30 * DAY;

const nps = (score: number, over: Partial<NpsResponse> = {}): NpsResponse => ({
  customerId: "cust-1",
  score,
  at: NOW - DAY,
  ...over,
});
const csat = (score: number, over: Partial<CsatResponse> = {}): CsatResponse => ({
  customerId: "cust-1",
  score,
  at: NOW - DAY,
  ...over,
});

const EM_DASH = /[—–]/;

describe("npsSummary — counts always, the number only past the 5-response floor", () => {
  it("empty ⇒ the armed line, never a score", () => {
    const s = npsSummary([], { sinceMs: SINCE });
    expect(s.n).toBe(0);
    expect(s.nps).toBeNull();
    expect(s.line).toBe("No NPS responses yet. This summary arms itself at the first response.");
  });

  it("below the floor: counts by segment, NO NPS number anywhere (two 10s are not 'NPS 100')", () => {
    const s = npsSummary([nps(10), nps(10)], { sinceMs: SINCE });
    expect(s.n).toBe(2);
    expect(s.promoters).toBe(2);
    expect(s.nps).toBeNull();
    expect(s.line).toContain("2 responses so far");
    expect(s.line).toContain("Too few for an NPS number");
    expect(s.line).not.toMatch(/NPS \d/);
  });

  it("at the floor: the standard cut and the honest number", () => {
    const s = npsSummary([nps(10), nps(9), nps(8), nps(7), nps(3)], { sinceMs: SINCE });
    expect(s.n).toBe(MIN_RESPONSES_FOR_SCORE);
    expect(s).toMatchObject({ promoters: 2, passives: 2, detractors: 1 });
    expect(s.nps).toBe(20); // (2 - 1) / 5 * 100
    expect(s.line).toBe("NPS 20 from 5 responses (promoters 2, passives 2, detractors 1).");
  });

  it("window + validity: old responses and out-of-range scores are dropped, not rounded in", () => {
    const s = npsSummary(
      [nps(10, { at: SINCE - 1 }), nps(11), nps(-1), nps(7.5), nps(9)],
      { sinceMs: SINCE },
    );
    expect(s.n).toBe(1);
    expect(s.promoters).toBe(1);
  });

  it("segments cut at the standard boundaries", () => {
    expect(npsSegment(9)).toBe("promoter");
    expect(npsSegment(8)).toBe("passive");
    expect(npsSegment(7)).toBe("passive");
    expect(npsSegment(6)).toBe("detractor");
    expect(npsSegment(0)).toBe("detractor");
  });
});

describe("csatSummary — the 1..5 variant, same floor", () => {
  it("empty ⇒ armed line; below floor ⇒ counts only, no percentage", () => {
    expect(csatSummary([], { sinceMs: SINCE }).line).toBe("No CSAT responses yet. This summary arms itself at the first response.");
    const s = csatSummary([csat(5), csat(4), csat(1)], { sinceMs: SINCE });
    expect(s.n).toBe(3);
    expect(s.csatPct).toBeNull();
    expect(s.line).toContain("Too few for a CSAT percentage");
    expect(s.line).not.toMatch(/%/);
  });

  it("at the floor: satisfied = 4..5, the percentage appears", () => {
    const s = csatSummary([csat(5), csat(4), csat(3), csat(2), csat(1)], { sinceMs: SINCE });
    expect(s).toMatchObject({ n: 5, satisfied: 2, neutral: 1, dissatisfied: 2 });
    expect(s.csatPct).toBe(40);
    expect(s.line).toBe("CSAT 40% from 5 responses (satisfied 2, neutral 1, dissatisfied 2).");
  });

  it("out-of-range CSAT scores (0, 6) are dropped", () => {
    const s = csatSummary([csat(0), csat(6), csat(5)], { sinceMs: SINCE });
    expect(s.n).toBe(1);
  });
});

describe("closeTheLoop — every response gets the right follow-up, nothing automatic", () => {
  it("detractor ⇒ EnqueueInput for the founder with who, score, comment, proposed follow-up", () => {
    const action = closeTheLoop(nps(2, { comment: "the build broke twice" })) as EnqueueInput;
    expect(action).not.toBeNull();
    expect(action.kind).toBe("other");
    expect(action.preparedBy).toBe("nps-desk");
    expect(action.title).toBe("NPS detractor: customer cust-1 scored 2 of 10");
    expect(action.summary).toContain("cust-1");
    expect(action.summary).toContain("the build broke twice");
    expect(action.artifact).toContain("Score: 2 out of 10.");
    expect(action.artifact).toContain("Proposed follow-up");
    expect(action.artifact).toContain("Nothing sends until you approve.");
    // the real decision queue accepts it as-is
    const q = enqueue(emptyQueue(), action, { now: NOW, id: "d1" });
    expect(q.items[0].status).toBe("pending");
  });

  it("detractor without a comment says so honestly instead of inventing one", () => {
    const action = closeTheLoop(nps(0)) as EnqueueInput;
    expect(action.artifact).toContain("They left no comment.");
    expect(action.summary).toContain("No comment left.");
  });

  it("promoter ⇒ a human-approved testimonial-ask SUGGESTION, never an action", () => {
    const action = closeTheLoop(nps(10)) as TestimonialAsk;
    expect(action).toEqual({
      kind: "ask-testimonial",
      customerId: "cust-1",
      note: expect.stringContaining("requires human approval and is never sent automatically"),
    });
  });

  it("passive (7..8) ⇒ null; invalid scores ⇒ null (we do not act on data we would not count)", () => {
    expect(closeTheLoop(nps(7))).toBeNull();
    expect(closeTheLoop(nps(8))).toBeNull();
    expect(closeTheLoop(nps(11))).toBeNull();
    expect(closeTheLoop(nps(6.5))).toBeNull();
  });

  it("boundaries: 6 escalates, 9 suggests the ask", () => {
    expect((closeTheLoop(nps(6)) as EnqueueInput).kind).toBe("other");
    expect((closeTheLoop(nps(9)) as TestimonialAsk).kind).toBe("ask-testimonial");
  });
});

describe("honesty rails — no em-dashes in any rendered string", () => {
  it("summaries, escalations, and suggestions render em-dash free", () => {
    const rendered: string[] = [];
    rendered.push(npsSummary([], { sinceMs: SINCE }).line);
    rendered.push(npsSummary([nps(10), nps(2)], { sinceMs: SINCE }).line);
    rendered.push(npsSummary([nps(10), nps(9), nps(8), nps(7), nps(3)], { sinceMs: SINCE }).line);
    rendered.push(csatSummary([], { sinceMs: SINCE }).line);
    rendered.push(csatSummary([csat(5), csat(4), csat(3), csat(2), csat(1)], { sinceMs: SINCE }).line);
    const det = closeTheLoop(nps(1, { comment: "too slow" })) as EnqueueInput;
    rendered.push(det.title, det.summary, det.artifact);
    rendered.push((closeTheLoop(nps(10)) as TestimonialAsk).note);
    expect(rendered.length).toBeGreaterThan(5);
    for (const s of rendered) expect(s).not.toMatch(EM_DASH);
  });
});
