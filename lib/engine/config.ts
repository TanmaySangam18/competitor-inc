"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENTS, type AgentRole, type AgentDirective, type ByokConfig, type Connections } from "./types";

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

// Validate the SHAPE of a BYOK config before it's trusted or sent. Pure + testable. This is a
// client-side guard so a half-filled or malformed key never reaches the engine — the SERVER still
// re-checks the URL with an SSRF guard (assertSafeBaseUrl), so this is defense-in-depth, not a
// substitute. An unset config (provider: "") is "valid" in the sense of "no BYOK" — callers treat
// that as simulated, not as an error.
export function validateByok(b: Partial<ByokConfig> | null | undefined): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!b || !b.provider) return { ok: true, errors }; // unset = no BYOK, not an error
  if (b.provider !== "anthropic" && b.provider !== "openai-compatible") errors.push("Unknown provider.");
  if (!b.apiKey || !b.apiKey.trim()) errors.push("API key is required.");
  if (b.provider === "openai-compatible") {
    if (!b.baseUrl || !b.baseUrl.trim()) {
      errors.push("Base URL is required for an OpenAI-compatible provider.");
    } else {
      try {
        const u = new URL(b.baseUrl.trim());
        if (u.protocol !== "https:") errors.push("Base URL must use https://.");
      } catch {
        errors.push("Base URL isn't a valid URL.");
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

// Read the user's BYOK config from local storage (used by request senders outside React).
// Returns null unless a provider + key are set AND the shape is valid, so a malformed key falls
// back to simulated rather than getting sent to the engine.
export function getByok(): ByokConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const b = (JSON.parse(raw) as EngineConfig).byok;
    if (b && b.provider && b.apiKey && validateByok(b).ok) return b;
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

// Read the founder's brand voice (soul.md) for injection into every agent call (validate/sell/shift/
// chat) — so "the DNA every agent inherits" is literally true, not just saved. Returns undefined when
// unset/empty (engine then runs its built-in default voice).
export function getSoul(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const soul = (JSON.parse(raw) as EngineConfig).soul;
    return typeof soul === "string" && soul.trim() ? soul.trim().slice(0, 800) : undefined;
  } catch {
    return undefined;
  }
}

// Read the "Your team" toggles/scopes as an AgentDirective the engine actually enforces. Returns
// undefined in the default case (every agent enabled, no scope narrowed) so the request is byte-identical
// to today — the directive only rides along once the founder has disabled an agent or narrowed a scope.
export function getAgentDirective(): AgentDirective | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const agents = (JSON.parse(raw) as EngineConfig).agents;
    if (!agents || typeof agents !== "object") return undefined;
    const enabled = ROLES.filter((r) => agents[r]?.enabled ?? true);
    const scopes: Partial<Record<AgentRole, string>> = {};
    for (const r of enabled) {
      const s = agents[r]?.scope?.trim();
      if (s && s !== AGENTS[r].blurb) scopes[r] = s.slice(0, 240); // only send CUSTOM (changed) scopes
    }
    const allOn = enabled.length === ROLES.length;
    const noCustom = Object.keys(scopes).length === 0;
    if (allOn && noCustom) return undefined; // default → no-op, identical to today
    return { enabled, scopes: noCustom ? undefined : scopes };
  } catch {
    return undefined;
  }
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
            // Merge PER-ROLE, not wholesale: a config saved before a new agent existed (e.g. finance/
            // legal/ops added 2026-07-06) is missing those keys — using it as-is makes config.agents[role]
            // undefined and crashes "Your team". Keep saved state for known roles; default any missing one.
            agents: ROLES.reduce((acc, r) => {
              const saved = (parsed.agents as Partial<Record<AgentRole, AgentConfig>> | undefined)?.[r];
              acc[r] = saved && typeof saved === "object" ? { ...DEFAULT_CONFIG.agents[r], ...saved } : DEFAULT_CONFIG.agents[r];
              return acc;
            }, {} as Record<AgentRole, AgentConfig>),
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

// ChatOps: push a consequential approval to the opted-in channel with Approve/Reject buttons. No-op
// unless a channel is connected; the server route is gated on the bot token. Fire-and-forget.
export function pingApprovalRequest(approval: {
  id: string; title: string; agent?: string; kind?: string; detail?: string; amount?: number; company?: string;
}): void {
  const n = getNotify();
  if (!n) return;
  try {
    void fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId: n.telegramChatId, approval }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

// Poll which of these approval ids were decided out-of-band (e.g. tapped in Telegram). Returns id →
// "approved"|"rejected". Empty unless the user opted in; the caller applies each via resolveApproval.
export async function fetchApprovalDecisions(ids: string[]): Promise<Record<string, string>> {
  if (!getNotify() || ids.length === 0) return {};
  try {
    const res = await fetch(`/api/telegram/decisions?ids=${encodeURIComponent(ids.join(","))}`);
    const d = await res.json().catch(() => ({}));
    return (d?.decisions as Record<string, string>) ?? {};
  } catch {
    return {};
  }
}
