"use client";

// THE ONBOARDING SURFACE (MACHINA theme) — the founder's one rule made visible: connect your accounts,
// the org sets itself up. Reads the LIVE readiness from /api/engine ([[zero-config-onboarding]]) — what the
// org can do right now + the single highest-value next connection, phrased as an outcome, never a setting.
// Connect actions route to /integrations (where connection status is real). Zero jargon by construction.
// MACHINA aesthetic: pure black/white, monospace, zero-radius, giant uppercase display, system ticker.

import { useEffect, useState } from "react";

interface NextStep { connect: string; unlocks: string }
interface Readiness { level: string; headline: string; can: string[]; nextStep: NextStep | null }
interface Connector { id: string; label: string; consequential: boolean }
interface ConnectorStatus { connector: Connector; connected: boolean }
interface EngineInfo { readiness?: Readiness; connectors?: ConnectorStatus[] }

export default function ConnectPage() {
  const [info, setInfo] = useState<EngineInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/engine")
      .then((r) => r.json())
      .then((j) => setInfo(j as EngineInfo))
      .catch(() => setFailed(true));
  }, []);

  const readiness = info?.readiness;
  const connectors = info?.connectors ?? [];
  const connectedCount = connectors.filter((c) => c.connected).length;

  return (
    <div className="min-h-screen bg-white font-mono text-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b-2 border-black px-6 py-4">
        <span className="text-lg font-bold tracking-tight">competitor<span className="text-[#8C3A22]">.inc</span></span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-black/60">
          {readiness ? `■ ${connectedCount}/${connectors.length} connected` : "■ reading status"}
        </span>
      </header>

      {/* Hero — the brand promise (fixed) + the live status (honest) */}
      <section className="border-b-2 border-black px-6 py-14">
        <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/50">■ Connect once</p>
        <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tighter sm:text-7xl">
          Connect.<br />We handle<br />the rest.
        </h1>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-black/70">
          {failed
            ? "Couldn't read status right now — refresh in a moment."
            : readiness
              ? readiness.headline
              : "Reading what's connected…"}
        </p>
      </section>

      {/* What the org can do RIGHT NOW */}
      <section className="border-b-2 border-black px-6 py-10">
        <h2 className="mb-5 text-[11px] uppercase tracking-[0.25em] text-black/50">Right now, the org can</h2>
        {readiness && readiness.can.length > 0 ? (
          <ul className="space-y-3">
            {readiness.can.map((c) => (
              <li key={c} className="flex items-baseline gap-3 text-base">
                <span aria-hidden className="text-[#1F5130]">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-black/60">Nothing yet — connect an account below and it comes online.</p>
        )}
      </section>

      {/* The single highest-value next step — an OUTCOME, not a setting */}
      {readiness?.nextStep && (
        <section className="bg-black px-6 py-12 text-white">
          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-white/50">Do this next</p>
          <p className="max-w-2xl text-2xl font-bold leading-snug">
            Connect {readiness.nextStep.connect} — {readiness.nextStep.unlocks}.
          </p>
          <a
            href="/integrations"
            className="mt-6 inline-block border-2 border-white px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-black"
          >
            Connect →
          </a>
        </section>
      )}

      {/* The connections — label + honest status, connect routes to where it's real */}
      <section className="px-6 py-10">
        <h2 className="mb-5 text-[11px] uppercase tracking-[0.25em] text-black/50">Your connections</h2>
        <ul>
          {connectors.map(({ connector, connected }) => (
            <li key={connector.id} className="flex items-center justify-between border-t border-black/15 py-4 last:border-b">
              <span className="text-base">{connector.label}</span>
              {connected ? (
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1F5130]">Connected</span>
              ) : (
                <a href="/integrations" className="text-[11px] font-bold uppercase tracking-[0.15em] text-black underline underline-offset-4 hover:text-[#8C3A22]">
                  Connect →
                </a>
              )}
            </li>
          ))}
          {connectors.length === 0 && <li className="py-4 text-sm text-black/50">Loading connections…</li>}
        </ul>
      </section>

      {/* Footer voice */}
      <footer className="border-t-2 border-black px-6 py-8 text-[11px] uppercase tracking-[0.2em] text-black/50">
        Connect once — the org runs the rest. You approve anything that leaves the building.
      </footer>
    </div>
  );
}
