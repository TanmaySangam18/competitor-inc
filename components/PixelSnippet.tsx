"use client";

import { Check, Copy, Radar } from "lucide-react";
import { useCopy } from "@/components/useCopy";

// "Install our pixel" — the Meta-Pixel mental model, first-party. One tiny script on the customer's
// own site sends anonymous view events to /api/track, which is what lets the Revenue Loop measure a
// REAL funnel (views → signups) instead of guessing. No cookies, no PII, one request per page view.
export default function PixelSnippet({ slug }: { slug: string }) {
  const { copied, copy: copyText } = useCopy(1800);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://competitor-inc-zeta.vercel.app";
  const snippet = `<script>fetch("${origin}/api/track",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:"${slug}",type:"view",source:location.hostname})})</script>`;
  const copy = () => copyText(snippet);

  return (
    <div className="rounded-2xl border border-border bg-bg/40 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Radar size={13} className="text-violet" /> Install the pixel on your site
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
        Paste this before <code className="text-muted">&lt;/body&gt;</code> on your product&apos;s site. It counts
        anonymous page views only — no cookies, no personal data — so your funnel numbers become real.
      </p>
      <div className="mt-2 flex items-start gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-lg border border-border bg-bg/70 p-2.5 font-mono text-[10px] leading-relaxed text-muted">
          {snippet}
        </code>
        <button
          onClick={copy}
          aria-label="Copy pixel snippet"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs text-muted transition hover:text-text"
        >
          {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
