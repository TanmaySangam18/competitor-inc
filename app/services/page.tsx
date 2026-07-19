import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { listServices, type Service } from "@/lib/core";

// THE SERVICE CATALOG (/services) — what a customer can hire the AI company to run. Each service is a
// collapsible tile (native <details>, no JS), the flagship open by default. Shared site chrome
// (SiteHeader/SiteFooter, ADR-0009), monochrome tokens. Status is HONEST, straight from
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

const BUY: Record<Service["status"], { label: string; note: string }> = {
  ready: { label: "Hire this", note: "Ready now — connect once, then it runs. Billed on the plan you pick at checkout." },
  partial: { label: "Get early access", note: "In progress — get on the early-access list; you'll be billed only when it's live." },
  planned: { label: "Notify me", note: "Planned — leave your email and we'll tell you the day it ships." },
};

function ServiceTile({ s, checkoutUrl }: { s: Service; checkoutUrl: string }) {
  const status = STATUS[s.status];
  const buy = BUY[s.status];
  // Ready services go to real checkout when it's connected; otherwise (and for not-yet-ready ones) to signup.
  const href = s.status === "ready" && checkoutUrl ? checkoutUrl : "/signup";
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

        {/* how to buy + the checkout CTA */}
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[11px] leading-snug text-muted-2">{buy.note}</p>
          <a
            href={href}
            className="shrink-0 rounded-xl bg-coral px-4 py-2 text-center text-xs font-semibold text-bg transition hover:brightness-110"
          >
            {buy.label} →
          </a>
        </div>
      </div>
    </details>
  );
}

export default function ServicesPage() {
  const services = listServices();
  // Real checkout when the founder has connected it (NEXT_PUBLIC, so it inlines at build); else signup.
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL_BUILDER ?? process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "";
  return (
    <main className="flex min-h-[100dvh] flex-col bg-bg text-text">
      {/* ADR-0009: the shared site chrome replaces the bespoke header — one nav everywhere. The page
          flows normally now (the collapsed tiles keep it short); the list no longer scrolls internally. */}
      <SiteHeader />

      <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="display text-3xl sm:text-4xl">What can it run for you?</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Hire the AI company for one thing or all of it. Every service is run by real roles and shows an
          honest status — nothing here claims more than it can do.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {services.map((s) => (
            <ServiceTile key={s.id} s={s} checkoutUrl={checkoutUrl} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
