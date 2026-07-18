// The Company Ledger shell. After the ADR-0009 simplification only /decisions (the Executive Inbox —
// an app surface embedded by the coworker desktop app) still wears it; the public marketing layer
// uses SiteHeader/SiteFooter. Server-safe: pages keep their metadata exports; only the nav is a
// client island.

import Link from "next/link";
import { LedgerNav } from "./LedgerNav";

export const serifStyle = { fontFamily: "var(--font-serif), Georgia, serif" } as const;

// The sienna mono eyebrow — the ledger's section marker.
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-sienna">{children}</p>;
}

function LedgerFooter() {
  return (
    <footer className="border-t-[1.5px] border-ink">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <p className="text-[11.5px] italic text-ink-faint" style={serifStyle}>
          Operated by AI employees under human governance — every claim is verifiable.
        </p>
        {/* ADR-0009: pruned to live routes only — the legacy content pages this footer pointed at were
            killed + redirected in the simplification pass. */}
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
          <Link href="/" className="transition hover:text-ink">Home</Link>
          <Link href="/dashboard" className="transition hover:text-ink">Dashboard</Link>
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
