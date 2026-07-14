import { FOUNDER } from "@/lib/founder";

// The founder section — LinkedIn-grade substance, brand-focused and clean. Heavy display type on the name +
// tagline (the hybrid signature moment); calm teal cards for the stats + links. Data-driven from
// lib/founder.ts; nothing here is invented — the founder edits the file.
export default function FounderSection() {
  const f = FOUNDER;
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-2">The founder</p>
      <h2 className="display mt-3 text-3xl leading-[0.95] text-text sm:text-4xl">{f.name}</h2>
      <p className="mt-2 text-sm font-medium text-coral">{f.identity}</p>
      <p className="mt-0.5 text-xs text-muted-2">{f.location}</p>

      <p className="display mt-5 text-xl leading-tight text-text sm:text-2xl">{f.tagline}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{f.bio}</p>

      <div className="mt-6 flex flex-wrap gap-6">
        {f.stats.map((s) => (
          <div key={s.label}>
            <p className="display text-2xl text-text">{s.value}</p>
            <p className="text-xs text-muted-2">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {f.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral"
          >
            {l.label} →
          </a>
        ))}
      </div>
    </section>
  );
}
