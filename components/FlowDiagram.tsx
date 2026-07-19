import { orgSize } from "@/lib/org/organization";

// components/FlowDiagram.tsx — THE FLOW, DRAWN (ADR-0016). A monochrome sequence diagram in the
// ChatGPT-document style: bordered rectangular lifeline boxes top and bottom, thin vertical lifelines,
// horizontal labeled arrows, self-loop arrows for the org's internal steps. Pure SVG — no diagram
// library, no client JS. Colors come ONLY from the theme tokens (CSS variables), so the next reskin
// flips this diagram with the rest of the site. GOTCHA: var() does not resolve inside SVG presentation
// ATTRIBUTES (fill="var(…)" silently fails) — every color here lives in a style prop, which is CSS.
//
// HONESTY (load-bearing): every label is verified against the codebase — the role count is COMPUTED
// from lib/org/organization.ts (never hardcoded); "loop engine" = lib/loop/loop-engine.ts; "regression
// wall" = lib/core/separation.ts; "5 rails" = lib/org/publishing-mandate.ts (ADR-0012); the founder
// floor (money, contracts, launches) = the Tier-3 policy floor (ADR-0013); "hash-chained ledger" =
// lib/core/audit.ts; "cited" support = lib/core/operate.ts (cite-or-abstain). Do not add an arrow
// this codebase cannot back.

// Lifeline x-centers (SVG user units). Five actors, evenly spaced.
const X = { you: 100, platform: 317, org: 534, slack: 751, customer: 968 };
const BOX_W = 170;
const BOX_H = 44;
const TOP_Y = 12; // top boxes
const LIFE_TOP = TOP_Y + BOX_H; // lifelines start
const BOTTOM_Y = 488; // bottom boxes
const VIEW_W = 1068;
const VIEW_H = BOTTOM_Y + BOX_H + 12;

// Style objects (CSS, so var() resolves — see the gotcha above). The halo (paint-order: stroke in the
// page background color) keeps labels legible where they cross a lifeline — the document trick.
const boxStyle: React.CSSProperties = {
  fill: "var(--color-surface)",
  stroke: "var(--color-text)",
  strokeWidth: 1,
};
const actorTextStyle: React.CSSProperties = {
  fill: "var(--color-text)",
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: 13,
  fontWeight: 600,
};
const lifelineStyle: React.CSSProperties = {
  stroke: "rgba(255, 255, 255, 0.25)", // the strong-border tone, so lifelines read on the charcoal
  strokeWidth: 1,
};
const arrowStyle: React.CSSProperties = {
  stroke: "var(--color-text)",
  strokeWidth: 1.2,
  fill: "none",
};
const labelStyle: React.CSSProperties = {
  fill: "var(--color-text)",
  fontFamily: "var(--font-body), Inter, sans-serif",
  fontSize: 12,
  stroke: "var(--color-bg)",
  strokeWidth: 8,
  strokeLinejoin: "round",
  paintOrder: "stroke",
};

function ActorBox({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - BOX_W / 2} y={y} width={BOX_W} height={BOX_H} rx={6} style={boxStyle} />
      <text x={x} y={y + BOX_H / 2 + 4.5} textAnchor="middle" style={actorTextStyle}>
        {label}
      </text>
    </g>
  );
}

// A horizontal message arrow (either direction — the marker auto-orients) with its label above.
function Arrow({ from, to, y, label }: { from: number; to: number; y: number; label: string }) {
  return (
    <g>
      <text x={(from + to) / 2} y={y - 9} textAnchor="middle" style={labelStyle}>
        {label}
      </text>
      <line x1={from} y1={y} x2={to} y2={y} style={arrowStyle} markerEnd="url(#fd-arrow)" />
    </g>
  );
}

// A self-loop on one lifeline — the org's internal step. Loops out right, back in with an arrowhead.
function SelfLoop({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const w = 34; // how far the loop bulges out
  const h = 28; // loop height
  return (
    <g>
      <path
        d={`M ${x} ${y} H ${x + w - 8} Q ${x + w} ${y} ${x + w} ${y + 8} V ${y + h - 8} Q ${x + w} ${y + h} ${x + w - 8} ${y + h} H ${x}`}
        style={arrowStyle}
        markerEnd="url(#fd-arrow)"
      />
      {lines.map((line, i) => (
        <text key={line} x={x + w + 10} y={y + 6 + i * 15} style={labelStyle}>
          {line}
        </text>
      ))}
    </g>
  );
}

export default function FlowDiagram() {
  const actors: Array<{ x: number; label: string }> = [
    { x: X.you, label: "You (founder)" },
    { x: X.platform, label: "competitor.inc" },
    { x: X.org, label: `AI org (${orgSize()} roles)` },
    { x: X.slack, label: "Slack" },
    { x: X.customer, label: "Your customer" },
  ];

  return (
    <figure>
      {/* Scrolls horizontally inside its container on small screens; min-width keeps the text legible. */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full min-w-[960px]"
          role="img"
          aria-label={`Sequence diagram of the end-to-end flow: you connect accounts to competitor.inc; the loop engine hands objectives to the AI org (${orgSize()} roles); the org plans, builds, and tests; leads approve routine work in-department in Slack; only money, contracts, and launches reach you; the org deploys and verifies with receipts on the hash-chained ledger; the product ships to your customer with cited support answers; revenue settles in your accounts.`}
        >
          <defs>
            <marker id="fd-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" style={{ fill: "var(--color-text)" }} />
            </marker>
          </defs>

          {/* thin vertical lifelines */}
          {actors.map((a) => (
            <line key={a.label} x1={a.x} y1={LIFE_TOP} x2={a.x} y2={BOTTOM_Y} style={lifelineStyle} />
          ))}

          {/* the eight governed steps, top to bottom */}
          <Arrow from={X.you} to={X.platform} y={104} label="Connect accounts (BYOK)" />
          <Arrow from={X.platform} to={X.org} y={148} label="Objectives from the loop engine" />
          <SelfLoop x={X.org} y={184} lines={["Plan → build → test", "(regression wall)"]} />
          <Arrow from={X.org} to={X.slack} y={256} label="Leads approve in-department (5 rails)" />
          <Arrow from={X.slack} to={X.you} y={300} label="@founder — only money, contracts, launches" />
          <SelfLoop x={X.org} y={336} lines={["Deploy + verify", "(receipts, hash-chained ledger)"]} />
          <Arrow from={X.org} to={X.customer} y={408} label="Product ships; support answers, cited" />
          <Arrow from={X.customer} to={X.you} y={452} label="Revenue settles in YOUR accounts" />

          {/* bordered rectangular lifeline boxes, top and bottom — the document style */}
          {actors.map((a) => (
            <ActorBox key={`top-${a.label}`} x={a.x} y={TOP_Y} label={a.label} />
          ))}
          {actors.map((a) => (
            <ActorBox key={`bottom-${a.label}`} x={a.x} y={BOTTOM_Y} label={a.label} />
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] leading-relaxed text-muted-2">
        The real flow — every arrow is a governed action on the audit ledger.
      </figcaption>
    </figure>
  );
}
