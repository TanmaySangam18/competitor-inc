import { describe, it, expect } from "vitest";
import { trace, withTrace } from "./observability";

// OBSERVABILITY_URL is unset in the test env → everything is a no-op. We verify the wrapper is
// transparent: it never alters results or swallows errors. (Live ingest is verified after a key is set.)
describe("observability — gated + transparent", () => {
  it("trace() is a silent no-op with no URL configured", () => {
    expect(() => trace({ name: "x", ok: true, ms: 1 })).not.toThrow();
  });

  it("withTrace() returns the wrapped result unchanged", async () => {
    const r = await withTrace("op", async () => 42);
    expect(r).toBe(42);
  });

  it("withTrace() preserves object identity of the result", async () => {
    const obj = { a: 1 };
    expect(await withTrace("op", async () => obj)).toBe(obj);
  });

  it("withTrace() re-throws the wrapped error (never swallows)", async () => {
    await expect(withTrace("op", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});
