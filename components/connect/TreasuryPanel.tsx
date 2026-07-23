"use client";

import { useState } from "react";

// The bank panel on /connect (ADR-0020). One row per spending department: the human types a monthly
// cap ONCE (the standing authorization) and in-budget spend runs silently from then on. Everything
// here is the signed-in owner's own money model — RLS-backed via /api/treasury.

export interface EnvelopeView {
  department: string;
  monthlyCapUsd: number;
  spentThisMonthUsd: number;
  remainingUsd: number;
  pctUsed: number;
  low: boolean;
}

const HAIR = "border-border";

export default function TreasuryPanel({ envelopes, signedIn, perTxnCap }: {
  envelopes: EnvelopeView[];
  signedIn: boolean;
  perTxnCap: number;
}) {
  const [rows, setRows] = useState(envelopes);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(dept: string) {
    const cap = Number(draft[dept]);
    if (!Number.isFinite(cap) || cap < 0) {
      setMsg(`${dept}: enter a number ≥ 0`);
      return;
    }
    setSaving(dept);
    setMsg(null);
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ department: dept, monthlyCapUsd: cap }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (j.ok) {
        setRows((r) => r.map((e) => (e.department === dept
          ? { ...e, monthlyCapUsd: cap, remainingUsd: Math.max(0, cap - e.spentThisMonthUsd), pctUsed: cap > 0 ? Math.min(100, Math.round((e.spentThisMonthUsd / cap) * 100)) : 0, low: cap > 0 && e.spentThisMonthUsd / cap >= 0.8 }
          : e)));
        setMsg(`${dept} budget set — $${cap}/mo standing authorization`);
      } else {
        setMsg(`${dept}: ${j.error ?? "could not save"}`);
      }
    } catch {
      setMsg(`${dept}: network error — nothing saved`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <ul>
        {rows.map((e) => (
          <li key={e.department} className={`border-t ${HAIR} py-4`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-32 text-[14px] font-semibold tracking-tight">{e.department}</span>
              <span className="font-mono text-[11px] tabular-nums">
                ${e.spentThisMonthUsd.toFixed(2)} spent of ${e.monthlyCapUsd.toFixed(0)}/mo
                {e.monthlyCapUsd > 0 && ` · $${e.remainingUsd.toFixed(2)} left`}
                {e.low && " · running low"}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {signedIn ? (
                  <>
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2" htmlFor={`cap-${e.department}`}>cap $/mo</label>
                    <input
                      id={`cap-${e.department}`}
                      inputMode="numeric"
                      placeholder={String(e.monthlyCapUsd)}
                      value={draft[e.department] ?? ""}
                      onChange={(ev) => setDraft((d) => ({ ...d, [e.department]: ev.target.value }))}
                      className={`w-20 border ${HAIR} bg-transparent px-2 py-1 font-mono text-[12px]`}
                    />
                    <button
                      onClick={() => save(e.department)}
                      disabled={saving === e.department || (draft[e.department] ?? "") === ""}
                      className="border border-text px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:bg-text hover:text-bg disabled:opacity-40"
                    >
                      {saving === e.department ? "saving" : "set"}
                    </button>
                  </>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">$0 until you sign in and set it</span>
                )}
              </span>
            </div>
            {e.monthlyCapUsd > 0 && (
              <div className="mt-2 h-[2px] w-full bg-text/10">
                <div className="h-[2px] bg-text" style={{ width: `${e.pctUsed}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em]">{msg}</p>}
      <p className="mt-4 max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
        A cap of $0 means nothing auto-spends. Any single transaction over ${perTxnCap} escalates to you regardless
        of budget room. Withdrawals and transfers are never automated — money OUT is a human-only act, always.
      </p>
    </div>
  );
}
