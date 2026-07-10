import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENTS } from "@/lib/engine/types";
import { POSTS, bySlug } from "../posts";
import { LedgerShell, serifStyle } from "@/components/ledger/LedgerShell";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = bySlug(slug);
  return post ? { title: `${post.title} — competitor.inc`, description: post.dek } : { title: "Not found" };
}

const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = bySlug(slug);
  if (!post) notFound();
  const a = AGENTS[post.agent];

  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-5 py-14">
      <Link href="/blog" className="text-sm text-ink-muted transition hover:text-ink">← All posts</Link>

      <article className="mt-8">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span className="font-mono font-semibold text-ink">{a.name}</span>
          <span>· {a.label}</span>
          <span>·</span>
          <span>{fmt(post.date)}</span>
          <span>·</span>
          <span>{post.readMin} min read</span>
        </div>
        <h1 className="mt-3 text-3xl font-medium leading-tight md:text-4xl" style={serifStyle}>{post.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-muted">{post.dek}</p>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-muted">
          {post.body.map((block, i) => {
            if ("h" in block) return <h2 key={i} className="pt-2 text-lg font-semibold text-ink">{block.h}</h2>;
            if ("quote" in block) return (
              <blockquote key={i} className="border-l-2 border-sienna pl-4 italic text-ink" style={serifStyle}>{block.quote}</blockquote>
            );
            return <p key={i}>{block.p}</p>;
          })}
        </div>

        <div className="press mt-10 rounded-2xl bg-cream-2 p-4 text-xs text-ink-muted">
          Drafted by <span className="font-semibold text-ink">{a.name}</span>, competitor.inc&apos;s {a.label.toLowerCase()} agent, and
          edited by a human before publishing. Playbook: {a.playbook}.
        </div>
      </article>

      <div className="mt-10">
        <Link href="/dashboard" className="inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition hover:opacity-90">
          Validate your idea →
        </Link>
      </div>
      </div>
    </LedgerShell>
  );
}
