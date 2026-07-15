// lib/core/badge.ts — "BUILT WITH COMPETITOR.INC" (the free distribution engine).
//
// Every product the company ships for a customer carries a small, honest attribution badge that links home
// with a ?ref — so each built app becomes a real ad, and it compounds (the Lovable/Replit lever). Honest:
// it says only what's true ("built with"), links to the real site, and is REQUIRED on the free/entry tiers,
// optional on the higher paid tiers (a fair value exchange, not a dark pattern).

import { SITE_URL } from "@/lib/site";

export type Tier = "free" | "builder" | "operator" | "concierge";

function slug(s: string): string {
  return (s || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "product";
}

// The home URL a badge points to, tagged so we can attribute the traffic honestly (first-party pixel).
export function badgeUrl(productName?: string): string {
  const p = productName ? `&p=${encodeURIComponent(slug(productName))}` : "";
  return `${SITE_URL}/?ref=built-with${p}`;
}

// Required on free/builder (the badge is the deal); optional on operator/concierge.
export function badgeRequired(tier: Tier): boolean {
  return tier === "free" || tier === "builder";
}

// The HTML snippet the build pipeline injects into a shipped product (a fixed corner pill). Self-contained,
// no external assets. Honest copy only.
export function badgeSnippet(opts: { productName?: string; tier?: Tier } = {}): string {
  const url = badgeUrl(opts.productName);
  return [
    `<a href="${url}" target="_blank" rel="noopener"`,
    ` style="position:fixed;right:12px;bottom:12px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;`,
    `background:#111;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;text-decoration:none">`,
    `Built with competitor<span style="opacity:.7">.inc</span></a>`,
  ].join("");
}
