"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENTS, type AgentRole, type ByokConfig } from "./types";

// Config = competitor.inc's "soul.md / agents.md" surface: brand voice, per-agent scoped authority,
// and which engine drives it. Persisted locally (and ready to move to the DB with the rest).

export interface AgentConfig {
  enabled: boolean;
  scope: string;
}

export type ProviderMode = "frontier" | "private" | "simulated";

export interface RoomieConfig {
  soul: string;
  agents: Record<AgentRole, AgentConfig>;
  providerMode: ProviderMode;
  byok: ByokConfig;
}

const ROLES = Object.keys(AGENTS) as AgentRole[];

export const DEFAULT_CONFIG: RoomieConfig = {
  soul:
    "Warm, candid, and a little playful. Prove there's real demand before building anything. " +
    "Optimize for the user's real outcome, not vanity metrics — and tell the truth even when it " +
    "means recommending we don't build it. The user is the founder; never act on anything " +
    "consequential without their explicit sign-off.",
  agents: ROLES.reduce(
    (acc, r) => {
      acc[r] = { enabled: true, scope: AGENTS[r].blurb };
      return acc;
    },
    {} as Record<AgentRole, AgentConfig>
  ),
  providerMode: "simulated",
  byok: { provider: "", apiKey: "", baseUrl: "", model: "" },
};

const KEY = "roomie:config:v1";

// Read the user's BYOK config from local storage (used by request senders outside React).
// Returns null unless a provider + key are set, so requests fall back to simulated.
export function getByok(): ByokConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const b = (JSON.parse(raw) as RoomieConfig).byok;
    if (b && b.provider && b.apiKey) return b;
  } catch {
    /* ignore */
  }
  return null;
}

export function useConfig() {
  const [config, setConfig] = useState<RoomieConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<RoomieConfig>;
        if (parsed && typeof parsed === "object") {
          setConfig({
            ...DEFAULT_CONFIG,
            ...parsed,
            agents: parsed.agents && typeof parsed.agents === "object" ? parsed.agents : DEFAULT_CONFIG.agents,
            byok: parsed.byok && typeof parsed.byok === "object" ? { ...DEFAULT_CONFIG.byok, ...parsed.byok } : DEFAULT_CONFIG.byok,
          });
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config, hydrated]);

  const setSoul = useCallback((soul: string) => setConfig((c) => ({ ...c, soul })), []);
  const setProviderMode = useCallback(
    (providerMode: ProviderMode) => setConfig((c) => ({ ...c, providerMode })),
    []
  );
  const toggleAgent = useCallback(
    (role: AgentRole) =>
      setConfig((c) => ({
        ...c,
        agents: { ...c.agents, [role]: { ...c.agents[role], enabled: !c.agents[role].enabled } },
      })),
    []
  );
  const setAgentScope = useCallback(
    (role: AgentRole, scope: string) =>
      setConfig((c) => ({ ...c, agents: { ...c.agents, [role]: { ...c.agents[role], scope } } })),
    []
  );
  const setByok = useCallback(
    (patch: Partial<ByokConfig>) => setConfig((c) => ({ ...c, byok: { ...c.byok, ...patch } })),
    []
  );
  const reset = useCallback(() => setConfig(DEFAULT_CONFIG), []);

  return { config, hydrated, setSoul, setProviderMode, toggleAgent, setAgentScope, setByok, reset };
}
