// components/SiteHeader.tsx — the marketing layer's shared header (ADR-0008).
//
// One minimal nav for the showcase pages (/, /org, /org/[id], /live): wordmark + the five places a
// visitor can go. Monochrome brutalist — hairline bottom border, mono labels, no color, no icons.

const NAV = [
  { href: "/org", label: "Workforce" },
  { href: "/live", label: "Live in Slack" },
  { href: "/benchmark", label: "Proof" },
  { href: "/connect", label: "Connect" },
  { href: "/services", label: "Services" },
];

export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
      <a href="/" className="shrink-0 font-mono text-lg font-semibold tracking-tight">
        competitor<span className="text-muted-2">.inc</span>
      </a>
      <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="transition hover:text-text">
            {n.label}
          </a>
        ))}
        <a
          href="/login"
          className="border border-border px-3 py-1.5 transition hover:border-text hover:text-text"
        >
          Sign in
        </a>
      </nav>
    </header>
  );
}
