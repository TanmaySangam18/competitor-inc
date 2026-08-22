import { describe, it, expect, afterEach } from "vitest";
import { realModelConfigured, modelForAgent } from "./server";

// REGRESSION GUARD for the bug found 2026-08-22: a bare vendor key (GROQ_API_KEY and friends)
// resolved to NO model, so realModelConfigured() was false and every agent stayed silent, while the
// connection map reported a model was connected. The product was disabled by a disagreement between
// two functions about what "has cognition" means.

const KEYS = ["GROQ_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "GEMINI_API_KEY", "MISTRAL_API_KEY", "XAI_API_KEY", "ANTHROPIC_API_KEY", "MODEL_ID", "MODEL_MID", "MODEL_CHEAP"] as const;
const saved: Record<string, string | undefined> = {};
for (const k of KEYS) saved[k] = process.env[k];

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const only = (key: string, value = "test-key-value") => {
  for (const k of KEYS) delete process.env[k];
  process.env[key] = value;
};

describe("a single vendor key is enough, for every cloud provider in the registry", () => {
  for (const key of ["GROQ_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "GEMINI_API_KEY", "MISTRAL_API_KEY", "XAI_API_KEY", "ANTHROPIC_API_KEY"]) {
    it(`${key} alone makes the deployment model-capable`, () => {
      only(key);
      expect(realModelConfigured()).toBe(true);
    });
  }

  it("no key at all means no cognition, and says so", () => {
    for (const k of KEYS) delete process.env[k];
    expect(realModelConfigured()).toBe(false);
  });

  it("an empty or whitespace key does not count as configured", () => {
    only("GROQ_API_KEY", "   ");
    expect(realModelConfigured()).toBe(false);
  });
});

describe("the model id sent to a provider must be one that provider has", () => {
  it("does NOT send a Claude model id to Groq", () => {
    // This is the half of the bug that would have produced a 404 on every single call even after the
    // key was recognised. The tiers are Claude ids; Groq has none of them.
    only("GROQ_API_KEY");
    const m = modelForAgent("ceo");
    expect(m).not.toMatch(/claude/i);
    expect(m).toBe("llama-3.3-70b-versatile");
  });

  it("collapses all three tiers onto the provider's own model", () => {
    only("GROQ_API_KEY");
    const models = new Set(["ceo", "engineer", "marketer"].map((r) => modelForAgent(r as never)));
    expect(models.size).toBe(1);
  });

  it("keeps Claude ids when the provider IS Anthropic", () => {
    only("ANTHROPIC_API_KEY");
    expect(modelForAgent("ceo")).toMatch(/claude/i);
  });

  it("an explicit MODEL_ID always wins", () => {
    only("GROQ_API_KEY");
    process.env.MODEL_ID = "llama-3.1-8b-instant";
    expect(modelForAgent("ceo")).toBe("llama-3.1-8b-instant");
  });

  it("routes every agent role to a model that exists on the provider", () => {
    // The tier OVERRIDES (MODEL_MID / MODEL_CHEAP) are captured at module load, so they cannot be
    // exercised from a test that imports first and sets env after. What matters and IS testable is
    // the invariant: with a Groq key and no overrides, no role ever gets a Claude id.
    only("GROQ_API_KEY");
    for (const role of ["ceo", "engineer", "marketer", "support", "analyst"]) {
      expect(modelForAgent(role as never), role).not.toMatch(/claude/i);
    }
  });
});

describe("a keyless local provider is never mistaken for cognition", () => {
  it("Ollama being in the registry does not make the deployment model-capable", () => {
    // local-ollama has no envKey, so a naive "is any provider available" check would always say yes
    // and every agent would try to reach a port with nothing listening.
    for (const k of KEYS) delete process.env[k];
    expect(realModelConfigured()).toBe(false);
  });
});
