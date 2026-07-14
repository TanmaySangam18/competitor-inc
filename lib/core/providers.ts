// lib/core/providers.ts — MULTI-PROVIDER MODEL ABSTRACTION (Tier D · REQUIREMENTS §9).
//
// No hard dependency on one model API — pricing, deprecation, rate limits, and ToS cutoffs are all
// existential risks. The company reasons through a provider CHAIN: use the first configured provider, fall
// back to the next on outage/limit. Keyless: this reports which providers are configured and picks the
// active one; the actual call wiring lives behind the engine's reasoner seam.

export type Provider = "anthropic" | "openai" | "google" | "groq";

// The env var that holds each provider's key (the key itself lives in the vault; this is just the name).
export const PROVIDER_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
};

// Default failover order: strongest general reasoning first, then alternates.
export const DEFAULT_ORDER: Provider[] = ["anthropic", "openai", "google", "groq"];

export interface ProviderStatus { provider: Provider; configured: boolean; }

export function providerStatus(order: Provider[] = DEFAULT_ORDER): ProviderStatus[] {
  return order.map((p) => ({ provider: p, configured: typeof process.env[PROVIDER_ENV[p]] === "string" && process.env[PROVIDER_ENV[p]] !== "" }));
}

// The provider to use right now: the first configured one in the order. null if NONE is configured (the
// company runs in mandate-derived/simulated mode — the honest keyless state).
export function selectProvider(order: Provider[] = DEFAULT_ORDER): Provider | null {
  return providerStatus(order).find((s) => s.configured)?.provider ?? null;
}

// The fallback chain after the active one (what an outage would fail over to, in order).
export function failoverChain(order: Provider[] = DEFAULT_ORDER): Provider[] {
  const configured = providerStatus(order).filter((s) => s.configured).map((s) => s.provider);
  return configured.slice(1);
}

// Resilient = at least two providers configured, so one going down isn't existential.
export function hasFailover(order: Provider[] = DEFAULT_ORDER): boolean {
  return providerStatus(order).filter((s) => s.configured).length >= 2;
}
