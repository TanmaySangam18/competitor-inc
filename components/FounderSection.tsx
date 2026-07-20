// components/FounderSection.tsx — the one human behind the AI company (founder profile).
// Honest + minimal: name, the real role, the two links. Dark-canvas, monochrome, no emoji, no fabricated
// credentials — just who governs the org and where to find them.

const LINKS = [
  { href: "https://www.linkedin.com/in/tanmaysangam/", label: "LinkedIn" },
  { href: "https://tanmaysangam.vercel.app/", label: "Portfolio" },
];

export default function FounderSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">The one human in the loop</p>
        <div className="mt-4 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="display text-3xl sm:text-4xl">Tanmay Sangam</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Founder — the sole human who governs the org
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              competitor.inc runs on a 56-role AI organization under one signature — mine. I set the
              vision and sign the decisions that genuinely need a human; the company does the rest.
              Boston-based, building this so any founder can run a company the same way.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 font-mono text-xs">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[180px] items-center justify-between gap-6 border border-border px-4 py-2.5 uppercase tracking-[0.12em] transition hover:border-text hover:bg-text hover:text-bg"
              >
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
