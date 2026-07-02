export function BarChart({ title, values, nights, color, fmt }: { title: string; values: number[]; nights: number[]; color: string; fmt: (v: number) => string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-2xl glass-panel p-5">
      <div className="text-sm font-semibold">{title}</div>
      {/* Wide-data rule (Refactoring UI): the bars live in their own horizontal scroll box, so many
          nights scroll *inside* the card instead of bleeding past it. Each bar keeps a readable min
          width. The height % is measured against a fixed track, with labels outside it — so a tall
          bar can never push past the chart area. */}
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex gap-2" style={{ minWidth: `${values.length * 26}px` }}>
          {values.map((v, i) => (
            <div key={i} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full items-end">
                <span className="pointer-events-none absolute inset-x-0 -top-4 text-center text-[10px] text-muted-2 opacity-0 transition group-hover:opacity-100">{fmt(v)}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 2, backgroundColor: v > 0 ? color : "var(--color-border)" }}
                />
              </div>
              <span className="text-[10px] text-muted-2">{nights[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-2">night</div>
    </div>
  );
}
