"use client";

// The Company Ledger nav (client: the CTA flips on auth state). Used by every PUBLIC page via
// LedgerShell; the landing keeps its own copy (it adds the SecretHouseDoor around the wordmark).

import Link from "next/link";
import { useAuth } from "@/lib/engine/useAuth";

export const serif = { fontFamily: "var(--font-serif), Georgia, serif" } as const;

export function LedgerNav() {
  const { user, ready } = useAuth();
  const appHref = user ? "/dashboard" : "/signup";
  return (
    <header className="border-b-[1.5px] border-ink bg-cream">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-[17px] font-semibold" style={serif}>
          competitor<span className="text-sienna">.inc</span>
        </Link>
        <nav className="flex items-center gap-5">
          {ready && !user && (
            <Link href="/login" className="text-[13px] text-ink-muted transition hover:text-ink">Sign in</Link>
          )}
          <Link href={appHref} className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-cream transition hover:opacity-90">
            Start your company
          </Link>
        </nav>
      </div>
    </header>
  );
}
