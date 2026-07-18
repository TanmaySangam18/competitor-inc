import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// /notices — THIRD-PARTY-NOTICES.md, served. Our own license shield (lib/core/licenses.ts) requires us to
// KEEP attribution notices; this page makes them public, which is the honest end of that rule. Static:
// the markdown is read once at build time and baked into the page.

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "competitor.inc — third-party notices",
  description: "Attribution notices for third-party software, as required by their licenses.",
};

export default function NoticesPage() {
  const notices = readFileSync(join(process.cwd(), "THIRD-PARTY-NOTICES.md"), "utf8");
  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      {/* ADR-0009: the shared site chrome replaces the bespoke header — one nav everywhere. */}
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
          Third-party notices
        </p>
        <pre className="mt-6 whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted">{notices}</pre>
      </section>
      <SiteFooter />
    </main>
  );
}
