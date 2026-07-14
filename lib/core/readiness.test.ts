import { describe, it, expect } from "vitest";
import { readiness } from "./readiness";

describe("Definition-of-Done scorecard", () => {
  it("runs all 8 checks; the 5 safety-critical ones pass", async () => {
    const r = await readiness();
    expect(r.checks).toHaveLength(8);
    const critical = r.checks.filter((c) => c.n <= 5);
    const failingCritical = critical.filter((c) => c.status !== "pass").map((c) => `#${c.n} ${c.question}`);
    expect(failingCritical, failingCritical.join(" | ")).toEqual([]);
  });

  it("has no 'todo' checks and no partials — all 8 are enforced in code", async () => {
    const r = await readiness();
    expect(r.checks.filter((c) => c.status === "todo").map((c) => c.n)).toEqual([]);
    expect(r.checks.filter((c) => c.status === "partial").map((c) => c.n)).toEqual([]);
  });

  it("the safety architecture gate is READY (all 8 pass) — go-live still needs the 🔒 founder items", async () => {
    const r = await readiness();
    expect(r.passed).toBe(8);
    expect(r.ready).toBe(true);
  });
});
