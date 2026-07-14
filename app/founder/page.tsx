import type { Metadata } from "next";
import FounderSection from "@/components/FounderSection";
import ProductMarquee from "@/components/ProductMarquee";
import { FOUNDER } from "@/lib/founder";

export const metadata: Metadata = {
  title: `competitor.inc — ${FOUNDER.name}`,
  description: `${FOUNDER.name} — ${FOUNDER.identity}. ${FOUNDER.tagline}`,
};

// /founder — the human behind competitor.inc, presented cleanly (LinkedIn-grade, brand-focused). The
// hybrid: teal brand + heavy display type for the signature moments.
export default function FounderPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <a href="/services" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">Services</a>
      </header>

      <ProductMarquee />

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <FounderSection />
        <p className="mt-4 text-center text-[11px] text-muted-2">
          competitor.inc is built + run by a governed AI organization — you own the 2% that stays human.
        </p>
      </section>
    </main>
  );
}
