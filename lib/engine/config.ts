"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENTS, type AgentRole, type ByokConfig, type Connections } from "./types";

// Config = competitor.inc's "soul.md / agents.md" surface: brand voice, per-agent scoped authority,
// and which engine drives it. Persisted locally (and ready to move to the DB with the rest).

export interface AgentConfig {
  enabled: boolean;
  scope: string;
}

export type ProviderMode = "frontier" | "private" | "simulated";

export interface EngineConfig {
  soul: string;
  agents: Record<AgentRole, AgentConfig>;
  providerMode: ProviderMode;
  byok: ByokConfig;
  connections: Connections;
  // Opt-in customer updates. We can't auto-pull a handle from Google sign-in (honest limit), so the
  // user pastes their Telegram chat id after messaging our bot. Provider-agnostic store — phone/iMessage
  // (Linqapp) drops in later. See lib/engine/notify.ts.
  notify: { telegramChatId: string };
}

const ROLES = Object.keys(AGENTS) as AgentRole[];

export const DEFAULT_CONFIG: EngineConfig = {
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
  connections: { githubToken: "", resendApiKey: "", resendFrom: "", adsWebhookUrl: "" },
  notify: { telegramChatId: "" },
};

const KEY = "cofounder:config:v1";

// Read the user's BYOK config from local storage (used by request senders outside React).
// Returns null unless a provider + key are set, so requests fall back to simulated.
export function getByok(): ByokConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const b = (JSON.parse(raw) as EngineConfig).byok;
    if (b && b.provider && b.apiKey) return b;
  } catch {
    /* ignore */
  }
  return null;
}

// Read the user's per-user integration connections (used by request senders outside React).
// Returns null unless at least one field is set, so requests fall back to the operator's env keys.
export function getConnections(): Connections | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = (JSON.parse(raw) as EngineConfig).connections;
    if (c && (c.githubToken || c.resendApiKey || c.adsWebhookUrl)) return c;
  } catch {
    /* ignore */
  }
  return null;
}

export function useConfig() {
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EngineConfig>;
        if (parsed && typeof parsed === "object") {
          setConfig({
            ...DEFAULT_CONFIG,
            ...parsed,
            agents: parsed.agents && typeof parsed.agents === "object" ? parsed.agents : DEFAULT_CONFIG.agents,
            byok: parsed.byok && typeof parsed.byok === "object" ? { ...DEFAULT_CONFIG.byok, ...parsed.byok } : DEFAULT_CONFIG.byok,
            connections: parsed.connections && typeof parsed.connections === "object" ? { ...DEFAULT_CONFIG.connections, ...parsed.connections } : DEFAULT_CONFIG.connections,
            notify: parsed.notify && typeof parsed.notify === "object" ? { ...DEFAULT_CONFIG.notify, ...parsed.notify } : DEFAULT_CONFIG.notify,
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
  const setConnections = useCallback(
    (patch: Partial<Connections>) => setConfig((c) => ({ ...c, connections: { ...c.connections, ...patch } })),
    []
  );
  const setNotify = useCallback(
    (patch: Partial<EngineConfig["notify"]>) => setConfig((c) => ({ ...c, notify: { ...c.notify, ...patch } })),
    []
  );
  const reset = useCallback(() => setConfig(DEFAULT_CONFIG), []);

  return { config, hydrated, setSoul, setProviderMode, toggleAgent, setAgentScope, setByok, setConnections, setNotify, reset };
}

// Read the opt-in customer-notify target (used outside React). Returns the chat id or null.
export function getNotify(): { telegramChatId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const n = (JSON.parse(raw) as EngineConfig).notify;
    if (n && n.telegramChatId) return { telegramChatId: n.telegramChatId };
  } catch {
    /* ignore */
  }
  return null;
}

// Fire-and-forget customer update. No-op unless the user opted in (a chat id is stored). The server
// route is itself gated on the bot token, so this is doubly safe + never throws into the caller.
export function pingCustomerUpdate(text: string): void {
  const n = getNotify();
  if (!n) return;
  try {
    void fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId: n.telegramChatId, text }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
