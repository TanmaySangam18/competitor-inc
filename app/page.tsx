import type { Metadata } from "next";
import LandingInput from "@/components/LandingInput";

// THE LANDING (/) — ONE screen, no scroll. Stripped to the essence: what it is + the single action
// (describe your software). TEAL design (2026-07-12, matches the cockpit; MACHINA retired). The depth
// (how it works, proof) lives behind ONE link, never inline. Fixed viewport: header + hero + footer.

export const metadata: Metadata = {
  title: "competitor.inc — describe it, it gets built, it runs",
  description:
    "Describe your software in one sentence. A real AI organization validates it, builds it, deploys it, and runs it — you approve what matters. Every claim is verifiable.",
};

export default function Landing() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      {/* header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></span>
        <a href="/login" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">
          Sign in
        </a>
      </header>

      {/* the one screen */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-mint">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" /> System online
        </p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Describe it.<br />It gets built.<br />It runs.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          One sentence. A real AI organization validates your idea, builds it, ships it to a live URL, and
          runs what it shipped — you approve anything that matters.
        </p>
        <div className="mt-9 flex w-full justify-center">
          <LandingInput />
        </div>
      </section>

      {/* footer — one line, the depth is behind a single link */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3 text-[11px] text-muted-2">
        <span>Built + run by AI · you own the 2% that stays human</span>
        <a href="/how-it-works" className="font-medium transition hover:text-coral">How it works →</a>
      </footer>
    </main>
  );
}
