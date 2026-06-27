import { describe, it, expect } from "vitest";
import { generateCrew } from "./crew";

describe("generateCrew", () => {
  it("is deterministic for the same idea", () => {
    const a = generateCrew("a marketplace connecting plumbers and homeowners");
    const b = generateCrew("a marketplace connecting plumbers and homeowners");
    expect(a).toEqual(b);
  });

  it("picks the right domain from keywords", () => {
    expect(generateCrew("a lending app for invoices").domain).toBe("Fintech");
    expect(generateCrew("a two-sided marketplace for freelancers").domain).toBe("Marketplace");
    expect(generateCrew("a DTC skincare store").domain).toBe("E-commerce / DTC");
    expect(generateCrew("an edtech course platform for students").domain).toBe("Education / EdTech");
  });

  it("produces DIFFERENT crews for different domains", () => {
    const fintech = generateCrew("a payments app");
    const market = generateCrew("a rental marketplace");
    expect(fintech.specialists).not.toEqual(market.specialists);
  });

  it("always returns a valid shape with 2 specialists", () => {
    for (const idea of ["", "something totally generic xyz", "a health clinic booking tool", "an AI model eval tool"]) {
      const c = generateCrew(idea);
      expect(typeof c.domain).toBe("string");
      expect(c.summary.length).toBeGreaterThan(0);
      expect(c.specialists).toHaveLength(2);
      for (const s of c.specialists) {
        expect(s.name.length).toBeGreaterThan(0);
        expect(s.focus.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to the default Software crew when nothing matches", () => {
    expect(generateCrew("zzz qqq vvv").domain).toBe("Software");
  });
});
