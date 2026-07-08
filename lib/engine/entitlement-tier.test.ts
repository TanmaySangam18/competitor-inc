import { describe, it, expect } from "vitest";
import { tierOf, tierAtLeast, tierUnlocksOperate } from "./entitlement";

describe("tier model (Slice A.2 — founder ladder free→builder→operator→founder)", () => {
  it("maps Polar plan strings (metadata.plan or product name) to a tier", () => {
    expect(tierOf("builder")).toBe("builder");
    expect(tierOf("Operator")).toBe("operator"); // case-insensitive
    expect(tierOf("Concierge")).toBe("founder");
    expect(tierOf("founder")).toBe("founder");
    expect(tierOf("operator $199/mo")).toBe("operator"); // substring match on product name
  });

  it("returns free for an empty/absent plan (no subscription)", () => {
    expect(tierOf("")).toBe("free");
    expect(tierOf(null)).toBe("free");
    expect(tierOf(undefined)).toBe("free");
  });

  it("FAILS OPEN: a paid-but-unrecognized plan never downgrades a payer below operator", () => {
    expect(tierOf("some-legacy-product")).toBe("operator");
    expect(tierOf("pro")).toBe("operator");
  });

  it("ranks tiers and gates the operating loop at operator+ (builder is build-only)", () => {
    expect(tierAtLeast("operator", "builder")).toBe(true);
    expect(tierAtLeast("builder", "operator")).toBe(false);
    expect(tierUnlocksOperate("free")).toBe(false);
    expect(tierUnlocksOperate("builder")).toBe(false);
    expect(tierUnlocksOperate("operator")).toBe(true);
    expect(tierUnlocksOperate("founder")).toBe(true);
  });
});
