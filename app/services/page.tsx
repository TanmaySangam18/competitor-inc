import type { Metadata } from "next";
import { listServices, type Service } from "@/lib/core";

// THE SERVICE CATALOG (/services) — what a customer can hire the AI company to run. ONE screen: each service
// is a collapsible tile (native <details>, no JS), the flagship open by default, the rest folded so all six
// fit without scrolling. TEAL design system (matches landing + cockpit). Status is HONEST, straight from
// lib/core/services.ts — no service claims more than it can do.

export const metadata: Metadata = {
  title: "competitor.inc — services",
  description:
    "What you can hire the AI company to run: build and sell your software, growth and marketing, customer support, sales and outreach, competitor watch, and a copilot on your own data.",
};

const STATUS: Record<Service["status"], { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-mint/10 text-mint" },
  partial: { label: "In progress", cls: "bg-coral/10 text-coral" },
  planned: { label: "Planned", cls: "border border-border text-muted-2" },
};

function ServiceTile({ s }: { s: Service }) {
  const status = STATUS[s.status];
  return (
    <details
      open={s.flagship}
      className="group rounded-2xl border border-border bg-surface transition hover:border-coral/40 open:border-coral/40"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">{s.name}</span>
            {s.flagship && (
              <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral">
                Flagship
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm leading-snug text-muted">{s.summary}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.cls}`}>{status.label}</span>
        <svg
          className="shrink-0 text-muted-2 transition group-open:rotate-180"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="border-t border-border px-5 py-4">
        <ul className="space-y-1.5">
          {s.does.map((d) => (
            <li key={d} className="flex gap-2.5 text-sm leading-snug text-text">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral/70" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3.5 text-xs text-muted-2">
          Run by <span className="font-medium text-muted">{s.agents.join(", ")}</span>
        </p>
      </div>
    </details>
  );
}

export default function ServicesPage() {
  const services = listServices();
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <a href="/dashboard" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">
          Open the cockpit
        </a>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What can it run for you?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Hire the AI company for one thing or all of it. Every service is run by real roles and shows an
            honest status — nothing here claims more than it can do.
          </p>
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {services.map((s) => (
            <ServiceTile key={s.id} s={s} />
          ))}
        </div>
      </section>
    </main>
  );
}
