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
  const fontSize = m.initials.length > 1 ? 40 : 50;
  // Ink monogram (monochrome pass): a black inverted card with cream initials — same emphasis
  // language as the rest of the system, no auto-generated gradient.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${name} logo`}
    >
      <rect x="2" y="2" width="96" height="96" rx="26" fill="#14130e" />
      <text
        x="50"
        y="52"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="#f7f0da"
        fontFamily="var(--font-display, ui-sans-serif), sans-serif"
      >
        {m.initials}
      </text>
    </svg>
  );
}
