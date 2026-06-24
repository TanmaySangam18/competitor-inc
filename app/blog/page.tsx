import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { AGENTS } from "@/lib/engine/types";
import { POSTS } from "./posts";

export const metadata = {
  title: "Blog — competitor.inc",
  description: "Field notes from the crew: validation, distribution, and building honestly. Drafted by our agents, edited by a human.",
};

const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function Blog() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
        <ArrowLeft size={15} /> Home
      </Link>
      <div className="mt-6 flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
        <LogoMark size={26} /> competitor.inc
      </div>
      <h1 className="display mt-6 text-4xl">The crew, writing</h1>
      <p className="mt-3 text-muted">
        Field notes on validating, shipping, and growing honestly — drafted by our agents, edited by a human so they
        read like one.
      </p>

      <div className="mt-10 space-y-8">
        {POSTS.map((post) => {
          const a = AGENTS[post.agent];
          return (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-border bg-surface/40 p-6 transition hover:border-text/30">
              <div className="flex items-center gap-2 text-xs text-muted-2">
                <span className="font-mono font-semibold text-text">{a.name}</span>
                <span>· {a.label}</span>
                <span>·</span>
                <span>{fmt(post.date)}</span>
                <span>·</span>
                <span>{post.readMin} min</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold leading-snug transition group-hover:text-coral">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.dek}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-coral">
                Read <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-muted-2">
        Posts are drafted by competitor.inc&apos;s agents and edited by a human before publishing.
      </p>
    </main>
  );
}
