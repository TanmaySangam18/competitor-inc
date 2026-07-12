"use client";

// THE TERMINAL (2026-07-11 founder recreation: "the dashboard more like a terminal — backend raw tech
// being built"). The cockpit's hero: the org's REAL activity streamed as a raw terminal log — night ·
// role · status · what it did · proof · cost. Honest: renders only real activities (the Glass Box's data
// as a terminal); empty state says so plainly, never fakes log lines. MACHINA: near-black terminal panel,
// monospace, classic status colors.

import type { Activity, AgentRole, Company } from "@/lib/engine/types";

const ROLE_HANDLE: Record<AgentRole, string> = {
  ceo: "apex", engineering: "forge", marketing: "pitch", manufacturing: "rig",
  support: "guard", growth: "surge", finance: "ledger", legal: "counsel", ops: "pulse",
};

function glyph(s: Activity["status"]): string {
  return s === "done" ? "✓" : s === "pending-approval" ? "⏸" : "⚠";
}
function statusClass(s: Activity["status"]): string {
  return s === "done" ? "text-[#3fb950]" : s === "pending-approval" ? "text-[#d29922]" : "text-[#f85149]";
}

export default function TerminalFeed({ activities, company }: { activities: Activity[]; company: Company }) {
  const rows = activities.filter((a) => !a.undone).slice(0, 60);
  const done = activities.filter((a) => a.status === "done").length;
  const holds = activities.filter((a) => a.status === "pending-approval").length;

  return (
    <div className="border-2 border-black bg-[#0a0a0a] font-mono text-[12.5px] text-[#e6e6e6]">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
        <span>● competitor.inc // {company.name || "org"} — live feed</span>
        <span>{done} shipped · {holds} awaiting you</span>
      </div>
      <div className="max-h-[46vh] overflow-y-auto px-4 py-3 leading-[1.7]">
        {rows.length === 0 ? (
          <p className="text-white/45">$ awaiting first shift — run tonight&apos;s shift to put the org to work.</p>
        ) : (
          rows.map((a) => (
            <div key={a.id} className="whitespace-pre-wrap break-words">
              <span className="text-white/30">[n{a.night}]</span>{" "}
              <span className="font-semibold text-[#c98a6b]">{(ROLE_HANDLE[a.agent] ?? a.agent).padEnd(8)}</span>{" "}
              <span className={statusClass(a.status)}>{glyph(a.status)}</span>{" "}
              <span className="text-[#e6e6e6]">{a.action}</span>
              {a.meta && <span className="text-white/40"> · {a.meta}</span>}
              {a.proof?.value && <span className="text-[#3fb950]"> · {a.proof.kind}:{String(a.proof.value).slice(0, 44)}</span>}
              <span className="text-white/25"> · ${a.cost.toFixed(2)}</span>
            </div>
          ))
        )}
        <div className="mt-2 text-white/60">$&nbsp;<span className="inline-block h-3.5 w-2 animate-pulse bg-white/70 align-middle" /></div>
      </div>
    </div>
  );
}
