"use client";

// Compact pixel-art crew — replaces the full-screen /delegation page with a small "glass box" that lives
// inside the dashboard/watch. Each agent is a tiny pixel-art bot tinted its identity color; tap one to
// see its job. Dense + no-scroll-friendly (a bounded grid, not a page). Pure presentational.

import { useState } from "react";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { modelForAgent } from "@/lib/engine/per-agent-model-routing";

// Per-agent identity colors (match the office floor in delegation.ts).
const COLOR: Record<AgentRole, string> = {
  ceo: "#ff7a59", engineering: "#5b8cff", marketing: "#ffb84d", support: "#46d39a",
  growth: "#a78bfa", manufacturing: "#8a99ab", ops: "#6ac4d0", finance: "#3fbf87", legal: "#e879a6",
};

// A tiny pixel-art bot on a 9-col grid. X/A = body/antenna (agent color); E/M = eyes/mouth (knockout).
const SPRITE = [
  "....A....",
  "...AAA...",
  "....A....",
  ".XXXXXXX.",
  ".XEX.XEX.",
  ".XXXXXXX.",
  ".X.MMM.X.",
  ".XXXXXXX.",
  "..X...X..",
];

function PixelBot({ color, size = 40 }: { color: string; size?: number }) {
  const cols = 9;
  const u = size / cols;
  const rects: React.ReactNode[] = [];
  SPRITE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const fill = ch === "E" || ch === "M" ? "var(--color-bg, #0b0b0b)" : color;
      rects.push(<rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.4} height={u + 0.4} fill={fill} />);
    }
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size * (SPRITE.length / cols)}`} shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}

export function PixelCrew({ roles, className = "" }: { roles: AgentRole[]; className?: string }) {
  const [open, setOpen] = useState<AgentRole | null>(null);
  const list = roles.filter((r) => AGENTS[r]);
  const sel = open ? AGENTS[open] : null;
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">Your crew</h2>
        <span className="text-[11px] text-muted-2">Tap a bot for its job</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {list.map((role) => {
          const A = AGENTS[role];
          const active = open === role;
          return (
            <button
              key={role}
              onClick={() => setOpen(active ? null : role)}
              title={`${A.name} · ${A.label}`}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 transition ${active ? "border-text bg-surface" : "border-border hover:border-text/50"}`}
            >
              <PixelBot color={COLOR[role] ?? "#8a99ab"} size={38} />
              <span className="max-w-full truncate text-[11px] font-medium">{A.name}</span>
              <span className="max-w-full truncate text-[10px] text-muted-2">{A.label}</span>
            </button>
          );
        })}
      </div>
      {sel && open && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: COLOR[open] }} />
            <span className="font-medium">{sel.name} · {sel.label}</span>
            <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-2">{modelForAgent(open)}</span>
          </div>
          <p className="mt-1.5 text-muted">{sel.blurb}</p>
          <p className="mt-1 text-[11px] text-muted-2">Plays <span className="text-muted">{sel.playbook}</span></p>
        </div>
      )}
    </div>
  );
}
