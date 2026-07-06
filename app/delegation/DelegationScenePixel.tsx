"use client";

// The Delegation floor as it was meant to be: tiny PIXEL bots that ROAM around inside a glass box and
// TALK (speech bubbles), instead of the big seated cartoon crew. Small, alive, on-brand (ink-on-cream +
// per-agent color). Drop-in: SAME props as DelegationScene2D, so /delegation just swaps the import.
// Original pixel art — the 9×9 sprite matches components/PixelCrew.

import { useEffect, useMemo, useState } from "react";
import type { AgentRole } from "@/lib/engine/types";
import type { DelegationAgent } from "@/lib/engine/delegation";
import { toneHex } from "@/lib/engine/delegation";

export type Phase = "idle" | "working";
export interface Speech {
  role: AgentRole;
  text: string;
}
export type CustomerGender = "man" | "woman";
export interface DelegationScenePixelProps {
  phase: Phase;
  spotlight: AgentRole | null;
  speech?: Speech | null;
  agents: DelegationAgent[];
  customerGender?: CustomerGender;
}

const INK = "#14130e";

// 9×9 robot: A=antenna, X=body, E=eyes, M=mouth (eyes/mouth knock out to the bg color).
const BOT = [
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

// 9×9 human (the customer): P=hair, F=skin, S=suit. Woman variant widens the hair.
const humanSprite = (g: CustomerGender) =>
  g === "woman"
    ? ["..PPPPP..", ".PFFFFFP.", ".PFFFFFP.", "..FFFFF..", "...FFF...", "..SSSSS..", ".SSSSSSS.", "..S...S..", ".SS...SS."]
    : ["...PPP...", "..PFFFP..", "..FFFFF..", "..FFFFF..", "...FFF...", "..SSSSS..", ".SSSSSSS.", "..S...S..", ".SS...SS."];

function Sprite({ rows, palette, size }: { rows: string[]; palette: Record<string, string>; size: number }) {
  const u = size / 9;
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const fill = palette[ch];
      if (!fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.5} height={u + 0.5} fill={fill} />);
    }
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
      {rects}
    </svg>
  );
}

type Member = { id: string; name: string; color: string; kind: "agent" | "you" };
type Pt = { x: number; y: number };

export default function DelegationScenePixel({
  phase,
  spotlight,
  speech = null,
  agents,
  customerGender = "man",
}: DelegationScenePixelProps) {
  // Members = the crew with the customer inserted in the middle (the human is the focal point).
  const members: Member[] = useMemo(() => {
    const mid = Math.floor(agents.length / 2);
    const a = agents.map((ag) => ({ id: ag.role as string, name: ag.name, color: toneHex(ag.tone), kind: "agent" as const }));
    return [...a.slice(0, mid), { id: "you", name: "You", color: INK, kind: "you" as const }, ...a.slice(mid)];
  }, [agents]);

  // Roaming: every tick each member (except whoever's talking) wanders to a new spot; a CSS transition
  // glides them there so the floor feels alive. Faster milling while a shift is working.
  const [pos, setPos] = useState<Record<string, Pt>>({});
  const speakingId = speech?.role as string | undefined;
  useEffect(() => {
    const roam = () =>
      setPos((prev) => {
        const next: Record<string, Pt> = { ...prev };
        for (const m of members) {
          if (m.id === speakingId && prev[m.id]) continue; // the talker holds still so the bubble reads
          next[m.id] = { x: 9 + Math.random() * 78, y: 20 + Math.random() * 56 };
        }
        return next;
      });
    roam();
    const iv = setInterval(roam, phase === "working" ? 2300 : 3300);
    return () => clearInterval(iv);
  }, [members, phase, speakingId]);

  const bubble = speech && speech.text ? speech.text.slice(0, 120) : "";

  return (
    <div className="grid h-full w-full place-items-center p-4">
      {/* The glass box — a bounded room the bots roam inside (no page scroll). */}
      <div className="glass-panel relative aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-3xl">
        {/* floor line + faint grid for depth */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ background: "radial-gradient(120% 90% at 50% 8%, transparent 60%, rgba(0,0,0,0.05))" }} />
        <div className="pointer-events-none absolute inset-x-6 bottom-[16%] h-px bg-border" />
        <span className="absolute left-4 top-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-2">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-text" /> The floor · {phase === "working" ? "shipping" : "live"}
        </span>

        {members.map((m, i) => {
          const p = pos[m.id] ?? { x: 12 + (i * 74) / Math.max(1, members.length - 1), y: 55 };
          const talking = m.id === speakingId;
          const dim = spotlight && !talking ? 0.55 : 1;
          const size = m.kind === "you" ? 44 : 46;
          const palette: Record<string, string> =
            m.kind === "you"
              ? { P: INK, F: "#e8b98c", S: m.color }
              : { A: m.color, X: m.color, E: "var(--color-bg, #f3eee2)", M: "var(--color-bg, #f3eee2)" };
          const rows = m.kind === "you" ? humanSprite(customerGender) : BOT;
          return (
            <div
              key={m.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
                transition: "left 2.4s ease-in-out, top 2.4s ease-in-out, opacity .4s",
                opacity: dim,
                zIndex: talking ? 30 : 10,
              }}
            >
              {/* speech bubble */}
              {talking && bubble && (
                <div className="delegation-bubble absolute bottom-full mb-2 w-max max-w-[15rem] -translate-y-1 rounded-xl border border-border bg-[var(--color-panel,#fffdf7)] px-2.5 py-1.5 text-[11px] leading-snug text-text shadow-sm">
                  {bubble}
                  <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-border bg-[var(--color-panel,#fffdf7)]" />
                </div>
              )}
              {/* the bot, with an idle bob; a ring when speaking */}
              <div
                style={{ animation: `botBob ${2.2 + (i % 3) * 0.35}s ease-in-out infinite`, filter: talking ? "drop-shadow(0 0 0.5px rgba(0,0,0,0.4))" : undefined }}
                className={talking ? "rounded-full ring-2 ring-text/40" : undefined}
              >
                <Sprite rows={rows} palette={palette} size={size} />
              </div>
              {/* little shadow */}
              <div className="mt-0.5 h-1 w-6 rounded-full bg-black/15 blur-[1px]" />
              {/* name tag */}
              <span className={`mt-1 rounded px-1.5 py-0.5 font-mono text-[9px] ${talking ? "bg-text text-bg" : "text-muted-2"}`}>
                {m.name}
              </span>
            </div>
          );
        })}

        <style>{`@keyframes botBob { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-3px) } }`}</style>
      </div>
    </div>
  );
}
