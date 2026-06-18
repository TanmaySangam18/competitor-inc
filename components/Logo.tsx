// competitor.inc mark — a speech bubble (companion) fused with a checkmark (proof).
// Monochrome: white mark, black knockout check. Custom SVG, not a stock icon.
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="competitor.inc"
    >
      <path d="M12.5 28 L12.5 36 L20.5 28 Z" fill="#fafafa" />
      <rect x="5" y="5" width="30" height="26" rx="8.5" fill="#fafafa" />
      <path
        d="M13 18.2 l4.7 4.7 L27.2 12.3"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
