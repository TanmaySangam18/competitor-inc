import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Lock, Check } from "lucide-react";
import { PLAYBOOKS, getPlaybook, readNext } from "@/lib/engine/playbooks";
import { SITE_URL } from "@/lib/site";
import { LedgerShell, serifStyle } from "@/components/ledger/LedgerShell";

export function generateStaticParams() {
  return PLAYBOOKS.map((p) => ({ slug: p.slug }));
}

// Playbooks are the long-tail SEO engine — give each rich metadata + a canonical URL so it ranks.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pb = getPlaybook(slug);
  if (!pb) return { title: "Playbook not found — competitor.inc" };
  const url = `${SITE_URL}/playbooks/${slug}`;
  return {
    title: `${pb.title} — competitor.inc`,
    description: pb.summary,
    alternates: { canonical: url },
    openGraph: { title: pb.title, description: pb.summary, url, type: "article", siteName: "competitor.inc" },
    twitter: { card: "summary_large_image", title: pb.title, description: pb.summary },
  };
}

export default async function PlaybookDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pb = getPlaybook(slug);
  if (!pb) notFound();
  const next = readNext(slug, 3);

  return (
    <LedgerShell>
      {/* Article structured data → rich results in search (the SEO engine). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: pb.title,
            description: pb.summary,
            author: { "@type": "Organization", name: "competitor.inc" },
            publisher: { "@type": "Organization", name: "competitor.inc" },
            mainEntityOfPage: `${SITE_URL}/playbooks/${slug}`,
          }),
        }}
      />
      {/* FAQ structured data → FAQPage rich results in search (long-tail question intent). */}
      {pb.faqs && pb.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: pb.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}
      <article className="mx-auto max-w-2xl px-5 pb-20 pt-14">
        <Link href="/playbooks" className="text-sm text-ink-muted transition hover:text-ink">← Playbooks</Link>
        <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-ink-faint">
          <Clock size={12} /> {pb.readMins} min read
        </div>
        <h1 className="mt-3 text-3xl font-medium leading-[1.1] md:text-4xl" style={serifStyle}>{pb.title}</h1>
        <p className="mt-4 text-lg text-ink-muted">{pb.summary}</p>

        {/* Free intro — public (the hook + the SEO) */}
        <div className="mt-8 space-y-5 text-[1.02rem] leading-relaxed text-ink-muted">
          {pb.freeIntro.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* What's inside — section headings are a free teaser (no paid prose) */}
        <div className="press mt-10 rounded-2xl bg-cream-2 p-6">
          <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sienna">WHAT&apos;S INSIDE THE FULL PLAYBOOK</h2>
          <ul className="mt-3 space-y-2">
            {pb.body.map((s) => (
              <li key={s.heading} className="flex items-start gap-2.5 text-sm">
                <Check size={15} className="mt-0.5 shrink-0 text-pine" />
                <span>{s.heading}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ — public, indexable, long-tail question intent (pairs with the FAQPage schema above). */}
        {pb.faqs && pb.faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sienna">FREQUENTLY ASKED</h2>
            <div className="mt-4 space-y-3">
              {pb.faqs.map((f) => (
                <details key={f.q} className="rounded-2xl border border-rule bg-cream-2 p-5">
                  <summary className="cursor-pointer list-none font-medium leading-snug">{f.q}</summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Paywall — body is genuinely withheld (server doesn't render it); $3 unlock ships in Phase 3 */}
        <div className="press mt-6 rounded-2xl bg-cream p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-rule bg-cream-2 text-sienna">
            <Lock size={20} />
          </span>
          <h2 className="mt-4 text-xl font-medium" style={serifStyle}>Unlock the full playbook</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            The complete playbook — the steps, the thresholds, the real tactics — for <strong>$3</strong>, once.
            Like a short, honest ebook. <span className="text-ink-faint">Unlocking goes live soon.</span>
          </p>
          <span className="mt-5 inline-block cursor-not-allowed rounded-full border-[1.5px] border-ink/40 px-5 py-2.5 text-sm font-medium text-ink-faint">
            Unlock for $3 · coming soon
          </span>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-rule pt-10">
          <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90">
            Try it free — watch a company validate your idea
          </Link>
          <Link href="/playbooks" className="rounded-full border-[1.5px] border-ink px-6 py-3 text-sm font-medium transition hover:bg-cream-2">
            More playbooks
          </Link>
        </div>

        {/* Read next — contextual internal links (SEO link equity + keeps readers going deeper). */}
        {next.length > 0 && (
          <div className="mt-16 border-t border-rule pt-10">
            <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sienna">READ NEXT</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {next.map((p) => (
                <Link
                  key={p.slug}
                  href={`/playbooks/${p.slug}`}
                  className="group rounded-2xl border border-rule bg-cream-2 p-5 transition hover:border-ink"
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <Clock size={11} /> {p.readMins} min
                  </span>
                  <div className="mt-2 font-medium leading-snug" style={serifStyle}>{p.title}</div>
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{p.summary}</p>
                  <span className="mt-3 inline-block text-[13px] font-medium text-pine">Read →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </LedgerShell>
  );
}
