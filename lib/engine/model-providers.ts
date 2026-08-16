// ─────────────────────────────────────────────────────────────────────────────
// MODEL PROVIDERS — one interface for every model, local or cloud.
//
// The single brick that is correct under EVERY direction we might take:
//   • local-first pivot  → local models (Ollama: Gemma, Qwen2.5-Coder) are first-class here
//   • AIOS / orchestration → BYO cloud keys (Claude, OpenAI, Gemini, Mistral, Grok) plug in here
//   • the current cloud platform → benefits too (per-agent routing already picks a model id)
//
// Most providers speak the OpenAI-compatible shape (one adapter covers 5); Anthropic uses its own.
// Pure + deterministic: config in → resolution out. No network, no keys logged. Reachability is a
// separate runtime check; this module answers "what is CONFIGURED and which do we default to."
// ─────────────────────────────────────────────────────────────────────────────

export type ProviderKind = "local" | "cloud";
export type WireFormat = "openai" | "anthropic";

export interface ModelProvider {
  id: string;
  label: string;
  kind: ProviderKind;
  format: WireFormat;
  baseUrl: string;
  /** env var holding the API key; absent for local (no key needed). */
  envKey?: string;
}

// The registry. Local first (default, offline-capable); cloud is opt-in via the user's own key.
export const PROVIDERS: readonly ModelProvider[] = [
  { id: "local-ollama", label: "Local (Ollama)", kind: "local", format: "openai", baseUrl: "http://localhost:11434/v1" },
  { id: "anthropic", label: "Anthropic (Claude)", kind: "cloud", format: "anthropic", baseUrl: "https://api.anthropic.com/v1", envKey: "ANTHROPIC_API_KEY" },
  { id: "openai", label: "OpenAI", kind: "cloud", format: "openai", baseUrl: "https://api.openai.com/v1", envKey: "OPENAI_API_KEY" },
  { id: "gemini", label: "Google Gemini", kind: "cloud", format: "openai", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", envKey: "GEMINI_API_KEY" },
  { id: "mistral", label: "Mistral", kind: "cloud", format: "openai", baseUrl: "https://api.mistral.ai/v1", envKey: "MISTRAL_API_KEY" },
  { id: "grok", label: "xAI (Grok)", kind: "cloud", format: "openai", baseUrl: "https://api.x.ai/v1", envKey: "XAI_API_KEY" },
  // Groq was already accepted as a valid model key by the connection map and had NO provider here, so
  // the one key set in production resolved to nothing. Coherence bug, found by A5, fixed by A5.
  { id: "groq", label: "Groq", kind: "cloud", format: "openai", baseUrl: "https://api.groq.com/openai/v1", envKey: "GROQ_API_KEY" },
  // A5: one key, one adapter, several hundred models. This is the whole of the "model breadth" gap
  // against a competitor claiming 300+ providers: they are almost all reachable through this router,
  // and pretending each is a separate integration would be counting the same thing many times.
  { id: "openrouter", label: "OpenRouter (300+ models)", kind: "cloud", format: "openai", baseUrl: "https://openrouter.ai/api/v1", envKey: "OPENROUTER_API_KEY" },
] as const;

export function getProvider(id: string): ModelProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/**
 * THE SINGLE ANSWER TO "does this deployment have cognition?"
 *
 * There were three different answers to that question and they disagreed. The connection map counted
 * Anthropic, OpenAI, Groq or a generic key; this registry knew a different set; and the executor's
 * capability check looked only at Anthropic, the Vercel gateway, or the generic key. Production, which
 * holds a Groq key and nothing else, therefore displayed "AI model key: CONNECTED" on /connect while the
 * executor believed no model existed and every real action fell back to simulated.
 *
 * A fact with three definitions has none. Everything that needs this answer now calls here.
 */
export function modelConfigured(env: Record<string, string | undefined> = process.env): boolean {
  if (PROVIDERS.some((p) => p.envKey && !!env[p.envKey]?.trim())) return true;
  // The two provider-agnostic escape hatches: a generic key paired with MODEL_PROVIDER, and Vercel's
  // AI Gateway, which fronts many providers behind one credential.
  return !!env.MODEL_API_KEY?.trim() || !!env.AI_GATEWAY_API_KEY?.trim();
}

/** Which providers are usable given the environment: local is always a candidate; cloud needs its key. */
export function availableProviders(env: Record<string, string | undefined> = process.env): ModelProvider[] {
  return PROVIDERS.filter((p) => p.kind === "local" || (p.envKey ? !!env[p.envKey]?.trim() : false));
}

/**
 * The default provider, honestly resolved:
 *   1. an explicit MODEL_PROVIDER override, if it's actually usable;
 *   2. else local (offline-first) when LOCAL_MODELS is opted in;
 *   3. else the first configured cloud provider;
 *   4. else local as the last resort (the app still runs; reachability is checked at call time).
 */
export function resolveDefaultProvider(env: Record<string, string | undefined> = process.env): ModelProvider {
  const available = availableProviders(env);
  const explicit = env.MODEL_PROVIDER?.trim();
  if (explicit) {
    const chosen = available.find((p) => p.id === explicit);
    if (chosen) return chosen;
  }
  const local = PROVIDERS.find((p) => p.id === "local-ollama")!;
  if (env.LOCAL_MODELS?.trim() === "1") return local;
  const firstCloud = available.find((p) => p.kind === "cloud");
  return firstCloud ?? local;
}
