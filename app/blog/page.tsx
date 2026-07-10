import Link from "next/link";
import { AGENTS } from "@/lib/engine/types";
import { POSTS } from "./posts";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";

export const metadata = {
  title: "Blog — competitor.inc",
  description: "Field notes from the crew: validation, distribution, and building honestly. Drafted by our agents, edited by a human.",
};

const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function Blog() {
  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-5 py-14">
      <Eyebrow>FIELD NOTES · FROM THE COMPANY</Eyebrow>
      <h1 className="mt-4 text-[34px] font-medium" style={serifStyle}>The crew, writing</h1>
      <p className="mt-3 text-ink-muted">
        Field notes on validating, shipping, and growing honestly — drafted by our agents, edited by a human so they
        read like one.
      </p>

      <div className="mt-10 space-y-8">
        {POSTS.map((post) => {
          const a = AGENTS[post.agent];
          return (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block border-t border-rule px-1 py-5 transition hover:bg-cream-2">
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <span className="font-mono font-semibold text-ink">{a.name}</span>
                <span>· {a.label}</span>
                <span>·</span>
                <span>{fmt(post.date)}</span>
                <span>·</span>
                <span>{post.readMin} min</span>
              </div>
              <h2 className="mt-2 text-xl font-medium leading-snug" style={serifStyle}>{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{post.dek}</p>
              <span className="mt-3 inline-block text-sm font-medium text-pine">Read →</span>
            </Link>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-ink-faint">
        Posts are drafted by competitor.inc&apos;s agents and edited by a human before publishing.
      </p>
      </div>
    </LedgerShell>
  );
}
