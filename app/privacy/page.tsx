import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Privacy · competitor.inc" };

export default function Privacy() {
  return (
    // ADR-0009: the shared site chrome replaces the LedgerShell — one header + one footer everywhere.
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">Your data · in plain English</p>
      <h1 className="display mt-4 text-3xl">Privacy</h1>
      <p className="mt-2 text-sm text-ink-faint">Beta · last updated June 2026. Plain-English, because trust is the product.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-muted">
        <section>
          <h2 className="text-base font-semibold text-ink">What we collect</h2>
          <p className="mt-2">
            If you sign in, we store your <span className="text-ink">email</span> (via Supabase Auth) and the
            companies, ideas, activities, and approvals you create — so we can show them back to you across devices.
            If you use the app as a guest, that data lives only in <span className="text-ink">your browser</span> and
            never reaches our servers.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">What&apos;s public about you (enrichment)</h2>
          <p className="mt-2">
            When you sign in, we look up what&apos;s <span className="text-ink">already public</span> about you from{" "}
            <span className="text-ink">Gravatar</span> and <span className="text-ink">GitHub</span> (using your email)
            and show it to you so you can confirm or remove it — a convenience, never a trick. We only ever do this for{" "}
            <span className="text-ink">you, about you</span> — never third parties — and we don&apos;t use sensitive
            categories or scrape sites that forbid it. Don&apos;t want it? Dismiss the panel and we drop it.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">What we don&apos;t do</h2>
          <p className="mt-2">
            We don&apos;t sell your data, we don&apos;t run ad-tracking on you, and we don&apos;t train models on your
            ideas. Your idea is yours. Anything consequential the agents do waits for your explicit approval.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Third parties</h2>
          <p className="mt-2">
            We use <span className="text-ink">Supabase</span> (auth + database), <span className="text-ink">Vercel</span>{" "}
            (hosting + privacy-light usage analytics), and an AI model provider (currently{" "}
            <span className="text-ink">Anthropic</span>) to power the agents. Your idea text is sent to the model
            provider to generate estimates and replies. If you bring your own model key, that key stays in your
            browser and goes straight to your provider.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Own your data</h2>
          <p className="mt-2">
            Export everything as JSON anytime from <span className="text-ink">Settings → Account</span>. Ask us to
            delete your account data and we will. No lock-in, ever.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Your rights</h2>
          <p className="mt-2">
            You can ask us to <span className="text-ink">access, correct, or delete</span> your personal data, and we
            don&apos;t sell it. Send a privacy request to the founder address in the footer and we&apos;ll act on it. We
            operate from <span className="text-ink">Massachusetts, USA</span>; these are plain-language disclosures, not
            legal advice.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <p className="mt-2">Questions? This is an early beta — reach the founder via the link in the footer.</p>
        </section>
      </div>

      <p className="mt-10 text-xs text-muted-2">
        See also <Link href="/terms" className="text-pine underline decoration-dotted underline-offset-4 hover:decoration-solid">Terms</Link>.
      </p>
      </div>
      <SiteFooter />
    </main>
  );
}
