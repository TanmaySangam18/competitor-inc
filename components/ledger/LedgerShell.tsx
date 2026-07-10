// The Company Ledger shell — one wrapper for every PUBLIC page so the whole marketing surface reads
// as one printed charter (cream stock, ink rules, serif headlines). Server-safe: pages keep their
// metadata exports; only the nav is a client island. The landing has its own bespoke copy of this.

import Link from "next/link";
import { LedgerNav } from "./LedgerNav";

export const serifStyle = { fontFamily: "var(--font-serif), Georgia, serif" } as const;

// The sienna mono eyebrow — the ledger's section marker.
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-sienna">{children}</p>;
}

export function LedgerFooter() {
  return (
    <footer className="border-t-[1.5px] border-ink">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <p className="text-[11.5px] italic text-ink-faint" style={serifStyle}>
          Operated by AI employees under human governance — every claim is verifiable.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
          <Link href="/how-it-works" className="transition hover:text-ink">How it works</Link>
          <Link href="/dashboard" className="transition hover:text-ink">Dashboard</Link>
          <Link href="/playbooks" className="transition hover:text-ink">Playbooks</Link>
          <Link href="/compare" className="transition hover:text-ink">Compare</Link>
          <Link href="/integrations" className="transition hover:text-ink">Integrations</Link>
          <Link href="/blog" className="transition hover:text-ink">Blog</Link>
          <Link href="/terms" className="transition hover:text-ink">Terms</Link>
          <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}

export function LedgerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <LedgerNav />
      <main id="main">{children}</main>
      <LedgerFooter />
    </div>
  );
}
