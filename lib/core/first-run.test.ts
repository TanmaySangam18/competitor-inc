import { describe, it, expect } from "vitest";
import { railPlan, CONNECT_RAIL } from "./connect-rail";
import { connectionStatus, connectionMapStatus, CONNECTIONS } from "./connections";

// FIRST-RUN CONTRACT — the guarantee we owe the first person who is not the founder.
//
// Zero customers have ever completed onboarding. So the thing most likely to embarrass us is not a
// crash, it is a lie: a rail that claims something is connected when it is not, a step with no guide
// that sends the user hunting docs, or a "minutes remaining" number invented rather than summed.
// Every test here runs against a COMPLETELY EMPTY env, which is exactly what a stranger arrives with.

const EMPTY: Record<string, string | undefined> = {}; // a brand-new user, nothing configured

describe("first run: nothing is claimed that is not true", () => {
  it("reports every rail step as unconfigured when the env is empty", () => {
    const plan = railPlan("customer", EMPTY);
    expect(plan.steps.length).toBe(CONNECT_RAIL.length);
    for (const step of plan.steps) {
      expect(step.configured, `step ${step.connectionId} claimed configured on an empty env`).toBe(false);
    }
    expect(plan.done).toBe(false);
  });

  it("never reports a connection as configured when its env vars are absent", () => {
    for (const c of connectionStatus(undefined, EMPTY)) {
      expect(c.configured, `${c.id} claimed configured with no env`).toBe(false);
    }
  });

  it("explains WHY the undetectable ones read as not connected (no silent false negative)", () => {
    // Manual/legal items (env: []) can never be auto-detected. They must carry a note saying so,
    // otherwise a user reasonably concludes the product is broken rather than honest.
    for (const c of connectionStatus(undefined, EMPTY)) {
      if (c.env.length === 0) {
        expect(c.note, `${c.id} has no env detection and no explanatory note`).toBeTruthy();
      }
    }
  });

  it("sums the minutes rather than asserting a round number, and labels it an estimate", () => {
    const plan = railPlan("customer", EMPTY);
    const expected = CONNECT_RAIL.reduce((m, s) => m + s.estMinutes, 0);
    expect(plan.minutesRemaining).toBe(expected);
    expect(plan.minutesRemaining).toBeGreaterThan(0);
    expect(plan.claim).toMatch(/estimate, not a promise/i);
  });
});

describe("first run: the user never has to leave to figure it out", () => {
  it("every rail step maps to a real connection, so no raw id leaks into the UI", () => {
    const ids = new Set(CONNECTIONS.map((c) => c.id));
    for (const step of CONNECT_RAIL) {
      expect(ids.has(step.connectionId), `rail step references unknown connection '${step.connectionId}'`).toBe(true);
    }
    // and railPlan resolves a human name for each (never falls back to the bare id)
    for (const step of railPlan("customer", EMPTY).steps) {
      expect(step.name).not.toBe(step.connectionId);
      expect(step.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("every step ships a complete inline guide and a security note", () => {
    for (const step of CONNECT_RAIL) {
      expect(step.inlineGuide.length, `${step.connectionId} has no inline guide`).toBeGreaterThan(0);
      expect(step.inlineGuide.every((l) => l.trim().length > 0)).toBe(true);
      expect(step.securityNote.trim().length, `${step.connectionId} has no security note`).toBeGreaterThan(0);
    }
  });

  it("gives an honest per-step time estimate (no zero-minute magic)", () => {
    for (const step of CONNECT_RAIL) {
      expect(step.estMinutes, `${step.connectionId} claims zero setup time`).toBeGreaterThan(0);
    }
  });
});

describe("first run: the customer's own surface stays clean", () => {
  it("the /connect map renders every customer-owned connection with real status", () => {
    const map = connectionMapStatus(EMPTY);
    expect(map.length).toBeGreaterThan(0);
    expect(map.every((c) => c !== undefined)).toBe(true);
    expect(map.every((c) => c.configured === false)).toBe(true);
  });

  it("uses no em-dashes in anything a customer reads (standing style rule)", () => {
    const plan = railPlan("customer", EMPTY);
    const prose = [
      plan.claim,
      ...CONNECT_RAIL.flatMap((s) => [...s.inlineGuide, s.securityNote]),
      ...connectionStatus(undefined, EMPTY).flatMap((c) => [c.name, c.purpose, c.unlocks, c.degraded, c.note ?? ""]),
    ].join("\n");
    expect(prose).not.toMatch(/[—–]/);
  });
});
