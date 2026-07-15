import type { Metadata } from "next";
import { runFailureDrills, readiness } from "@/lib/core";
import { proveGround } from "@/lib/sim/proving-ground";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /benchmark — THE HONEST CLAIM. The strongest thing we can say without a real customer: the company is
// PROVEN IN SIMULATION. Runs the Synthetic Proving Ground (grounded answers + tenant isolation + honest
// abstention), the six failure drills, and the Definition-of-Done gate — live, dated, clearly labeled as a
// simulation. We NEVER claim real customers or "Microsoft-scale"; we claim exactly what the machine passes.

export const metadata: Metadata = {
  title: "competitor.inc — proven in simulation",
  description:
    "A live, dated benchmark: the governed AI company run against a synthetic enterprise — grounded answers, tenant isolation, six failure drills, and the safety gate. Proven in simulation, not a customer claim.",
};

function Bar({ label, passed, total }: { label: string; passed: number; total: number }) {
  const ok = total > 0 && passed === total;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-mint" : "text-amber"}`}>{passed}/{total}</span>
    </div>
  );
}

export default async function BenchmarkPage() {
  const drills = await runFailureDrills();
  const dod = await readiness();
  const pg = proveGround(["acme", "globex", "initech"]);
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  return (
    <main className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <a href="/review" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">Control room</a>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-2">Proven in simulation · {stamp}</p>
        <h1 className="display mt-3 text-3xl sm:text-5xl">The machine, stress-tested</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Run live, right now, against a <span className="font-medium text-text">synthetic enterprise</span> — fake company, fake
          users, fake load. This is <span className="font-medium text-text">not</span> a claim of real customers or scale; it is
          exactly what the governed company passes in a controlled simulation. Every number is computed on this page load.
        </p>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Bar label="Grounded answers from tenant data" passed={pg.checks.grounding.passed} total={pg.checks.grounding.total} />
          <Bar label="Tenant isolation (no cross-leak)" passed={pg.checks.isolation.passed} total={pg.checks.isolation.total} />
          <Bar label="Honest abstention (says 'don't know')" passed={pg.checks.abstention.passed} total={pg.checks.abstention.total} />
          <Bar label="Failure drills survived" passed={drills.passed} total={drills.total} />
          <Bar label="Safety gate (Definition of Done)" passed={dod.passed} total={dod.checks.length} />
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <span className="text-sm">Synthetic tenants · artifacts</span>
            <span className="text-sm font-semibold">{pg.tenants} · {pg.artifacts}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface-2/60 p-4">
          <p className="text-sm"><span className="font-semibold">Verdict:</span> {pg.verdict}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
            Labeled <span className="font-medium">simulated: {String(pg.simulated)}</span> by construction — the sim/real wall
            is load-bearing. A synthetic tenant can never count toward a real metric, receipt, or public number. When a real
            customer ships, their receipts appear separately — never mixed with this.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-muted-2">
          What we do NOT claim: real customers, real revenue, or platform-scale like the giants. What we DO claim: the
          governance + verification a platform-class product needs, proven to hold under simulated pressure.
        </p>
      </section>
    </main>
  );
}
