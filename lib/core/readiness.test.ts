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

  it("has no 'todo' checks (mechanisms all built; some partial pending connect)", async () => {
    const r = await readiness();
    const todos = r.checks.filter((c) => c.status === "todo").map((c) => c.n);
    expect(todos, `todo checks: ${todos.join(",")}`).toEqual([]);
  });

  it("reports honestly — partials are the connect-phase/enforcement items (#6, #7)", async () => {
    const r = await readiness();
    expect(r.partial).toBeGreaterThanOrEqual(1);
    expect(r.checks.filter((c) => c.status === "partial").map((c) => c.n).sort()).toEqual([6, 7]);
  });
});
