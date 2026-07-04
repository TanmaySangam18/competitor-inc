import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lock, Check } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { PLAYBOOKS, getPlaybook, readNext } from "@/lib/engine/playbooks";
import { SITE_URL } from "@/lib/site";

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
    <div id="main" className="min-h-screen">
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
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/playbooks" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Playbooks
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-28 pt-16">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
          <Clock size={12} /> {pb.readMins} min read
        </span>
        <h1 className="display mt-3 text-3xl leading-[1.05] md:text-5xl">{pb.title}</h1>
        <p className="mt-4 text-lg text-muted">{pb.summary}</p>

        {/* Free intro — public (the hook + the SEO) */}
        <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed">
          {pb.freeIntro.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* What's inside — section headings are a free teaser (no paid prose) */}
        <div className="mt-10 rounded-2xl glass-panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-2">What's inside the full playbook</h2>
          <ul className="mt-3 space-y-2">
            {pb.body.map((s) => (
              <li key={s.heading} className="flex items-start gap-2.5 text-sm">
                <Check size={15} className="mt-0.5 shrink-0 text-mint" />
                <span>{s.heading}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ — public, indexable, long-tail question intent (pairs with the FAQPage schema above). */}
        {pb.faqs && pb.faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-2">Frequently asked</h2>
            <div className="mt-4 space-y-3">
              {pb.faqs.map((f) => (
                <details key={f.q} className="rounded-2xl glass-panel p-5">
                  <summary className="cursor-pointer list-none font-medium leading-snug">{f.q}</summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Paywall — body is genuinely withheld (server doesn't render it); $3 unlock ships in Phase 3 */}
        <div className="mt-6 rounded-2xl border border-coral/30 bg-coral/[0.05] p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-coral/15 text-coral">
            <Lock size={22} />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Unlock the full playbook</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The complete playbook — the steps, the thresholds, the real tactics — for <strong>$3</strong>, once.
            Like a short, honest ebook. <span className="text-muted-2">Unlocking goes live soon.</span>
          </p>
          <span className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-coral/40 px-5 py-2.5 text-sm font-semibold text-bg">
            Unlock for $3 · coming soon
          </span>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl bg-text px-6 py-3.5 font-semibold text-bg transition hover:opacity-90"
          >
            Try it free — watch a crew validate your idea <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link href="/playbooks" className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3.5 font-semibold transition hover:border-white/25">
            More playbooks
          </Link>
        </div>

        {/* Read next — contextual internal links (SEO link equity + keeps readers going deeper). */}
        {next.length > 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-2">Read next</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {next.map((p) => (
                <Link
                  key={p.slug}
                  href={`/playbooks/${p.slug}`}
                  className="group rounded-2xl glass-panel p-5 transition hover:border-white/25"
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2">
                    <Clock size={11} /> {p.readMins} min
                  </span>
                  <div className="mt-2 font-semibold leading-snug transition group-hover:text-text">{p.title}</div>
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{p.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted transition group-hover:text-text">
                    Read <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
