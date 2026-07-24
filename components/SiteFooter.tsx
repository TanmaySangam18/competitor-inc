// components/SiteFooter.tsx — the marketing layer's shared footer (ADR-0008).
//
// The badge (the growth lever — lib/core/badge.ts injects the same pill into every product the company
// ships) + the real routes. Monochrome, hairline top border, no color, no emoji.

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/org", label: "Workforce" },
  { href: "/live", label: "Live in Slack" },
  { href: "/benchmark", label: "Proof" },
  { href: "/connect", label: "Connect" },
  { href: "/services", label: "Services" },
  { href: "/trust", label: "Trust center" },
  { href: "/verify", label: "Verify a receipt" },
  { href: "/notices", label: "Third-party notices" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-center gap-4">
          {/* the same pill lib/core/badge.ts injects into every product the company ships */}
          <span className="inline-flex items-center bg-coral px-3.5 py-2 font-mono text-xs font-semibold text-bg">
            Built with competitor<span className="opacity-70">.inc</span>
          </span>
          <p className="text-xs leading-relaxed text-muted-2">
            Every product the company ships carries this badge — honest attribution that links home.
          </p>
        </div>
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>
        <p className="mt-6 text-[11px] text-muted-2">
          competitor.inc — an autonomous AI software company, governed by a human.
        </p>
        <p className="mt-2 font-mono text-[11px] text-muted-2">
          Founder: Tanmay Sangam ·{" "}
          <a href="https://www.linkedin.com/in/tanmaysangam/" target="_blank" rel="noopener noreferrer" className="transition hover:text-text">LinkedIn ↗</a>{" "}·{" "}
          <a href="https://tanmaysangam.vercel.app/" target="_blank" rel="noopener noreferrer" className="transition hover:text-text">Portfolio ↗</a>
        </p>
      </div>
    </footer>
  );
}
