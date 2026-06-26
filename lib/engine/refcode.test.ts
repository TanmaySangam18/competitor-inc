import { describe, it, expect } from "vitest";
import { codeFrom } from "./refcode";

describe("codeFrom", () => {
  it("is deterministic for the same email", () => {
    expect(codeFrom("a@b.com")).toBe(codeFrom("a@b.com"));
  });

  it("returns a short base36 code (<=6 chars)", () => {
    const c = codeFrom("founder@example.com");
    expect(c).toMatch(/^[0-9a-z]{1,6}$/);
    expect(c.length).toBeLessThanOrEqual(6);
  });

  it("differs for different emails (no trivial collision)", () => {
    expect(codeFrom("a@b.com")).not.toBe(codeFrom("c@d.com"));
  });

  it("is case/whitespace sensitive — callers must normalize first", () => {
    // The route + page both lowercase+trim before hashing; this documents that contract.
    expect(codeFrom("A@B.com")).not.toBe(codeFrom("a@b.com"));
  });
});
