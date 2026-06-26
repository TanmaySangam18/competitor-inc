import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Terms — competitor.inc" };

export default function Terms() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
        <ArrowLeft size={15} /> Home
      </Link>
      <div className="mt-6 flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
        <LogoMark size={26} /> competitor.inc
      </div>
      <h1 className="display mt-6 text-3xl">Terms</h1>
      <p className="mt-2 text-sm text-muted-2">Beta · last updated June 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-text">It&apos;s a beta</h2>
          <p className="mt-2">
            competitor.inc is early software provided <span className="text-text">as-is</span>, without warranties.
            Things may change or break. Don&apos;t rely on it as your only system of record — export your data
            regularly.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Estimates aren&apos;t guarantees</h2>
          <p className="mt-2">
            The Validation Gate produces <span className="text-text">AI estimates</span>, not a live demand test or
            financial advice. They&apos;re a fast, model-based read to inform your judgment — the decision to build is
            always yours.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">You&apos;re in control</h2>
          <p className="mt-2">
            The agents never spend money or send messages on your behalf without your explicit approval. You&apos;re
            responsible for what you approve, and for using the tool lawfully and for your own ideas.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Your content</h2>
          <p className="mt-2">
            You own your ideas and the work product. You grant us only the permission needed to run the service for
            you (store it, send it to the model provider to generate output). See{" "}
            <Link href="/privacy" className="text-coral hover:underline">Privacy</Link>.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Acceptable use</h2>
          <p className="mt-2">
            Don&apos;t abuse the service — no attempts to overload it, scrape it, or use it for illegal or harmful
            ends. We may rate-limit or suspend access to keep it healthy for everyone.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-muted-2">
        See also <Link href="/privacy" className="text-coral hover:underline">Privacy</Link>.
      </p>
    </main>
  );
}
