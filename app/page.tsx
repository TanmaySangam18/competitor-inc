import type { Metadata } from "next";
import LandingInput from "@/components/LandingInput";

// THE LANDING (/) — ONE screen, no scroll (2026-07-11 founder recreation: "too much scrolling… confusing").
// Stripped to the essence: what it is + the single action (describe your software). MACHINA theme. The
// depth (how it works, the Glass Box, receipts) lives behind ONE link, never inline. Fixed viewport:
// header + centered hero + footer, nothing to scroll.

export const metadata: Metadata = {
  title: "competitor.inc — describe it, it gets built, it runs",
  description:
    "Describe your software in one sentence. A real AI organization validates it, builds it, deploys it, and runs it — you approve what matters. Every claim is verifiable.",
};

export default function Landing() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-white font-mono text-black">
      {/* header */}
      <header className="flex shrink-0 items-center justify-between border-b-2 border-black px-6 py-4">
        <span className="text-lg font-bold tracking-tight">competitor<span className="text-[#8C3A22]">.inc</span></span>
        <a href="/login" className="border-2 border-black px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors hover:bg-black hover:text-white">
          Sign in
        </a>
      </header>

      {/* the one screen */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/50">■ System online</p>
        <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:text-7xl">
          Describe it.<br />It gets built.<br />It runs.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/60">
          One sentence. A real AI organization validates your idea, builds it, ships it to a live URL, and
          runs what it shipped — you approve anything that matters.
        </p>
        <div className="mt-9 flex w-full justify-center">
          <LandingInput />
        </div>
      </section>

      {/* footer — one line, the depth is behind a single link */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t-2 border-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-black/45">
        <span>Built + run by AI · you own the 2% that stays human</span>
        <a href="/how-it-works" className="transition-colors hover:text-black">How it works →</a>
      </footer>
    </main>
  );
}
