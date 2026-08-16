import { describe, it, expect } from "vitest";
import { PROVIDERS, getProvider, availableProviders, resolveDefaultProvider, modelConfigured } from "./model-providers";

describe("model-providers — one interface for local + cloud models", () => {
  it("registers local + the cloud providers the founder asked for", () => {
    const ids = PROVIDERS.map((p) => p.id);
    expect(ids).toContain("local-ollama");
    for (const c of ["anthropic", "openai", "gemini", "mistral", "grok"]) expect(ids).toContain(c);
    expect(getProvider("anthropic")?.format).toBe("anthropic"); // Anthropic has its own wire format
    expect(getProvider("gemini")?.format).toBe("openai"); // the rest are OpenAI-compatible
  });

  it("availability: local is always a candidate; cloud needs its key present", () => {
    const bare = availableProviders({});
    expect(bare.map((p) => p.id)).toEqual(["local-ollama"]);
    const withClaude = availableProviders({ ANTHROPIC_API_KEY: "sk-ant-x" });
    expect(withClaude.map((p) => p.id)).toEqual(["local-ollama", "anthropic"]);
    // an empty/whitespace key does NOT count as configured
    expect(availableProviders({ OPENAI_API_KEY: "  " }).map((p) => p.id)).toEqual(["local-ollama"]);
  });

  it("default resolution is honest and never leaves the app without a provider", () => {
    // offline / no keys → local (offline-first)
    expect(resolveDefaultProvider({}).id).toBe("local-ollama");
    // LOCAL_MODELS opt-in wins even when a cloud key exists
    expect(resolveDefaultProvider({ LOCAL_MODELS: "1", OPENAI_API_KEY: "x" }).id).toBe("local-ollama");
    // a configured cloud key becomes the default when not opted into local
    expect(resolveDefaultProvider({ OPENAI_API_KEY: "x" }).id).toBe("openai");
    // an explicit override is honored — but only if it's actually usable
    expect(resolveDefaultProvider({ MODEL_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "x" }).id).toBe("anthropic");
    expect(resolveDefaultProvider({ MODEL_PROVIDER: "anthropic" }).id).toBe("local-ollama"); // override not usable → fall through
  });
});

describe("the registry agrees with the connection map", () => {
  it("routes every model key the connection map accepts", async () => {
    // THE COHERENCE BUG THIS CATCHES: connections.ts listed GROQ_API_KEY as a valid model key while this
    // registry had no Groq provider, so the single key actually set in production resolved to nothing.
    // Two lists describing the same fact drifted apart. Now they cannot.
    const { CONNECTION_MAP } = await import("@/lib/core/connections");
    const aiModel = CONNECTION_MAP.find((c) => c.id === "ai-model")!;
    const routable = new Set(PROVIDERS.map((p) => p.envKey).filter(Boolean));
    // MODEL_API_KEY is the deliberate generic escape hatch, paired with MODEL_PROVIDER.
    const generic = new Set(["MODEL_API_KEY"]);
    for (const env of aiModel.env) {
      if (generic.has(env)) continue;
      expect(routable.has(env), `${env} is accepted as a model key but no provider can route it`).toBe(true);
    }
  });

  it("resolves a Groq-only deployment to Groq rather than falling through", () => {
    const p = resolveDefaultProvider({ GROQ_API_KEY: "gsk_test" });
    expect(p.id).toBe("groq");
    expect(p.format).toBe("openai");
  });

  it("offers one adapter that covers the model-breadth claim honestly", () => {
    const router = PROVIDERS.find((p) => p.id === "openrouter")!;
    expect(router.format).toBe("openai");
    expect(router.envKey).toBe("OPENROUTER_API_KEY");
    expect(availableProviders({ OPENROUTER_API_KEY: "sk-or-test" }).map((p) => p.id)).toContain("openrouter");
  });
});

describe("one answer to 'does this deployment have cognition?'", () => {
  it("accepts every key the connection map advertises", async () => {
    const { CONNECTION_MAP } = await import("@/lib/core/connections");
    const aiModel = CONNECTION_MAP.find((c) => c.id === "ai-model")!;
    for (const env of aiModel.env) {
      expect(modelConfigured({ [env]: "test-key" }), `${env} is advertised but does not count as cognition`).toBe(true);
    }
  });

  it("says yes for a Groq-only deployment, which is what production actually is", () => {
    // The live bug: /connect showed "AI model key: CONNECTED" while the executor saw no model, so every
    // real action silently fell back to simulated.
    expect(modelConfigured({ GROQ_API_KEY: "gsk_test" })).toBe(true);
    expect(modelConfigured({ OPENAI_API_KEY: "sk-test" })).toBe(true);
    expect(modelConfigured({ OPENROUTER_API_KEY: "sk-or-test" })).toBe(true);
  });

  it("still honours the provider-agnostic escape hatches", () => {
    expect(modelConfigured({ MODEL_API_KEY: "k" })).toBe(true);
    expect(modelConfigured({ AI_GATEWAY_API_KEY: "k" })).toBe(true);
  });

  it("says no when there is genuinely nothing", () => {
    expect(modelConfigured({})).toBe(false);
    expect(modelConfigured({ GROQ_API_KEY: "   " })).toBe(false);
  });
});
