import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Terms — competitor.inc" };

export default function Terms() {
  return (
    // ADR-0009: the shared site chrome replaces the LedgerShell — one header + one footer everywhere.
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">The fine print · in plain English</p>
      <h1 className="display mt-4 text-3xl">Terms</h1>
      <p className="mt-2 text-sm text-ink-faint">Beta · last updated June 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-muted">
        <section>
          <h2 className="text-base font-semibold text-ink">It&apos;s a beta</h2>
          <p className="mt-2">
            competitor.inc is early software provided <span className="text-ink">as-is</span>, without warranties.
            Things may change or break. Don&apos;t rely on it as your only system of record — export your data
            regularly.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Estimates aren&apos;t guarantees</h2>
          <p className="mt-2">
            The Validation Gate produces <span className="text-ink">AI estimates</span>, not a live demand test or
            financial advice. They&apos;re a fast, model-based read to inform your judgment — the decision to build is
            always yours.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">You&apos;re in control</h2>
          <p className="mt-2">
            The agents never spend money or send messages on your behalf without your explicit approval. You&apos;re
            responsible for what you approve, and for using the tool lawfully and for your own ideas.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Your content</h2>
          <p className="mt-2">
            You own your ideas and the work product. You grant us only the permission needed to run the service for
            you (store it, send it to the model provider to generate output). See{" "}
            <Link href="/privacy" className="text-pine underline decoration-dotted underline-offset-4 hover:decoration-solid">Privacy</Link>.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Acceptable use</h2>
          <p className="mt-2">
            Don&apos;t abuse the service — no attempts to overload it, scrape it, or use it for illegal or harmful
            ends. We may rate-limit or suspend access to keep it healthy for everyone.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Billing</h2>
          <p className="mt-2">
            Paid plans are processed by <span className="text-ink">Polar</span>, our merchant of record — they
            handle payment and any applicable sales tax/VAT. We never see or store your card details.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Governing law</h2>
          <p className="mt-2">
            We operate from the <span className="text-ink">Commonwealth of Massachusetts, USA</span>, and these terms
            are governed by Massachusetts law (without regard to conflict-of-laws rules). This is plain-language beta
            terms — not a substitute for legal advice.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-ink-faint">
        See also <Link href="/privacy" className="text-pine underline decoration-dotted underline-offset-4 hover:decoration-solid">Privacy</Link>.
      </p>
      </div>
      <SiteFooter />
    </main>
  );
}
