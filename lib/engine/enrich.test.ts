import { describe, it, expect } from "vitest";
import { enrichSelf } from "./enrich";

describe("enrichSelf — self-only, fail-soft", () => {
  it("returns not-found for a non-email (no network)", async () => {
    const r = await enrichSelf("not-an-email");
    expect(r.found).toBe(false);
    expect(r.links).toEqual([]);
  });

  it("returns not-found for empty input", async () => {
    const r = await enrichSelf("");
    expect(r.found).toBe(false);
  });
});
