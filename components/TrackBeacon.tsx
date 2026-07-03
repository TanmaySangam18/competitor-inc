"use client";

import { useEffect } from "react";

// One real `view` per visit — the top of the Revenue Loop funnel. sendBeacon (with fetch fallback)
// fires after mount, so prefetchers and most bots don't count; server-side salted dedup collapses
// refreshes to one view per visitor per day. Renders nothing.
//
// Source convention: `<utm_source|ref|referrer-host>` + optional `/c:<utm_campaign>` suffix —
// campaign-level attribution rides inside the existing `source` column, no schema change. The
// attribution engine parses the suffix back out (parseCampaign).
export function beaconSource(): string | undefined {
  try {
    const q = new URLSearchParams(window.location.search);
    const src = q.get("utm_source") || q.get("ref") || (document.referrer ? new URL(document.referrer).hostname : "");
    const campaign = (q.get("utm_campaign") || "").slice(0, 40).replace(/[^a-z0-9_-]/gi, "-");
    const s = `${src}${campaign ? `/c:${campaign}` : ""}`.slice(0, 60);
    return s || undefined;
  } catch {
    return undefined;
  }
}

export default function TrackBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const payload = JSON.stringify({ slug, type: "view", source: beaconSource() });
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
