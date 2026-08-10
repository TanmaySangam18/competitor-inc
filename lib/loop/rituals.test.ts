import { describe, it, expect } from "vitest";
import { runRituals } from "./rituals";
import type { SupabaseClient } from "@supabase/supabase-js";

// A Supabase stand-in: every table read returns rows we control, so cadence behaviour is testable
// offline with zero network. `throws` lets us prove the fail-soft contract.
function fakeSb(rows: Record<string, unknown[]> = {}, throws = false): SupabaseClient {
  const api = {
    from(table: string) {
      if (throws) throw new Error(`boom: ${table}`);
      const result = { data: rows[table] ?? [], error: null };
      const chain: Record<string, unknown> = {
        select: () => chain,
        limit: () => Promise.resolve(result),
        then: (r: (v: typeof result) => unknown) => Promise.resolve(result).then(r),
      };
      return chain;
    },
  };
  return api as unknown as SupabaseClient;
}

// Known-good cadence dates (UTC): 2026-08-10 is a Monday; 2026-09-01 is the 1st (a Tuesday);
// 2027-01-04 is the first Monday of January (quarter start + Monday = every ritual at once).
const MONDAY = new Date("2026-08-10T07:00:00Z");
const FIRST_OF_MONTH = new Date("2026-09-01T07:00:00Z");
const QUARTER_MONDAY = new Date("2027-01-04T07:00:00Z");
const PLAIN_TUESDAY = new Date("2026-08-11T07:00:00Z");

describe("runRituals — cadence gating", () => {
  it("fires the forecast on Mondays", async () => {
    const r = await runRituals(fakeSb(), { now: MONDAY });
    expect(r.fired).toContain("forecast");
    expect(r.sections.join("\n")).toContain("FORECAST (weekly)");
  });

  it("does NOT fire the forecast on a plain Tuesday", async () => {
    const r = await runRituals(fakeSb(), { now: PLAIN_TUESDAY });
    expect(r.fired).not.toContain("forecast");
  });

  it("fires the close and the evidence log on the 1st", async () => {
    const r = await runRituals(fakeSb(), { now: FIRST_OF_MONTH });
    expect(r.fired).toContain("close");
    expect(r.fired).toContain("evidence");
    const text = r.sections.join("\n");
    expect(text).toContain("MONTHLY CLOSE");
    expect(text).toContain("not SOC 2 certified"); // the mandatory header survives the wiring
  });

  it("fires the agent review on the first Monday of a quarter", async () => {
    const r = await runRituals(fakeSb(), { now: QUARTER_MONDAY });
    expect(r.fired).toContain("agent-review");
    expect(r.sections.join("\n")).toContain("AGENT REVIEW CYCLE");
  });
});

describe("runRituals — honesty contract", () => {
  it("reports the close of the PREVIOUS month, and states zero plainly when there is no revenue", async () => {
    const r = await runRituals(fakeSb({ revenue_events: [] }), { now: FIRST_OF_MONTH });
    const close = r.sections.find((s) => s.startsWith("MONTHLY CLOSE"))!;
    expect(close).toContain("2026-08"); // August closes on September 1st
    expect(close).toContain("Zero is the real number");
  });

  it("names the unconnected legs instead of faking a three-way match", async () => {
    const r = await runRituals(fakeSb(), { now: FIRST_OF_MONTH });
    const gaps = r.gaps.join(" ");
    expect(gaps).toMatch(/settlement export is not connected/i);
    expect(gaps).toMatch(/bank readout is not connected/i);
  });

  it("refuses to print a runway line when cash on hand is unknown", async () => {
    const prev = process.env.TREASURY_CASH_ON_HAND_USD;
    delete process.env.TREASURY_CASH_ON_HAND_USD;
    const r = await runRituals(fakeSb(), { now: MONDAY });
    const fc = r.sections.find((s) => s.startsWith("FORECAST"))!;
    expect(fc).toContain("not computed");
    expect(r.gaps.join(" ")).toMatch(/Cash on hand is not connected/i);
    if (prev !== undefined) process.env.TREASURY_CASH_ON_HAND_USD = prev;
  });

  it("stays silent on retention while there are no customers (never invents a cohort)", async () => {
    const r = await runRituals(fakeSb(), { now: MONDAY });
    expect(r.fired).not.toContain("retention");
    expect(r.sections.join("\n")).not.toContain("RETENTION DESK");
  });

  it("queues a human-run drill as a recommendation, with steps and no claim of a passing run", async () => {
    const r = await runRituals(fakeSb(), { now: PLAIN_TUESDAY });
    expect(r.escalations.length).toBeGreaterThan(0);
    const esc = r.escalations[0];
    expect(esc.title).toMatch(/drill/i);
    expect(esc.artifact).toContain("not yet run");
    expect(esc.artifact).toMatch(/human-run drill/i);
  });

  it("emits no em-dashes in any ritual output (founder-facing prose rule)", async () => {
    for (const now of [MONDAY, FIRST_OF_MONTH, QUARTER_MONDAY, PLAIN_TUESDAY]) {
      const r = await runRituals(fakeSb(), { now });
      const all = [...r.sections, ...r.gaps, ...r.escalations.flatMap((e) => [e.title, e.summary, e.artifact])].join("\n");
      expect(all).not.toMatch(/[—–]/);
    }
  });
});

describe("runRituals — fail soft", () => {
  it("never throws when every database read fails", async () => {
    const r = await runRituals(fakeSb({}, true), { now: QUARTER_MONDAY });
    expect(Array.isArray(r.fired)).toBe(true);
    expect(Array.isArray(r.sections)).toBe(true); // degraded, not crashed
  });
});
