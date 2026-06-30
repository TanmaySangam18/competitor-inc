import { describe, it, expect } from "vitest";
import { fetchSiteText, simulatedAudit } from "./importer";

// These exercise the input + SSRF guards, which fail BEFORE any network call — so no network needed.
describe("fetchSiteText — input + SSRF guards", () => {
  it("rejects a malformed URL", async () => {
    const r = await fetchSiteText("not a url at all %%%");
    expect(r.ok).toBe(false);
  });

  it("blocks localhost / internal hosts (SSRF)", async () => {
    const r = await fetchSiteText("http://localhost:3000/admin");
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("blocks a private IP (SSRF)", async () => {
    const r = await fetchSiteText("http://169.254.169.254/latest/meta-data");
    expect(r.ok).toBe(false);
  });
});

describe("simulatedAudit — model-free fallback so the on-ramp never dead-ends", () => {
  it("always returns a usable audit, even on empty input", () => {
    const a = simulatedAudit("", "");
    expect(a.summary).toBeTruthy();
    expect(a.opportunities.length).toBeGreaterThan(0);
    expect(a.weaknesses.length).toBeGreaterThan(0);
  });

  it("flags a thin page with no offer as a weakness", () => {
    const a = simulatedAudit("Tiny", "hello");
    expect(a.weaknesses.join(" ")).toMatch(/thin|pricing|call-to-action/i);
  });

  it("credits a richer page with pricing + CTA as strengths", () => {
    const text = "Sign up for our pricing plans. $19 per month. " + "value ".repeat(150) + " trusted by 2,000 customers. contact@x.com";
    const a = simulatedAudit("Real Product", text);
    expect(a.strengths.length).toBeGreaterThan(0);
    expect(a.strengths.join(" ")).toMatch(/pricing|call-to-action|social proof/i);
  });
});
