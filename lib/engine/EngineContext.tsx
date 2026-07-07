"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useEngine } from "./useEngine";

// One engine instance per provider. The dashboard previously mounted `useEngine()` TWICE (the page + the
// CrewBox rendered inside it), i.e. two independent in-memory stores + two sync hooks racing on the same
// localStorage key and DB rows. Harmless under best-effort sync (CrewBox is read-only), but a correctness
// hazard once writes become server-authoritative (two optimistic-write/rollback machines + two realtime
// subscriptions on the same rows). This provider makes the whole dashboard subtree share ONE engine.
type EngineApi = ReturnType<typeof useEngine>;

const EngineCtx = createContext<EngineApi | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const engine = useEngine();
  return <EngineCtx.Provider value={engine}>{children}</EngineCtx.Provider>;
}

// Consumes the shared engine. Throws if used outside a provider — deliberate: every surface that mutates or
// subscribes must go through the single instance. CrewBox's only real mount is the dashboard (both /delegation
// and /watch are retired redirects), so no fallback is needed.
export function useEngineContext(): EngineApi {
  const ctx = useContext(EngineCtx);
  if (!ctx) throw new Error("useEngineContext must be used within <EngineProvider>");
  return ctx;
}
