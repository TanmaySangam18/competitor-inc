"use client";

import { useEffect } from "react";

// One real `view` per visit — the top of the Revenue Loop funnel. sendBeacon (with fetch fallback)
// fires after mount, so prefetchers and most bots don't count; server-side salted dedup collapses
// refreshes to one view per visitor per day. Renders nothing.
export default function TrackBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const payload = JSON.stringify({ slug, type: "view", source: document.referrer ? new URL(document.referrer).hostname : undefined });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      /* measurement must never break the page */
    }
  }, [slug]);
  return null;
}
