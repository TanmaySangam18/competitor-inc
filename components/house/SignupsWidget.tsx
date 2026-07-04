"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";

// Founder-only glance widget (rendered inside the gated /house). Reads the real signup count for a
// launched app straight from /api/interest?app=<slug> (service-role count, no rows exposed). Polls
// gently so the founder sees new signups land without hitting the API by hand.

interface Props {
  app?: string; // which launched app to count (default: lockin)
  label?: string;
}

export function SignupsWidget({ app = "lockin", label = "Lockin signups" }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/interest?app=${encodeURIComponent(app)}`, { cache: "no-store" });
        const data = (await res.json()) as { count?: number; persisted?: boolean };
        if (!alive) return;
        setCount(data.count ?? 0);
        setPersisted(!!data.persisted);
      } catch {
        if (alive) setPersisted(false);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 60_000); // gentle poll, once a minute
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [app]);

  const goal = 10; // the honest first target — 10 real signups without paid channels
  const pct = count != null ? Math.min(100, Math.round((count / goal) * 100)) : 0;

  return (
    <aside className="glass-panel pointer-events-auto absolute right-4 top-20 z-20 w-[15rem] max-w-[calc(100vw-2rem)] rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
        <Users size={13} /> {label}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        {loading ? (
          <Loader2 size={20} className="animate-spin text-muted-2" />
        ) : (
          <>
            <span className="text-3xl font-semibold text-text">{count ?? 0}</span>
            <span className="text-sm text-muted-2">/ {goal} goal</span>
          </>
        )}
      </div>

      {/* progress toward the 10-signup goal */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-text transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-2 text-[11px] text-muted-2">
        {persisted === false
          ? "Not persisting yet — set Supabase keys in prod to store signups."
          : count === 0
            ? "No signups yet. Post one launch-kit draft to start the count."
            : `Real signups for /${app}, no paid channels.`}
      </p>
    </aside>
  );
}
