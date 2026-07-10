"use client";

// THE ONE SIGNATURE (Consent Rails, Block 3 slice 3) — the customer's standing mandate, in the Team
// Room where the company they're authorizing lives. Unsigned ⇒ nothing runs unattended (deny-by-default,
// enforced server-side by decideMandate + the cron choke point). One click signs the scoped, capped,
// instantly-revocable mandate; the kill switch is always one tap away. Degrades honestly: when auth/DB
// aren't configured (local sim), it says so instead of pretending a signature happened.

import { useCallback, useEffect, useState } from "react";
import { Loader2, PenLine, ShieldCheck, ShieldOff } from "lucide-react";
import type { CustomerMandate } from "@/lib/org/customer-mandate";

export function MandateCard({ companyId }: { companyId: string }) {
  const [state, setState] = useState<{ configured: boolean; mandate: CustomerMandate } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/mandate?companyId=${encodeURIComponent(companyId)}`);
      if (res.status === 401) { setState(null); return; }
      const d = await res.json();
      if (d?.ok) setState({ configured: !!d.configured, mandate: d.mandate });
    } catch { /* leave null — the card stays quiet rather than wrong */ }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  async function act(action: "sign" | "kill" | "unkill") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/mandate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId, action }),
      });
      const d = await res.json();
      if (d?.ok) setState((s) => ({ configured: s?.configured ?? true, mandate: d.mandate }));
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null; // signed-out or unreachable — the Team Room works, governance UI stays quiet
  const m = state.mandate;
  const signed = !!m.signedAt;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${m.killSwitch ? "bg-coral/10 text-coral" : "bg-surface-2 text-text"}`}>
        {m.killSwitch ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
      </span>
      <div className="min-w-0 flex-1">
        {!state.configured ? (
          <p className="text-xs text-muted">Governed sim — signing needs launch config (auth + DB). Locally, nothing runs unattended.</p>
        ) : m.killSwitch ? (
          <p className="text-xs font-medium text-coral">Kill switch is ON — everything is halted until you resume.</p>
        ) : signed ? (
          <p className="text-xs text-muted">
            <span className="font-medium text-text">Mandate signed.</span> {m.scopes.length} scopes on platform rails ·
            ${(m.monthlySpendCapCents / 100).toFixed(0)}/mo cap · payout, contracts &amp; above-cap always come to you.
          </p>
        ) : (
          <p className="text-xs text-muted">
            <span className="font-medium text-text">One signature.</span> Authorize your company to build, publish,
            and collect on platform rails — scoped, capped, revocable instantly. The irreducible stays yours.
          </p>
        )}
      </div>
      {state.configured && (
        <div className="flex shrink-0 items-center gap-2">
          {!signed && !m.killSwitch && (
            <button onClick={() => act("sign")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-text px-3 py-1.5 text-xs font-semibold text-bg transition hover:opacity-90 disabled:opacity-40">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <PenLine size={12} />} Sign
            </button>
          )}
          {signed && (
            <button
              onClick={() => act(m.killSwitch ? "unkill" : "kill")}
              disabled={busy}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${m.killSwitch ? "border-border text-text hover:bg-surface-2" : "border-coral/40 text-coral hover:bg-coral/10"}`}
            >
              {m.killSwitch ? "Resume" : "Stop everything"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
