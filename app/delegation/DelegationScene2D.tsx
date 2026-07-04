"use client";

// The Delegation — a flat, black-and-white line-drawing "situation room". The crew and the customer
// sit together at a long desk with laptops and TALK, turn by turn, about what's being built right
// now (speech bubbles driven by the real banter/engine state — same props as the old 3D scene, so
// this is a drop-in). No 3D, nobody walks around: they sit and discuss. The human is the customer,
// selectable man or woman. Original art — ink on cream, the house style — not copied from anywhere.

import type { AgentRole } from "@/lib/engine/types";
import type { DelegationAgent } from "@/lib/engine/delegation";

export type Phase = "idle" | "working";
export interface Speech {
  role: AgentRole;
  text: string;
}
export type CustomerGender = "man" | "woman";

export interface DelegationScene2DProps {
  phase: Phase;
  spotlight: AgentRole | null;
  speech?: Speech | null;
  agents: DelegationAgent[];
  customerGender?: CustomerGender;
}

const INK = "#14130e";

export default function DelegationScene2D({
  phase,
  spotlight,
  speech = null,
  agents,
  customerGender = "man",
}: DelegationScene2DProps) {
  // Seats: the crew, with the CUSTOMER inserted in the middle (the human is the focal point).
  const mid = Math.floor(agents.length / 2);
  type Seat = { kind: "agent"; agent: DelegationAgent } | { kind: "customer" };
  const seats: Seat[] = [
    ...agents.slice(0, mid).map((agent) => ({ kind: "agent" as const, agent })),
    { kind: "customer" as const },
    ...agents.slice(mid).map((agent) => ({ kind: "agent" as const, agent })),
  ];

  const W = 1040;
  const H = 560;
  const n = seats.length;
  const margin = 130;
  const step = n > 1 ? (W - margin * 2) / (n - 1) : 0;

  return (
    <div className="grid h-full w-full place-items-center overflow-hidden px-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        style={{ maxHeight: "100%" }}
        role="img"
        aria-label="The crew and you, seated at a shared desk, discussing what's being built"
      >
        <g
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* the long shared desk */}
          <line x1={40} y1={402} x2={W - 40} y2={402} strokeWidth={3.5} />
          <line x1={70} y1={402} x2={70} y2={470} opacity={0.5} />
          <line x1={W - 70} y1={402} x2={W - 70} y2={470} opacity={0.5} />

          {seats.map((seat, i) => {
            const cx = margin + step * i;
            const isCustomer = seat.kind === "customer";
            const role = seat.kind === "agent" ? seat.agent.role : null;
            const speaking = !isCustomer && role === spotlight && !!speech;
            const name = isCustomer ? "You" : (seat.agent as DelegationAgent).name;
            const sub = isCustomer ? "the customer" : (seat.agent as DelegationAgent).label;
            const bubbleText = speaking ? speech!.text : null;
            return (
              <g key={i} className={phase === "working" ? "delegation-live" : undefined}>
                {isCustomer ? (
                  <Human cx={cx} gender={customerGender} />
                ) : (
                  <Robot cx={cx} speaking={speaking} />
                )}
                <Laptop cx={cx} />
                {/* name plate */}
                <text
                  x={cx}
                  y={452}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={600}
                  fill={INK}
                  stroke="none"
                  fontFamily="var(--font-display, sans-serif)"
                >
                  {name}
                </text>
                <text
                  x={cx}
                  y={470}
                  textAnchor="middle"
                  fontSize={11}
                  fill={INK}
                  opacity={0.55}
                  stroke="none"
                  fontFamily="var(--font-body, sans-serif)"
                >
                  {sub}
                </text>
                {bubbleText && <SpeechBubble cx={cx} text={bubbleText} flip={i > n / 2} />}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* ── Robot (seated, upper body, ink line-art) ───────────────────────────── */
function Robot({ cx, speaking }: { cx: number; speaking: boolean }) {
  const sw = speaking ? 4 : 3;
  return (
    <g strokeWidth={sw}>
      {/* antenna */}
      <line x1={cx} y1={168} x2={cx} y2={150} />
      <circle cx={cx} cy={145} r={5} fill={INK} />
      {/* head */}
      <rect x={cx - 46} y={168} width={92} height={80} rx={26} fill="#fff" />
      {/* ears */}
      <rect x={cx - 56} y={196} width={12} height={26} rx={5} fill="#fff" />
      <rect x={cx + 44} y={196} width={12} height={26} rx={5} fill="#fff" />
      {/* eyes */}
      <circle cx={cx - 17} cy={205} r={9} fill="#fff" />
      <circle cx={cx + 17} cy={205} r={9} fill="#fff" />
      <circle cx={cx - 17} cy={205} r={4} fill={INK} stroke="none" />
      <circle cx={cx + 17} cy={205} r={4} fill={INK} stroke="none" />
      {/* mouth */}
      <path d={`M ${cx - 12} 230 Q ${cx} 238 ${cx + 12} 230`} />
      {/* neck + shoulders/torso */}
      <line x1={cx - 10} y1={248} x2={cx - 10} y2={262} />
      <line x1={cx + 10} y1={248} x2={cx + 10} y2={262} />
      <path d={`M ${cx - 44} 340 Q ${cx - 44} 268 ${cx - 12} 262 L ${cx + 12} 262 Q ${cx + 44} 268 ${cx + 44} 340`} fill="#fff" />
      {/* arms resting toward the laptop */}
      <path d={`M ${cx - 44} 300 Q ${cx - 52} 350 ${cx - 30} 384`} />
      <path d={`M ${cx + 44} 300 Q ${cx + 52} 350 ${cx + 30} 384`} />
    </g>
  );
}

/* ── Human customer (man or woman), seated line-art ─────────────────────── */
function Human({ cx, gender }: { cx: number; gender: CustomerGender }) {
  return (
    <g strokeWidth={3}>
      {/* head */}
      <circle cx={cx} cy={206} r={34} fill="#fff" />
      {/* hair */}
      {gender === "man" ? (
        <path d={`M ${cx - 33} 196 Q ${cx - 30} 168 ${cx} 168 Q ${cx + 30} 168 ${cx + 33} 196 Q ${cx + 20} 182 ${cx} 184 Q ${cx - 20} 182 ${cx - 33} 196 Z`} fill={INK} stroke="none" />
      ) : (
        <path d={`M ${cx - 35} 232 Q ${cx - 40} 176 ${cx} 172 Q ${cx + 40} 176 ${cx + 35} 232 Q ${cx + 30} 210 ${cx + 26} 206 Q ${cx + 30} 186 ${cx} 186 Q ${cx - 30} 186 ${cx - 26} 206 Q ${cx - 30} 210 ${cx - 35} 232 Z`} fill={INK} stroke="none" />
      )}
      {/* eyes + brows + smile */}
      <circle cx={cx - 11} cy={206} r={2.6} fill={INK} stroke="none" />
      <circle cx={cx + 11} cy={206} r={2.6} fill={INK} stroke="none" />
      <path d={`M ${cx - 16} 198 Q ${cx - 11} 195 ${cx - 6} 198`} strokeWidth={2.2} />
      <path d={`M ${cx + 6} 198 Q ${cx + 11} 195 ${cx + 16} 198`} strokeWidth={2.2} />
      <path d={`M ${cx - 10} 220 Q ${cx} 228 ${cx + 10} 220`} strokeWidth={2.4} />
      {/* neck */}
      <line x1={cx - 8} y1={238} x2={cx - 8} y2={252} />
      <line x1={cx + 8} y1={238} x2={cx + 8} y2={252} />
      {/* shoulders / torso */}
      <path d={`M ${cx - 46} 344 Q ${cx - 46} 262 ${cx - 8} 252 L ${cx + 8} 252 Q ${cx + 46} 262 ${cx + 46} 344`} fill="#fff" />
      {/* collar */}
      {gender === "man" ? (
        <>
          <path d={`M ${cx - 8} 252 L ${cx} 272 L ${cx + 8} 252`} />
          <path d={`M ${cx} 272 L ${cx - 5} 300 L ${cx + 5} 300 Z`} fill={INK} stroke="none" />
        </>
      ) : (
        <path d={`M ${cx - 12} 254 Q ${cx} 274 ${cx + 12} 254`} />
      )}
      {/* arms toward the laptop */}
      <path d={`M ${cx - 46} 300 Q ${cx - 54} 352 ${cx - 30} 384`} />
      <path d={`M ${cx + 46} 300 Q ${cx + 54} 352 ${cx + 30} 384`} />
    </g>
  );
}

/* ── Open laptop (drawn in front of the sitter) ─────────────────────────── */
function Laptop({ cx }: { cx: number }) {
  return (
    <g strokeWidth={3} fill="#fff">
      {/* screen leaning back */}
      <path d={`M ${cx - 32} 380 L ${cx + 32} 380 L ${cx + 27} 340 L ${cx - 27} 340 Z`} />
      {/* keyboard deck */}
      <path d={`M ${cx - 48} 400 L ${cx + 48} 400 L ${cx + 32} 380 L ${cx - 32} 380 Z`} />
    </g>
  );
}

/* ── Speech bubble (foreignObject lets the text wrap cleanly) ────────────── */
function SpeechBubble({ cx, text, flip }: { cx: number; text: string; flip: boolean }) {
  const w = 190;
  const h = 74;
  // Keep the bubble on-canvas: nudge toward center for edge seats.
  const bx = Math.max(8, Math.min(1040 - w - 8, cx - w / 2 + (flip ? -30 : 30)));
  const by = 40;
  const tailX = Math.max(bx + 20, Math.min(bx + w - 20, cx));
  return (
    <g className="delegation-bubble">
      <rect x={bx} y={by} width={w} height={h} rx={16} fill="#fff" stroke={INK} strokeWidth={3} />
      <path d={`M ${tailX - 10} ${by + h} L ${tailX + 8} ${by + h} L ${cx} 150 Z`} fill="#fff" stroke={INK} strokeWidth={3} />
      <line x1={tailX - 10} y1={by + h} x2={tailX + 8} y2={by + h} stroke="#fff" strokeWidth={5} />
      <foreignObject x={bx + 10} y={by + 6} width={w - 20} height={h - 12}>
        <div
          style={{
            font: "500 12px/1.35 var(--font-body, sans-serif)",
            color: INK,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text}
        </div>
      </foreignObject>
    </g>
  );
}
