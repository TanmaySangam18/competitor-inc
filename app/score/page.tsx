import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Scorecard from "@/components/Scorecard";
import DemandRadarPanel from "@/components/DemandRadarPanel";

// Public, no-signup lead magnet. Server component so it can export share metadata; the interactive part
// lives in <Scorecard/> (client). The OG image is app/score/opengraph-image.tsx.
//
// ADR-0009: /radar was killed + 308s here; its cited-evidence read (DemandRadarPanel — live crawl of
// HN/StackExchange/GitHub, every signal a clickable source link) is folded in below the scorecard, so
// the honest, verifiable demand read survives the simplification. Shared site chrome, one nav.
export const metadata: Metadata = {
  title: "Score your startup idea — free · competitor.inc",
  description:
    "Get an honest AI verdict on your startup idea in 30 seconds — the score, the evidence behind it, and the crew that would build it. Free, no signup.",
  openGraph: {
    title: "Score your startup idea — free",
    description: "An honest AI verdict in 30 seconds: the score, the evidence, and the crew that would build it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Score your startup idea — free",
    description: "An honest AI verdict in 30 seconds: the score, the evidence, and the crew that would build it.",
  },
};

export default function ScorePage() {
  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />
      <Scorecard />
      <section className="mx-auto w-full max-w-3xl px-6 pb-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
          Live demand radar · real web, cited
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          The model verdict above is an estimate. This reads the live web for real demand signals — and
          shows you every source it read, so you can click and verify each one.
        </p>
        <div className="mt-4">
          <DemandRadarPanel />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
