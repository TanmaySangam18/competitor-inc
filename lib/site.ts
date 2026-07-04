// The single source of truth for the public base URL — imported by layout metadataBase, robots,
// sitemap, and per-page canonical/OG tags so they can NEVER drift apart again (they had, which put
// canonical + share-card URLs on a stale domain).
//
// Default = the founder's live Vercel URL (competitor-inc-zeta). The old competitor-inc.vercel.app is
// a stale, different account — never default to it. At launch, set NEXT_PUBLIC_SITE_URL to the custom
// domain in one place and everything follows.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://competitor-inc-zeta.vercel.app").replace(/\/+$/, "");
