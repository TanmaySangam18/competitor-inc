import { describe, it, expect } from "vitest";
import { cliScript } from "./cli-script";

describe("one-line activation script (ADR-0011)", () => {
  it("embeds the serving origin and only that origin", () => {
    const s = cliScript("https://example.com/");
    expect(s).toContain('const ORIGIN = "https://example.com"'); // trailing slash stripped
    expect(s).not.toContain("competitor-inc-zeta"); // no hardcoded hosts — origin comes from the request
  });

  it("is zero-dependency Node (no imports beyond node builtins) and honest about skips", () => {
    const s = cliScript("https://x.example");
    expect(s).toMatch(/require\("node:readline"\)/);
    expect(s).not.toMatch(/require\("(?!node:)/); // nothing outside node: builtins
    expect(s).toContain("Skipped:");
    expect(s).toContain("revoke any time");
  });

  it("pairs via the 10-minute code and never prints secrets back", () => {
    const s = cliScript("https://x.example");
    expect(s).toContain("/cli/pair");
    expect(s).toContain("valid 10 minutes");
    expect(s).toContain("hidden, Enter to skip"); // raw-mode secret prompt, echo off
  });
});
