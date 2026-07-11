import { describe, it, expect } from "vitest";
import { proveCompounding, type SessionStep } from "./compounding";

const LIFE: SessionStep[] = [
  { kind: "build", goal: "a bookings SaaS for tutoring studios: accounts, calendar, payments" },
  { kind: "change", goal: "add a waitlist when a slot is full" },
  { kind: "change", goal: "let studios set cancellation windows" },
  { kind: "change", goal: "add SMS reminders 24h before a session" },
];

describe("Compounding Proving Ground (S3) — building across sessions", () => {
  it("THE WALL: the report is simulated:true (proves the machine compounds, not that a product shipped)", () => {
    expect(proveCompounding("tutorbook", LIFE).simulated).toBe(true);
  });

  it("passes the full multi-session arc: anchored, monotonic ADRs, recall carries all, bounded", () => {
    const r = proveCompounding("tutorbook", LIFE);
    expect(r.checks).toEqual({ anchored: true, adrsMonotonic: true, recallCarriesPrior: true, recallBounded: true });
    expect(r.adrs).toBe(3); // three changes → three ADRs
    expect(r.passed).toBe(true);
    expect(r.notes).toEqual([]);
  });

  it("RECALL CARRIES: by the last change, the recall names the founding purpose AND every prior ADR", () => {
    // Re-run the arc manually to inspect the recall the final change would receive.
    const r = proveCompounding("tutorbook", LIFE);
    // if any prior decision had been dropped, recallCarriesPrior would be false
    expect(r.checks.recallCarriesPrior).toBe(true);
    // and a longer life keeps compounding without renumbering
    const longer = proveCompounding("tutorbook", [...LIFE, { kind: "change", goal: "add group sessions" }, { kind: "change", goal: "add refunds" }]);
    expect(longer.adrs).toBe(5);
    expect(longer.passed).toBe(true);
  });

  it("is deterministic — same script ⇒ identical verdict", () => {
    expect(proveCompounding("x", LIFE)).toEqual(proveCompounding("x", LIFE));
  });

  it("catches a broken loop: a first step that isn't a build is flagged (no silent anchor)", () => {
    const r = proveCompounding("bad", [{ kind: "change", goal: "do a thing" }]);
    // a change with no prior build still anchors (step 0 forces the architecture doc) but notes the misuse
    expect(r.notes.some((n) => n.includes("first step must be a build"))).toBe(true);
  });
});
