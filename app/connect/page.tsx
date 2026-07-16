import type { Metadata } from "next";
import { connectionMapStatus, TIER_LABELS, TIER_ORDER, type ConnectionStatus, type ConnectionTier } from "@/lib/core/connections";
import { mcpStatus } from "@/lib/core/mcp-connect";

// /connect — THE FRONT DOOR (Block B, CONNECT-FIRST-RESET §2.1, ADR-0004).
// The 17-service connection map as a checklist with LIVE status. Connect T0 and the company starts;
// everything else the org ASKS for when a task truly needs it. Monochrome brutalist: white, #0a0a0a,
// hairlines, mono uppercase labels.
//
// HONESTY RULES (load-bearing):
//  - A service shows connected ONLY when its env var is actually present in this deployment — never assumed.
//  - Entries with no env detection say so ("tracked, not detected") instead of pretending.
//  - No OAuth buttons because there are no OAuth flows yet (later block). BYOK = set env vars, that's real.
//  - Server component reading process.env at REQUEST time (force-dynamic): this page reflects the FOUNDER
//    deployment's state (company #0). Per-customer key vaults come later.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "competitor.inc — connect",
  description: "Connect your accounts. The company runs itself. The 17-service connection map, with live status.",
};

const INK = "text-[#0a0a0a]";
const HAIR = "border-[#0a0a0a]/15";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-[#0a0a0a]" : "border border-[#0a0a0a] bg-transparent"}`}
    />
  );
}

function Row({ c }: { c: ConnectionStatus }) {
  return (
    <li className={`border-t ${HAIR} py-5`}>
      <div className="flex items-start gap-3">
        <Dot on={c.configured} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[15px] font-semibold tracking-tight">{c.name}</span>
            {c.required && (
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">required</span>
            )}
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em]">
              {c.configured ? "connected" : "not connected"}
              <span className="sr-only">{c.configured ? " — env var present" : " — env var absent"}</span>
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[#0a0a0a]/70">{c.purpose}</p>
          <p className="mt-2 text-[13px] leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
              {c.configured ? "unlocked — " : "without it — "}
            </span>
            {c.configured ? c.unlocks : c.degraded}
          </p>
          {c.env.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
                {c.env.length > 1 ? "set any of" : "set"}
              </span>
              {c.env.map((e) => (
                <code key={e} className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{e}</code>
              ))}
            </p>
          ) : (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
              no env detection — tracked, not detected
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ConnectPage() {
  const map = connectionMapStatus();
  const connected = map.filter((c) => c.configured).length;
  const total = map.length;
  const pct = Math.round((connected / total) * 100);
  const mcp = mcpStatus();
  const mcpConnected = mcp.filter((m) => m.configured).length;
  const byTier = (t: ConnectionTier) => map.filter((c) => c.tier === t);

  return (
    <div className={`min-h-screen bg-white ${INK}`}>
      {/* Header */}
      <header className={`flex items-center justify-between border-b ${HAIR} px-6 py-4`}>
        <a href="/" className="font-mono text-sm font-bold tracking-tight">competitor.inc</a>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
          {connected} of {total} connected
        </span>
      </header>

      {/* Hero */}
      <section className={`border-b ${HAIR} px-6 py-14`}>
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-[#0a0a0a]/50">the connection map</p>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
          Connect your accounts.<br />The company runs itself.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#0a0a0a]/70">
          Everything a software company runs on, in four tiers. Connect T0 and the company starts; the org runs
          degraded-but-honest with any subset and asks for the next connection only when a task truly needs it.
          BYOK — your accounts, your keys, your ownership.
        </p>

        {/* Progress rule */}
        <div className="mt-10">
          <div className="h-[3px] w-full bg-[#0a0a0a]/10">
            <div className="h-[3px] bg-[#0a0a0a]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
            {connected} of {total} · {pct}% of the map connected
          </p>
        </div>

        <p className="mt-8 max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-[#0a0a0a]/50">
          Live status of this deployment&apos;s environment (company #0). A service shows connected only when its
          env var is actually present — never assumed. Per-customer key vaults come in a later block.
        </p>
      </section>

      {/* Tier sections */}
      {TIER_ORDER.map((t) => (
        <section key={t} className={`border-b ${HAIR} px-6 py-10`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">
              {t} · {TIER_LABELS[t].title}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
              {TIER_LABELS[t].when}
            </span>
          </div>
          <ul>
            {byTier(t).map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ))}

      {/* The MCP long tail */}
      <section className={`border-b ${HAIR} px-6 py-10`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">the long tail · anything with an MCP server</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">
            {mcpConnected} of {mcp.length} connected
          </span>
        </div>
        <p className="mb-2 max-w-2xl text-[13px] leading-relaxed text-[#0a0a0a]/70">
          Beyond the 17: any service with an MCP server plugs into one governed pipe. Every tool call passes the
          kill switch, the policy floor, and the audit ledger before any network I/O.
        </p>
        <ul>
          {mcp.map((m) => (
            <li key={m.id} className={`border-t ${HAIR} py-5`}>
              <div className="flex items-start gap-3">
                <Dot on={m.configured} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[15px] font-semibold tracking-tight">{m.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em]">
                      {m.configured ? "connected" : "not connected"}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#0a0a0a]/70">{m.purpose}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">set</span>
                    <code className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{m.urlEnv}</code>
                    {m.tokenEnv && (
                      <>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">+ optional</span>
                        <code className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{m.tokenEnv}</code>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8">
        <p className="max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-[#0a0a0a]/50">
          BYOK — set env vars in your deployment; there are no OAuth flows yet (later block), so this page never
          shows one. Nothing here is claimed connected unless its env var is present.
        </p>
      </footer>
    </div>
  );
}
