import type { Metadata } from "next";

// THE LANDING (/) — the front door, in the founder's MACHINA theme ([[design-direction-machina]]):
// pure black/white, monospace, zero-radius, giant uppercase display, a system ticker. Static + server-
// rendered. Primary CTAs go to /build (the "prove it" demo — describe an idea, watch it validate + build);
// the demo lives at /build now (moved from / on 2026-07-11 when this became the front door). HONESTY FLOOR:
// the mockup's stat numbers were placeholders — replaced with TRUE statements ([[crack-audit-and-no-fake-proof]]).

export const metadata: Metadata = {
  title: "competitor.inc — describe it, we build it, it runs",
  description:
    "Tell us your software idea in one sentence. A real AI organization validates it, builds it, deploys it, and runs it — you stay in control with one approval. Every claim is verifiable.",
};

const TICKER = [
  "BUILT + RUN BY AI",
  "GOVERNED BY YOUR ONE APPROVAL",
  "EVERY CLAIM VERIFIABLE",
  "NOTHING LEAVES THE BUILDING WITHOUT YOU",
];

const STEPS: { n: string; title: string; body: string }[] = [
  { n: "01", title: "DESCRIBE", body: "One sentence. Your idea, your words. The org tells you if it's viable before a line of code is written." },
  { n: "02", title: "IT BUILDS", body: "A 56-role AI organization designs it, writes it, reviews its own work, and deploys it — then verifies it's really live." },
  { n: "03", title: "IT RUNS", body: "The org operates the product around the clock. Only the decisions that are legally yours reach you — approve, reject, or send back." },
];

export default function MachinaLanding() {
  return (
    <div className="min-h-screen bg-white font-mono text-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b-2 border-black px-6 py-4">
        <span className="text-lg font-bold tracking-tight">competitor<span className="text-[#8C3A22]">.inc</span></span>
        <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em]">
          <a href="/login" className="border-2 border-black px-4 py-2 hover:bg-black hover:text-white">Sign in</a>
          <a href="/build" className="bg-black px-4 py-2 text-white hover:bg-[#8C3A22]">Get started →</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-black px-6 py-16">
        <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/50">■ System online</p>
        <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tighter sm:text-8xl">
          Describe.<br />We build.<br />It runs.
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-black/70">
          Tell us your software idea in one sentence. A real AI organization validates it, builds it,
          deploys it, and runs it — around the clock. You stay in control with one approval.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/build" className="bg-black px-8 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#8C3A22]">Start for free →</a>
          <a href="/login" className="border-2 border-black px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white">Sign in</a>
        </div>
      </section>

      {/* Honest ticker — statements, not invented numbers */}
      <div className="overflow-hidden border-b-2 border-black bg-black py-3">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 px-6 text-[11px] uppercase tracking-[0.2em] text-white/90">
          {TICKER.map((t) => (
            <span key={t} className="whitespace-nowrap">◆ {t}</span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="px-6 py-14">
        <h2 className="mb-10 text-[11px] uppercase tracking-[0.25em] text-black/50">How it works</h2>
        <div className="space-y-12">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-black/15 pt-6">
              <div className="text-4xl font-black text-black/15 sm:text-5xl">{s.n}</div>
              <h3 className="mt-3 text-xl font-bold uppercase tracking-wide">{s.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The differentiator — our actual moat, no invented metrics */}
      <section className="border-y-2 border-black bg-black px-6 py-16 text-white">
        <h2 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
          No fabricated numbers.<br />Ever.
        </h2>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70">
          Other tools chat. This is an AI company that builds and runs real software — and every result it
          shows you is verifiable. If it says a product is live, it checked. If it can't prove something, it
          says so. Honesty is the product, not the marketing.
        </p>
      </section>

      {/* Close */}
      <section className="px-6 py-16 text-center">
        <p className="text-2xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
          Stop hiring. Stop managing. Stop waiting.
        </p>
        <a href="/build" className="mt-8 inline-block bg-black px-10 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#8C3A22]">
          Get started →
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black px-6 py-8 text-center text-[11px] uppercase tracking-[0.2em] text-black/50">
        competitor.inc · built and run by AI · you own the 2% that must stay human
      </footer>
    </div>
  );
}
