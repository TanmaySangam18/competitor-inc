"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

// The in-app "live site preview" — the founder's reveal, shown INSIDE competitor. The built site is
// relayed through our own origin (/api/site-preview) and rendered in a sandboxed iframe, framed in
// browser chrome, so it looks and behaves like the real thing without navigating away. The sandbox has
// NO allow-same-origin, so the relayed page runs in an opaque origin and can never touch our app.
//
// Honest ceiling: this is a strong preview/wow surface, not DRM (see the relay route). Good enough while
// access is free/reserve; the leak-proof version is the hardening that ships with real payment.

export default function LivePreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  if (!url || !/^https?:\/\//.test(url)) return null;

  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    return null;
  }
  const src = `/api/site-preview?u=${encodeURIComponent(url)}`;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-bg/40">
      <div className="flex items-center gap-2 border-b border-border bg-bg/60 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-coral/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint/50" />
        </span>
        <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-bg/50 px-2.5 py-1 text-xs text-muted-2">
          <Lock size={11} className="shrink-0" />
          <span className="truncate">{host}</span>
        </div>
        <span className="shrink-0 rounded-md bg-mint/12 px-2 py-0.5 text-[10px] font-medium text-mint">Live</span>
      </div>
      <div className="relative aspect-[16/10] w-full bg-bg">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-muted-2">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}
        <iframe
          src={src}
          title="Live preview of your site"
          onLoad={() => setLoaded(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-popups"
          className="h-full w-full border-0"
        />
      </div>
      <p className="border-t border-border px-3 py-1.5 text-center text-[11px] text-muted-2">
        Live preview — rendered inside competitor
      </p>
    </div>
  );
}
