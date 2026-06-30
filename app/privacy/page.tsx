import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Privacy — competitor.inc" };

export default function Privacy() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
        <ArrowLeft size={15} /> Home
      </Link>
      <div className="mt-6 flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
        <LogoMark size={26} /> competitor.inc
      </div>
      <h1 className="display mt-6 text-3xl">Privacy</h1>
      <p className="mt-2 text-sm text-muted-2">Beta · last updated June 2026. Plain-English, because trust is the product.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-text">What we collect</h2>
          <p className="mt-2">
            If you sign in, we store your <span className="text-text">email</span> (via Supabase Auth) and the
            companies, ideas, activities, and approvals you create — so we can show them back to you across devices.
            If you use the app as a guest, that data lives only in <span className="text-text">your browser</span> and
            never reaches our servers.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">What&apos;s public about you (enrichment)</h2>
          <p className="mt-2">
            When you sign in, we look up what&apos;s <span className="text-text">already public</span> about you from{" "}
            <span className="text-text">Gravatar</span> and <span className="text-text">GitHub</span> (using your email)
            and show it to you so you can confirm or remove it — a convenience, never a trick. We only ever do this for{" "}
            <span className="text-text">you, about you</span> — never third parties — and we don&apos;t use sensitive
            categories or scrape sites that forbid it. Don&apos;t want it? Dismiss the panel and we drop it.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">What we don&apos;t do</h2>
          <p className="mt-2">
            We don&apos;t sell your data, we don&apos;t run ad-tracking on you, and we don&apos;t train models on your
            ideas. Your idea is yours. Anything consequential the agents do waits for your explicit approval.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Third parties</h2>
          <p className="mt-2">
            We use <span className="text-text">Supabase</span> (auth + database), <span className="text-text">Vercel</span>{" "}
            (hosting + privacy-light usage analytics), and an AI model provider (currently{" "}
            <span className="text-text">Anthropic</span>) to power the agents. Your idea text is sent to the model
            provider to generate estimates and replies. If you bring your own model key, that key stays in your
            browser and goes straight to your provider.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Own your data</h2>
          <p className="mt-2">
            Export everything as JSON anytime from <span className="text-text">Settings → Account</span>. Ask us to
            delete your account data and we will. No lock-in, ever.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Your rights</h2>
          <p className="mt-2">
            You can ask us to <span className="text-text">access, correct, or delete</span> your personal data, and we
            don&apos;t sell it. Send a privacy request to the founder address in the footer and we&apos;ll act on it. We
            operate from <span className="text-text">Massachusetts, USA</span>; these are plain-language disclosures, not
            legal advice.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text">Contact</h2>
          <p className="mt-2">Questions? This is an early beta — reach the founder via the link in the footer.</p>
        </section>
      </div>

      <p className="mt-10 text-xs text-muted-2">
        See also <Link href="/terms" className="text-coral hover:underline">Terms</Link>.
      </p>
    </main>
  );
}
