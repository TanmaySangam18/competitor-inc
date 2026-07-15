import { describe, it, expect } from "vitest";
import { classifyLicense, screenDependency, attributionList } from "./licenses";

describe("license-compliance shield", () => {
  it("allows permissive licenses but requires attribution", () => {
    for (const spdx of ["MIT", "Apache-2.0", "ISC", "BSD-3-Clause"]) {
      const v = classifyLicense(spdx);
      expect(v.allowed, spdx).toBe(true);
      expect(v.requiresAttribution, spdx).toBe(true);
    }
  });

  it("public-domain allowed with no attribution", () => {
    expect(classifyLicense("CC0-1.0")).toMatchObject({ allowed: true, requiresAttribution: false });
    expect(classifyLicense("Unlicense").allowed).toBe(true);
  });

  it("BLOCKS copyleft, network-copyleft, source-available, and non-commercial", () => {
    for (const spdx of ["GPL-3.0", "AGPL-3.0", "SSPL-1.0", "BUSL-1.1", "CC-BY-NC-4.0", "LGPL-3.0"]) {
      expect(classifyLicense(spdx).allowed, spdx).toBe(false);
    }
  });

  it("DEFAULT-DENIES an unknown / missing license", () => {
    expect(classifyLicense("WeirdLicense-9").allowed).toBe(false);
    expect(classifyLicense("").class).toBe("unknown");
    expect(classifyLicense("").allowed).toBe(false);
  });

  it("compound OR picks the permissive branch; AND takes the strictest", () => {
    expect(classifyLicense("GPL-3.0 OR MIT").allowed).toBe(true); // MIT branch
    expect(classifyLicense("MIT AND GPL-3.0").allowed).toBe(false); // GPL governs
  });

  it("attributionList names only allowed, attribution-required deps", () => {
    const list = attributionList([
      { name: "react", license: "MIT" },
      { name: "somegpl", license: "GPL-3.0" }, // blocked → excluded
      { name: "publicthing", license: "CC0-1.0" }, // no attribution → excluded
    ]);
    expect(list).toEqual(["react — MIT"]);
  });

  it("screenDependency returns a full verdict for CI", () => {
    const d = screenDependency({ name: "left-pad", license: "WTFPL" });
    expect(d.verdict.allowed).toBe(false); // unknown → default-deny
    expect(d.verdict.action).toMatch(/default-deny/i);
  });
});
