import { describe, it, expect } from "vitest";
import { validateByok, brandDirective } from "./config";

describe("validateByok — BYOK shape guard (defense-in-depth before the SSRF check)", () => {
  it("treats an unset config as valid (no BYOK = simulated, not an error)", () => {
    expect(validateByok(undefined).ok).toBe(true);
    expect(validateByok(null).ok).toBe(true);
    expect(validateByok({ provider: "", apiKey: "", baseUrl: "", model: "" }).ok).toBe(true);
  });

  it("accepts a well-formed Anthropic config (no base URL needed)", () => {
    expect(validateByok({ provider: "anthropic", apiKey: "sk-ant-xxx", baseUrl: "", model: "" }).ok).toBe(true);
  });

  it("accepts a well-formed OpenAI-compatible config with an https base URL", () => {
    const r = validateByok({ provider: "openai-compatible", apiKey: "sk-x", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.1" });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("requires an API key", () => {
    const r = validateByok({ provider: "anthropic", apiKey: "  ", baseUrl: "", model: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/key/i);
  });

  it("requires a base URL for an OpenAI-compatible provider", () => {
    const r = validateByok({ provider: "openai-compatible", apiKey: "sk-x", baseUrl: "", model: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/base url/i);
  });

  it("rejects a non-https base URL and a malformed URL", () => {
    expect(validateByok({ provider: "openai-compatible", apiKey: "sk-x", baseUrl: "http://api.groq.com/v1", model: "" }).ok).toBe(false);
    expect(validateByok({ provider: "openai-compatible", apiKey: "sk-x", baseUrl: "not a url", model: "" }).ok).toBe(false);
  });

  it("rejects an unknown provider", () => {
    // @ts-expect-error — exercising a value outside the union, as bad localStorage could supply
    expect(validateByok({ provider: "openai", apiKey: "sk-x", baseUrl: "", model: "" }).ok).toBe(false);
  });
});

describe("brandDirective — structured brand training (Block 6a)", () => {
  it("all-empty ⇒ undefined (founders who skip the card change nothing)", () => {
    expect(brandDirective(null)).toBeUndefined();
    expect(brandDirective({})).toBeUndefined();
    expect(brandDirective({ tone: "  ", audience: "", avoid: " " })).toBeUndefined();
  });

  it("composes only the filled fields, clamped", () => {
    const d = brandDirective({ tone: "dry, confident", avoid: "emoji" })!;
    expect(d).toContain("Write in this tone: dry, confident.");
    expect(d).toContain("Never use: emoji.");
    expect(d).not.toContain("writing for");
    expect(brandDirective({ tone: "x".repeat(500) })!.length).toBeLessThan(260); // 200-char clamp holds
  });

  it("full profile reads as one compact directive", () => {
    const d = brandDirective({ tone: "warm", audience: "agency owners", avoid: "buzzwords" })!;
    expect(d.startsWith("Brand voice — ")).toBe(true);
    expect(d).toContain("You are writing for: agency owners.");
  });
});

