import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, GraduationCap, ShieldCheck, Wallet } from "lucide-react";
import NuCapture from "@/components/NuCapture";
import TrackBeacon from "@/components/TrackBeacon";

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
    <main id="main" className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-cream px-6 py-10 text-ink">
      <TrackBeacon slug="nu" />
      <div className="relative w-full max-w-3xl">
        <Link href="/" className="w-fit text-[15px] font-semibold" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
          competitor<span className="text-sienna">.inc</span>
        </Link>

        <div className="mt-6 flex w-fit items-center gap-2 rounded-full border border-sienna/40 bg-cream-2 px-3.5 py-1.5 text-xs font-medium text-sienna">
          <GraduationCap size={13} /> Built at Northeastern · launching on campus first
        </div>

        <h1 className="mt-5 text-4xl font-medium leading-[1.08] sm:text-5xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
          Your idea, validated <em>tonight</em>. Free for NU founders.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          competitor.inc is the AI co-founder that proves demand <span className="text-ink">before</span> you build —
          honest go / tweak / kill verdicts, real demand tests, and a crew that ships only the winner. Made by a
          Husky, tested on this campus first.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: FlaskConical, t: "Validate before code", s: "An honest read + a real demand test — before you spend a semester building." },
            { icon: ShieldCheck, t: "You approve every move", s: "Spend, posts, deploys — nothing runs without your yes. Every action logged." },
            { icon: Wallet, t: "$0 to prove it", s: "Validation is free forever. No card, no revenue share, export anytime." },
          ].map((p) => (
            <div key={p.t} className="press rounded-2xl bg-cream-2 p-4">
              <p.icon size={16} className="text-sienna" />
              <div className="mt-2 text-sm font-semibold">{p.t}</div>
              <div className="mt-1 text-xs leading-relaxed text-ink-muted">{p.s}</div>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <NuCapture />
        </div>

        <p className="mt-5 text-sm text-ink-faint">
          Can&apos;t wait?{" "}
          <Link href="/dashboard" className="text-pine underline decoration-dotted underline-offset-4 hover:decoration-solid">
            Run a free validation right now →
          </Link>
        </p>
      </div>
    </main>
  );
}
