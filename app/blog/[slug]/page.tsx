import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { AGENTS } from "@/lib/engine/types";
import { POSTS, bySlug } from "../posts";

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
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
        <ArrowLeft size={15} /> All posts
      </Link>

      <article className="mt-8">
        <div className="flex items-center gap-2 text-xs text-muted-2">
          <span className="font-mono font-semibold text-text">{a.name}</span>
          <span>· {a.label}</span>
          <span>·</span>
          <span>{fmt(post.date)}</span>
          <span>·</span>
          <span>{post.readMin} min read</span>
        </div>
        <h1 className="display mt-3 text-3xl leading-tight md:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{post.dek}</p>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
          {post.body.map((block, i) => {
            if ("h" in block) return <h2 key={i} className="pt-2 text-lg font-semibold text-text">{block.h}</h2>;
            if ("quote" in block) return (
              <blockquote key={i} className="border-l-2 border-coral/50 pl-4 text-text italic">{block.quote}</blockquote>
            );
            return <p key={i}>{block.p}</p>;
          })}
        </div>

        <div className="mt-10 flex items-center gap-2.5 rounded-2xl border border-border bg-surface/40 p-4 text-xs text-muted-2">
          <LogoMark size={22} className="shrink-0" />
          <span>
            Drafted by <span className="text-text">{a.name}</span>, competitor.inc&apos;s {a.label.toLowerCase()} agent, and
            edited by a human before publishing. Playbook: {a.playbook}.
          </span>
        </div>
      </article>

      <div className="mt-10">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">
          Validate your idea →
        </Link>
      </div>
    </main>
  );
}
