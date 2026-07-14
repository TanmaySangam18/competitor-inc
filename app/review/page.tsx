import type { Metadata } from "next";
import { readiness, killSwitch, auditLog } from "@/lib/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /review — THE CONTROL ROOM (REQUIREMENTS §11, the human operations layer). One screen the founder reads in
// their ~10-minute session: the Definition-of-Done scorecard (computed live), the kill-switch state, and the
// audit ledger's integrity. Read-only + honest: pass/partial/todo are computed against the real modules, not
// asserted. Throwing a switch is a separate, auth-gated action (/api/control) — this is the read surface.

export const metadata: Metadata = {
  title: "competitor.inc — control room",
  description: "The Definition-of-Done readiness gate, kill-switch state, and audit integrity — the human review surface.",
};

const PILL: Record<string, string> = {
  pass: "bg-mint/15 text-mint",
  partial: "bg-amber/15 text-amber",
  todo: "border border-coral/40 text-coral",
};

export default async function ReviewPage() {
  const r = await readiness();
  const ks = killSwitch.status();
  const integ = auditLog.verifyIntegrity();

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.ready ? "bg-mint/15 text-mint" : "bg-amber/15 text-amber"}`}>
          {r.ready ? "Safety gate: READY (architecture)" : "Safety gate: incomplete"}
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="shrink-0">
          <h1 className="display text-3xl sm:text-4xl">Control room</h1>
          <p className="mt-2 text-sm text-muted">
            The safety gate, computed live against the real control plane. {r.passed} pass · {r.partial} partial · {r.todo} to&nbsp;do.
          </p>
        </div>

        {/* control strip */}
        <div className="mt-4 grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted-2">Global kill switch</p>
            <p className={`mt-1 text-sm font-semibold ${ks.global ? "text-coral" : "text-mint"}`}>{ks.global ? "ENGAGED" : "Clear"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted-2">Frozen customers</p>
            <p className="mt-1 text-sm font-semibold">{ks.customers.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted-2">Audit ledger</p>
            <p className={`mt-1 text-sm font-semibold ${integ.ok ? "text-mint" : "text-coral"}`}>{integ.count} entries · {integ.ok ? "intact" : "BROKEN"}</p>
          </div>
        </div>

        {/* the 8-check scorecard */}
        <div className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {r.checks.map((c) => (
            <div key={c.n} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{c.n}. {c.question}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${PILL[c.status]}`}>{c.status}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-2">{c.evidence}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 shrink-0 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-2">
          {r.ready
            ? "The safety architecture passes all 8 checks. Going live for a paying customer still needs the founder-only items in HUMAN_TODO — the vault, entity/bank/insurance, domain lock, Stripe verification, and the lawyer-signed use policy — then maintenance lifts."
            : "Every check must pass before maintenance lifts for a paying customer."}
        </p>
      </section>
    </main>
  );
}
