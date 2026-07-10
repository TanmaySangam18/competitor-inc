import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PLAYBOOKS } from "@/lib/engine/playbooks";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";

export const metadata: Metadata = {
  title: "Playbooks — competitor.inc",
  description:
    "The playbooks competitor.inc runs on — validation, the honesty wedge, distribution, the path to $10K, and building on $0. Read the intro free.",
};

export default function PlaybooksIndex() {
  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-5 py-14">
        <Eyebrow>THE METHODOLOGY · IN THE OPEN</Eyebrow>
        <h1 className="mt-4 text-[34px] font-medium" style={serifStyle}>Playbooks</h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          competitor.inc runs every decision on a proven playbook — so we publish them. Read the intro to
          each one free; the full playbook unlocks for $3 (coming soon).
        </p>

        <div className="mt-8">
          {PLAYBOOKS.map((p, i) => (
            <Link
              key={p.slug}
              href={`/playbooks/${p.slug}`}
              className={`group block border-t border-rule px-1 py-5 transition hover:bg-cream-2 ${i === PLAYBOOKS.length - 1 ? "border-b" : ""}`}
            >
              <h2 className="text-lg font-medium leading-snug" style={serifStyle}>{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.summary}</p>
              <div className="mt-2.5 flex items-center justify-between text-xs text-ink-faint">
                <span className="inline-flex items-center gap-1.5"><Clock size={12} /> {p.readMins} min read</span>
                <span className="font-medium text-pine">Read →</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-faint">
          New playbooks are written and updated by the crew — and reviewed before they&apos;re published.
        </p>
      </div>
    </LedgerShell>
  );
}
