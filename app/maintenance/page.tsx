import type { Metadata } from "next";

// The public maintenance screen shown while the backend is rebuilt (see middleware.ts). One calm screen,
// no scroll, teal brand. Honest: we're rebuilding, back soon — no fake countdowns or promises.
export const metadata: Metadata = {
  title: "competitor.inc · under maintenance",
  description: "competitor.inc is briefly down for maintenance while we rebuild. Back soon.",
  robots: { index: false, follow: false },
};

export default function Maintenance() {
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center bg-bg px-6 text-center text-text">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-mint">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Maintenance
      </span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        competitor<span className="text-coral">.inc</span>
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
        We&apos;re rebuilding the engine to make it stronger. The site is briefly down for maintenance —
        back soon.
      </p>
    </main>
  );
}
