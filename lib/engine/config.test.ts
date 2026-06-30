import { describe, it, expect } from "vitest";
import { validateByok } from "./config";

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
