import { listShowcase, hasCustomerProducts } from "@/lib/core/showcase";

// A continuously scrolling proof strip. Renders REAL, live surfaces only (see showcase.ts) — each pill is a
// real route. Seamless loop: the track is doubled and translates -50%; hover pauses; reduced-motion stops
// it. Heavy display type on the names = a confident ticker, without touching the rest of the teal system.
export default function ProductMarquee() {
  const items = listShowcase();
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface-2/60">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />
      <ul className="marquee-track flex w-max items-center gap-2.5 py-3">
        {doubled.map((s, i) => (
          <li key={i} className="shrink-0">
            <a
              href={s.href}
              className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-1.5 transition hover:border-coral/50"
            >
              <span className="display text-[13px] leading-none text-text">{s.name}</span>
              <span className="text-xs text-muted-2">{s.blurb}</span>
              <span className="text-coral">→</span>
            </a>
          </li>
        ))}
      </ul>
      {!hasCustomerProducts() && (
        <p className="border-t border-border bg-bg px-4 py-1.5 text-center text-[11px] text-muted-2">
          The company, running on itself — real, live surfaces. Customer products ship here as they go live.
        </p>
      )}
    </div>
  );
}
