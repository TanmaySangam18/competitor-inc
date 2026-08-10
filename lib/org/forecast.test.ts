import { describe, it, expect } from "vitest";
import {
  thirteenWeekCashForecast,
  pipelineForecast,
  renderForecastSection,
  isForecastDay,
  type ForecastInputs,
  type PipelineEntry,
} from "./forecast";

const EM_DASH = /[—–]/; // founder-facing prose rule: no em/en dashes, ever

const BASE: ForecastInputs = {
  cashOnHandUsd: 1000,
  monthlyBurnUsd: 1000,
  // envelope counts at FULL cap (the authorized worst case) → monthly outflow 1300 → weekly 300
  envelopes: [{ department: "growth", monthlyCapUsd: 300, spentThisMonthUsd: 120 }],
  expectedReceipts: [
    { label: "NU pilot invoice", amountUsd: 500, weekIndex: 2, confidence: "committed" },
    { label: "Babson verbal", amountUsd: 10_000, weekIndex: 1, confidence: "likely" },
    { label: "hackathon prize maybe", amountUsd: 700, weekIndex: 0, confidence: "speculative" },
  ],
};

describe("thirteenWeekCashForecast — the survival line counts committed only", () => {
  it("happy path: 13 rows, weekly outflow prorated from burn + envelope caps, running ending cash", () => {
    const f = thirteenWeekCashForecast(BASE);
    expect(f.rows).toHaveLength(13);
    expect(f.weeklyOutflowUsd).toBe(300); // (1000 + 300) * 12 / 52
    expect(f.cashOnHandUsd).toBe(1000);
    expect(f.envelopeCapsUsd).toBe(300);
    // week by week: 700, 400, 400+500-300=600, 300, 0, -300 …
    expect(f.rows[0].endingCashUsd).toBe(700);
    expect(f.rows[1].endingCashUsd).toBe(400);
    expect(f.rows[2].inflowCommittedUsd).toBe(500);
    expect(f.rows[2].endingCashUsd).toBe(600);
    expect(f.rows[4].endingCashUsd).toBe(0);
    expect(f.rows[5].endingCashUsd).toBe(-300);
    expect(f.totalCommittedUsd).toBe(500);
    expect(f.totalLikelyUsd).toBe(10_000);
    expect(f.totalSpeculativeUsd).toBe(700);
  });

  it("HONESTY: likely and speculative inflows never touch ending cash or runway", () => {
    const f = thirteenWeekCashForecast(BASE);
    // the $10k "likely" in week 1 would keep cash positive for the whole quarter if it were counted
    expect(f.rows[1].inflowLikelyUsd).toBe(10_000);
    expect(f.rows[1].endingCashUsd).toBe(400); // committed-only survival line
    expect(f.rows[0].inflowSpeculativeUsd).toBe(700);
    expect(f.rows[0].endingCashUsd).toBe(700); // 1000 − 300, speculative excluded
    expect(f.runwayWeeks).toBe(5); // first negative week is index 5, committed-only
  });

  it("runway edge: burn greater than cash in week 1 → runwayWeeks 0", () => {
    const f = thirteenWeekCashForecast({ cashOnHandUsd: 100, monthlyBurnUsd: 1300, envelopes: [], expectedReceipts: [] });
    expect(f.weeklyOutflowUsd).toBe(300);
    expect(f.rows[0].endingCashUsd).toBe(-200);
    expect(f.runwayWeeks).toBe(0);
  });

  it("cash-positive through all 13 weeks → runwayWeeks null", () => {
    const f = thirteenWeekCashForecast({ cashOnHandUsd: 10_000, monthlyBurnUsd: 1300, envelopes: [], expectedReceipts: [] });
    expect(f.runwayWeeks).toBeNull();
    expect(f.rows[12].endingCashUsd).toBe(10_000 - 13 * 300);
  });

  it("empty/zero inputs stay at zero — nothing invented", () => {
    const f = thirteenWeekCashForecast({ cashOnHandUsd: 0, monthlyBurnUsd: 0, envelopes: [], expectedReceipts: [] });
    expect(f.runwayWeeks).toBeNull(); // zero is not negative; no runway alarm fabricated
    for (const r of f.rows) {
      expect(r.endingCashUsd).toBe(0);
      expect(r.inflowCommittedUsd).toBe(0);
      expect(r.outflowUsd).toBe(0);
    }
  });

  it("receipts outside the 13-week window or with non-positive amounts are excluded", () => {
    const f = thirteenWeekCashForecast({
      cashOnHandUsd: 100,
      monthlyBurnUsd: 0,
      envelopes: [],
      expectedReceipts: [
        { label: "next quarter", amountUsd: 999, weekIndex: 13, confidence: "committed" },
        { label: "negative junk", amountUsd: -50, weekIndex: 1, confidence: "committed" },
        { label: "NaN junk", amountUsd: Number.NaN, weekIndex: 1, confidence: "committed" },
      ],
    });
    expect(f.totalCommittedUsd).toBe(0);
    expect(f.rows[12].endingCashUsd).toBe(100);
  });
});

