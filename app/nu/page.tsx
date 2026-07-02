import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, GraduationCap, ShieldCheck, Wallet } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import NuCapture from "@/components/NuCapture";

export const metadata: Metadata = {
  title: "competitor.inc × Northeastern — prove your idea before you build it",
  description:
    "The AI co-founder for Northeastern student founders. Validate your idea free tonight — honest verdicts, real demand tests, and a crew that builds only the winner.",
};

// The beachhead page (Crossing the Chasm: win ONE campus before the world; Blond: start with the
// warmest circle). Deliberately ONE viewport — the whole pitch, proof, and ask with zero scrolling:
// this page is also the demo of the product's design philosophy.
export default function NuPage() {
  return (
    <main id="main" className="relative grid min-h-[100dvh] place-items-center overflow-hidden mesh px-6 py-10">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
          <LogoMark size={22} /> competitor.inc
        </Link>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-coral/30 bg-coral/[0.07] px-3.5 py-1.5 text-xs font-medium text-coral">
          <GraduationCap size={13} /> Built at Northeastern · launching on campus first
        </div>

        <h1 className="display mt-5 text-4xl leading-[1.05] sm:text-5xl">
          Your idea, validated <span className="text-coral">tonight</span>. Free for NU founders.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          competitor.inc is the AI co-founder that proves demand <span className="text-text">before</span> you build —
          honest go / tweak / kill verdicts, real demand tests, and a crew that ships only the winner. Made by a
          Husky, tested on this campus first.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: FlaskConical, t: "Validate before code", s: "An honest read + a real demand test — before you spend a semester building." },
            { icon: ShieldCheck, t: "You approve every move", s: "Spend, posts, deploys — nothing runs without your yes. Every action logged." },
            { icon: Wallet, t: "$0 to prove it", s: "Validation is free forever. No card, no revenue share, export anytime." },
          ].map((p) => (
            <div key={p.t} className="rounded-2xl border border-border bg-surface/50 p-4">
              <p.icon size={16} className="text-coral" />
              <div className="mt-2 text-sm font-semibold">{p.t}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">{p.s}</div>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <NuCapture />
        </div>

        <p className="mt-5 text-sm text-muted-2">
          Can&apos;t wait?{" "}
          <Link href="/dashboard" className="text-coral underline-offset-2 hover:underline">
            Run a free validation right now →
          </Link>
        </p>
      </div>
    </main>
  );
}
