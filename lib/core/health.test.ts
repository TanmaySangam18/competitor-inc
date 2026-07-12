import { describe, it, expect } from "vitest";
import { checkHealth } from "./health";

describe("checkHealth — the company-OS vitals", () => {
  it("reports every core system green, keyless", async () => {
    const h = await checkHealth();
    const names = h.checks.map((c) => c.name);
    expect(names).toEqual(["org", "agents", "plan", "deliberate", "coordinate"]);
    for (const c of h.checks) expect(c.ok, `${c.name}: ${c.detail}`).toBe(true);
    expect(h.ok).toBe(true);
  });
});
