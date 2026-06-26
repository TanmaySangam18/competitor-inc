import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { PLAYBOOKS } from "@/lib/roomie/playbooks";

export const metadata: Metadata = {
  title: "Playbooks — competitor.inc",
  description:
    "The playbooks competitor.inc runs on — validation, the honesty wedge, distribution, the path to $10K, and building on $0. Read the intro free.",
};

export default function PlaybooksIndex() {
  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mesh">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted">
            <BookOpen size={13} /> The methodology, in the open
          </span>
          <h1 className="display mt-6 text-4xl leading-[1.04] md:text-6xl">Playbooks</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            competitor.inc runs every decision on a proven playbook — so we publish them. Read the intro to
            each one free; the full playbook unlocks for $3 (coming soon).
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {PLAYBOOKS.map((p) => (
            <Link
              key={p.slug}
              href={`/playbooks/${p.slug}`}
              className="group glass-panel flex flex-col rounded-2xl p-6 transition hover:border-coral/40"
            >
              <h2 className="text-xl font-semibold leading-snug">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{p.summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-2">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} /> {p.readMins} min read
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-coral">
                  Read <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-2">
          New playbooks are written and updated by the crew — and reviewed before they're published.
        </p>
      </div>
    </div>
  );
}
