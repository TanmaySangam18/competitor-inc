import Link from "next/link";
import type { Metadata } from "next";
import { RotateCcw, Mic, KeyRound, Download, Radio } from "lucide-react";
import JourneyExplorer from "@/components/JourneyExplorer";
import ScrollProgress from "@/components/ScrollProgress";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";

export const metadata: Metadata = {
  title: "How it works — competitor.inc",
  description:
    "From a one-sentence idea to a real, validated business — the whole journey, in plain English. No jargon.",
};

// The promises that hold underneath the whole thing — what keeps you in control.
const controls = [
  { icon: RotateCcw, title: "You're never charged for failed work", body: "Your plan includes a monthly allowance of agent-work. If a task doesn't land, its cost is credited straight back to that allowance — it's not money returned to your card, it's simply never charged. (Real ad spend runs on your own connected accounts — and an ad that didn't convert isn't a failure, it's a result you paid for.)" },
  { icon: Mic, title: "It speaks in your voice", body: "Set your tone and values once, and every agent follows them — so everything sounds like you, not a robot." },
  { icon: KeyRound, title: "Your keys, your ownership", body: "The company runs on accounts and keys you bring and control — so what it builds, spends, and earns is yours, with full privacy and cost control." },
  { icon: Download, title: "Your data is yours", body: "Export everything anytime, in one click. No lock-in, no hostage-taking, ever." },
  { icon: Radio, title: "Proof, in the open", body: "A public benchmark page stress-tests the whole governed company live on every visit — clearly labeled as simulation until real customer receipts exist. A demo is never dressed up as traction." },
];

export default function HowItWorks() {
  return (
    <LedgerShell>
      <ScrollProgress />
      <div className="mx-auto max-w-3xl px-5 pb-8 pt-16">
        <Eyebrow>THE WHOLE JOURNEY · IN PLAIN ENGLISH</Eyebrow>
        <h1 className="mt-4 text-[38px] font-medium leading-[1.1] sm:text-[44px]" style={serifStyle}>
          How it works
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
          From a one-sentence idea to a real, validated business. No jargon — here&apos;s exactly what
          happens, start to finish, and what it does for you at every step.
        </p>
      </div>

      {/* The story — 7 steps, one panel at a time (progressive disclosure) */}
      <div className="mx-auto max-w-3xl px-5 pb-8">
        <JourneyExplorer />
      </div>

      {/* The control promises */}
      <div className="border-t-[1.5px] border-ink bg-cream-2">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="text-2xl font-medium" style={serifStyle}>And you stay in control — always</h2>
          <p className="mt-2 text-sm text-ink-muted">Power is nothing without trust. These hold true the entire time.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {controls.map((c) => (
              <div key={c.title} className="press rounded-2xl bg-cream p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-rule bg-cream-2 text-ink">
                  <c.icon size={16} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="mx-auto max-w-3xl px-5 py-14 text-center">
        <h2 className="text-2xl font-medium" style={serifStyle}>Prove it before you build it.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          Start with a free validation — no card, no risk. Get an honest answer in minutes.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90"
        >
          Start free
        </Link>
      </div>
    </LedgerShell>
  );
}
