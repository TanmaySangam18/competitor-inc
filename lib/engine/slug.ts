// THE slug module. Slugs are the attribution key joining events / demand_signups / revenue_events
// (funnel.ts) — every producer and validator must share one set of semantics or revenue attribution
// silently orphans. Three exports, three jobs:
//   companySlug()  — makes a company's display slug from its name (short, human, ≤3 words)
//   sanitizeSlug() — normalizes untrusted input into a storable slug (char-based, 80 cap)
//   SLUG_RE        — the ONE validation regex every public API uses to accept/reject a slug

export const SLUG_RE = /^[a-z0-9-]{2,80}$/;

// Company display slug: first three words of the name. Always non-empty and url-safe.
export function companySlug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join("-") || "venture"
  );
}

// Untrusted-input normalizer (public API bodies): keep slug chars, collapse the rest to hyphens.
export const sanitizeSlug = (s: string) =>
  s.slice(0, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
