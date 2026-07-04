"use client";

// The Delegation — a small, lively "situation room" in the house ink-on-cream style. The crew and the
// customer sit at a shared desk with monitors and TALK, turn by turn, about what's being built right
// now. Figures are deliberately small + cute + animated (idle bob, blinking, a hop when speaking,
// hands typing) so the floor feels alive rather than a static poster. Drop-in: same props as before.
// Original art — not copied from anywhere.

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

  const W = 1200;
  const H = 520;
  const n = seats.length;
  const margin = 120;
  const step = n > 1 ? (W - margin * 2) / (n - 1) : 0;
  const deskY = 388; // top edge of the shared desk
  const working = phase === "working";

  return (
    <div className="grid h-full w-full place-items-center overflow-hidden px-3 py-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        // Cap the size so figures stay small + cute on big screens instead of ballooning full-bleed.
        style={{ width: "100%", height: "auto", maxWidth: 1080, maxHeight: "66vh" }}
        role="img"
        aria-label="The crew and you, seated at a shared desk, discussing what's being built"
      >
        {/* soft floor shadow under the desk */}
        <ellipse cx={W / 2} cy={deskY + 96} rx={W / 2 - 60} ry={16} fill={INK} opacity={0.05} />

        <g fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          {/* the long shared desk */}
          <line x1={70} y1={deskY} x2={W - 70} y2={deskY} strokeWidth={3} />
          <line x1={104} y1={deskY} x2={104} y2={deskY + 64} opacity={0.5} />
          <line x1={W - 104} y1={deskY} x2={W - 104} y2={deskY + 64} opacity={0.5} />

          {seats.map((seat, i) => {
            const cx = margin + step * i;
            const isCustomer = seat.kind === "customer";
            const role = seat.kind === "agent" ? seat.agent.role : null;
            const speaking = !isCustomer && role === spotlight && !!speech;
            const name = isCustomer ? "You" : (seat.agent as DelegationAgent).name;
            const sub = isCustomer ? "the customer" : (seat.agent as DelegationAgent).label;
            const bubbleText = speaking ? speech!.text : null;
            return (
              <g key={i}>
                {/* the little person bobs; the speaker hops. staggered so they don't move in lockstep. */}
                <g
                  className={`dg-figure${speaking ? " dg-speaking" : ""}`}
                  style={{ animationDelay: `${(i % 5) * 0.5}s` }}
                >
                  {isCustomer ? (
                    <Human cx={cx} gender={customerGender} />
                  ) : (
                    <Robot cx={cx} speaking={speaking} working={working} />
                  )}
                </g>
                {/* a monitor on the desk in front of them — "using desktops" */}
                <Monitor cx={cx} />
                {/* name plate */}
                <text
                  x={cx}
                  y={deskY + 82}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fill={INK}
                  stroke="none"
                  fontFamily="var(--font-display, sans-serif)"
                >
                  {name}
                </text>
                <text
                  x={cx}
                  y={deskY + 100}
                  textAnchor="middle"
                  fontSize={10.5}
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

/* ── Robot (seated, small + cute, ink line-art) ─────────────────────────────
   Baseline geometry sits the head around y=250 and hands on the desk ~y=384. */
function Robot({ cx, speaking, working }: { cx: number; speaking: boolean; working: boolean }) {
  const sw = speaking ? 3 : 2.4;
  return (
    <g strokeWidth={sw}>
      {/* antenna (little bob handled by parent) */}
      <line x1={cx} y1={244} x2={cx} y2={230} />
      <circle cx={cx} cy={226} r={4} fill={INK} className={working ? "dg-antenna" : undefined} />
      {/* head — rounder + smaller = cuter */}
      <rect x={cx - 30} y={244} width={60} height={52} rx={20} fill="#fff" />
      {/* ears */}
      <rect x={cx - 37} y={262} width={8} height={18} rx={4} fill="#fff" />
      <rect x={cx + 29} y={262} width={8} height={18} rx={4} fill="#fff" />
      {/* eyes — big + blinking = cute */}
      <g className="dg-eyes">
        <circle cx={cx - 11} cy={268} r={6.5} fill="#fff" />
        <circle cx={cx + 11} cy={268} r={6.5} fill="#fff" />
        <circle cx={cx - 11} cy={268} r={3} fill={INK} stroke="none" />
        <circle cx={cx + 11} cy={268} r={3} fill={INK} stroke="none" />
      </g>
      {/* cheeks (tiny) */}
      <circle cx={cx - 20} cy={282} r={2.2} fill={INK} stroke="none" opacity={0.25} />
      <circle cx={cx + 20} cy={282} r={2.2} fill={INK} stroke="none" opacity={0.25} />
      {/* mouth — open O when speaking, gentle smile otherwise */}
      {speaking ? (
        <ellipse cx={cx} cy={286} rx={4.5} ry={5.5} fill="#fff" />
      ) : (
        <path d={`M ${cx - 8} 285 Q ${cx} 291 ${cx + 8} 285`} />
      )}
      {/* neck */}
      <line x1={cx - 7} y1={296} x2={cx - 7} y2={306} />
      <line x1={cx + 7} y1={296} x2={cx + 7} y2={306} />
      {/* torso */}
      <path d={`M ${cx - 30} 372 Q ${cx - 30} 312 ${cx - 8} 306 L ${cx + 8} 306 Q ${cx + 30} 312 ${cx + 30} 372`} fill="#fff" />
      {/* arms + little hands resting on the desk (typing) */}
      <g className="dg-hand" style={{ transformOrigin: `${cx - 22}px 372px` }}>
        <path d={`M ${cx - 30} 336 Q ${cx - 36} 366 ${cx - 20} 384`} />
      </g>
      <g className="dg-hand dg-hand-2" style={{ transformOrigin: `${cx + 22}px 372px` }}>
        <path d={`M ${cx + 30} 336 Q ${cx + 36} 366 ${cx + 20} 384`} />
      </g>
    </g>
  );
}

/* ── Human customer (man or woman), small seated line-art ───────────────────── */
function Human({ cx, gender }: { cx: number; gender: CustomerGender }) {
  return (
    <g strokeWidth={2.4}>
      {/* head */}
      <circle cx={cx} cy={272} r={23} fill="#fff" />
      {/* hair */}
      {gender === "man" ? (
        <path d={`M ${cx - 22} 266 Q ${cx - 20} 246 ${cx} 246 Q ${cx + 20} 246 ${cx + 22} 266 Q ${cx + 13} 256 ${cx} 258 Q ${cx - 13} 256 ${cx - 22} 266 Z`} fill={INK} stroke="none" />
      ) : (
        <path d={`M ${cx - 24} 290 Q ${cx - 27} 250 ${cx} 247 Q ${cx + 27} 250 ${cx + 24} 290 Q ${cx + 20} 274 ${cx + 17} 271 Q ${cx + 20} 258 ${cx} 258 Q ${cx - 20} 258 ${cx - 17} 271 Q ${cx - 20} 274 ${cx - 24} 290 Z`} fill={INK} stroke="none" />
      )}
      {/* eyes + smile */}
      <g className="dg-eyes">
        <circle cx={cx - 7.5} cy={272} r={2} fill={INK} stroke="none" />
        <circle cx={cx + 7.5} cy={272} r={2} fill={INK} stroke="none" />
      </g>
      <path d={`M ${cx - 7} 281 Q ${cx} 286 ${cx + 7} 281`} strokeWidth={2} />
      {/* neck */}
      <line x1={cx - 5.5} y1={293} x2={cx - 5.5} y2={303} />
      <line x1={cx + 5.5} y1={293} x2={cx + 5.5} y2={303} />
      {/* shoulders / torso */}
      <path d={`M ${cx - 31} 374 Q ${cx - 31} 312 ${cx - 5.5} 303 L ${cx + 5.5} 303 Q ${cx + 31} 312 ${cx + 31} 374`} fill="#fff" />
      {/* collar */}
      {gender === "man" ? (
        <>
          <path d={`M ${cx - 5.5} 303 L ${cx} 316 L ${cx + 5.5} 303`} />
          <path d={`M ${cx} 316 L ${cx - 3.5} 336 L ${cx + 3.5} 336 Z`} fill={INK} stroke="none" />
        </>
      ) : (
        <path d={`M ${cx - 8} 305 Q ${cx} 318 ${cx + 8} 305`} />
      )}
      {/* arms + hands to the desk */}
      <g className="dg-hand" style={{ transformOrigin: `${cx - 22}px 374px` }}>
        <path d={`M ${cx - 31} 338 Q ${cx - 37} 366 ${cx - 20} 384`} />
      </g>
      <g className="dg-hand dg-hand-2" style={{ transformOrigin: `${cx + 22}px 374px` }}>
        <path d={`M ${cx + 31} 338 Q ${cx + 37} 366 ${cx + 20} 384`} />
      </g>
    </g>
  );
}

/* ── Monitor / desktop on the desk in front of the sitter ───────────────────── */
function Monitor({ cx }: { cx: number }) {
  return (
    <g strokeWidth={2.4} fill="#fff">
      {/* screen */}
      <rect x={cx - 26} y={352} width={52} height={30} rx={4} />
      {/* a couple of "content" lines on the screen */}
      <line x1={cx - 18} y1={362} x2={cx + 6} y2={362} strokeWidth={2} opacity={0.5} />
      <line x1={cx - 18} y1={370} x2={cx + 14} y2={370} strokeWidth={2} opacity={0.5} />
      {/* stand */}
      <line x1={cx} y1={382} x2={cx} y2={388} />
      <line x1={cx - 9} y1={388} x2={cx + 9} y2={388} strokeWidth={2.4} />
    </g>
  );
}

/* ── Speech bubble (foreignObject lets the text wrap cleanly) ────────────── */
function SpeechBubble({ cx, text, flip }: { cx: number; text: string; flip: boolean }) {
  const w = 196;
  const h = 72;
  // Keep the bubble on-canvas: nudge toward center for edge seats.
  const bx = Math.max(8, Math.min(1200 - w - 8, cx - w / 2 + (flip ? -28 : 28)));
  const by = 150;
  const tailX = Math.max(bx + 20, Math.min(bx + w - 20, cx));
  const headTop = 226; // roughly the antenna tip
  return (
    <g className="delegation-bubble">
      <rect x={bx} y={by} width={w} height={h} rx={16} fill="#fff" stroke={INK} strokeWidth={2.6} />
      <path d={`M ${tailX - 9} ${by + h} L ${tailX + 7} ${by + h} L ${cx} ${headTop} Z`} fill="#fff" stroke={INK} strokeWidth={2.6} />
      <line x1={tailX - 9} y1={by + h} x2={tailX + 7} y2={by + h} stroke="#fff" strokeWidth={4} />
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
