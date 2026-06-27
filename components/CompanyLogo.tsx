import { monogram } from "@/lib/engine/logo";

// Renders a company's deterministic monogram (see lib/engine/logo.ts). Pure SVG, no client JS needed.
export function CompanyLogo({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const m = monogram(name);
  const gid = `cg${m.hue}-${m.hue2}`; // shared across identical companies (same gradient) — safe
  const fontSize = m.initials.length > 1 ? 40 : 50;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${name} logo`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${m.hue} 55% 58%)`} />
          <stop offset="100%" stopColor={`hsl(${m.hue2} 52% 44%)`} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="26" fill={`url(#${gid})`} />
      <text
        x="50"
        y="52"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="#fff"
        fontFamily="var(--font-display, ui-sans-serif), sans-serif"
      >
        {m.initials}
      </text>
    </svg>
  );
}
