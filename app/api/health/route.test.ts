import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("/api/health", () => {
  it("GET returns 200 with all core systems green", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.health.checks.length).toBe(5);
    expect(j.health.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
  });
});