describe("pipelineForecast — raw totals per stage, no probability weighting", () => {
  const ENTRIES: PipelineEntry[] = [
    { name: "NU", stage: "lead", amountUsd: 1000 },
    { name: "Babson", stage: "lead", amountUsd: 500 },
    { name: "MIT", stage: "qualified", amountUsd: 9000 },
    { name: "BU", stage: "verbal", amountUsd: 250 },
    { name: "won already", stage: "closed", amountUsd: 500 },
  ];

  it("rolls up counts and raw dollar sums per stage in canonical order", () => {
    const p = pipelineForecast(ENTRIES);
    expect(p.stages.map((s) => s.stage)).toEqual(["lead", "qualified", "proposal", "verbal", "closed"]);
    expect(p.stages[0]).toEqual({ stage: "lead", count: 2, totalUsd: 1500 });
    expect(p.stages[1]).toEqual({ stage: "qualified", count: 1, totalUsd: 9000 });
    expect(p.stages[2]).toEqual({ stage: "proposal", count: 0, totalUsd: 0 });
    expect(p.openCount).toBe(4);
    expect(p.openTotalUsd).toBe(10_750); // raw sum — no stage was probability-discounted
    expect(p.closedCount).toBe(1);
    expect(p.closedTotalUsd).toBe(500);
  });

  it("empty pipeline rolls up to zeros", () => {
    const p = pipelineForecast([]);
    expect(p.openCount).toBe(0);
    expect(p.openTotalUsd).toBe(0);
    expect(p.stages.every((s) => s.count === 0 && s.totalUsd === 0)).toBe(true);
  });
});

describe("renderForecastSection — honest founder prose", () => {
  it("renders the populated forecast with the survival caveats", () => {
    const text = renderForecastSection(
      thirteenWeekCashForecast(BASE),
      pipelineForecast([{ name: "NU", stage: "qualified", amountUsd: 9000 }]),
    );
    expect(text).toContain("Cash on hand: $1000.00");
    expect(text).toContain("Weekly outflow: $300.00");
    expect(text).toContain("Only these count toward the survival line.");
    expect(text).toContain("Likely inflows: $10000.00. Shown for context, never counted in ending cash.");
    expect(text).toContain("Runway: 5 full weeks. Cash goes negative in week 6 on committed inflows alone.");
    expect(text).toContain("no probability weighting");
    expect(text).toContain("A raw sum, not a prediction.");
  });

  it("HONESTY: empty inputs render honest empty lines, never fabricated zeros dressed as data", () => {
    const text = renderForecastSection(
      thirteenWeekCashForecast({ cashOnHandUsd: 0, monthlyBurnUsd: 0, envelopes: [], expectedReceipts: [] }),
      pipelineForecast([]),
    );
    expect(text).toContain("No committed inflows in the next 13 weeks.");
    expect(text).toContain("Pipeline: no open deals.");
  });

  it("STYLE: no em-dash or en-dash anywhere in rendered output", () => {
    const populated = renderForecastSection(thirteenWeekCashForecast(BASE), pipelineForecast([
      { name: "NU", stage: "lead", amountUsd: 1000 },
      { name: "won", stage: "closed", amountUsd: 500 },
    ]));
    const empty = renderForecastSection(
      thirteenWeekCashForecast({ cashOnHandUsd: 0, monthlyBurnUsd: 0, envelopes: [], expectedReceipts: [] }),
      pipelineForecast([]),
    );
    expect(populated).not.toMatch(EM_DASH);
    expect(empty).not.toMatch(EM_DASH);
  });
});

describe("isForecastDay — weekly cadence, Mondays UTC", () => {
  it("true on a Monday, false on other days", () => {
    expect(isForecastDay(new Date(Date.UTC(2026, 7, 3, 12)))).toBe(true); // Mon 2026-08-03
    expect(isForecastDay(new Date(Date.UTC(2026, 7, 3, 0)))).toBe(true);
    expect(isForecastDay(new Date(Date.UTC(2026, 7, 4)))).toBe(false); // Tue
    expect(isForecastDay(new Date(Date.UTC(2026, 7, 9)))).toBe(false); // Sun
    expect(isForecastDay(new Date(Date.UTC(2026, 7, 10)))).toBe(true); // next Mon
  });
});
