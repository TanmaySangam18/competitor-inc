import type { MetadataRoute } from "next";
import { ROLES } from "@/lib/org/organization";
import { SITE_URL } from "@/lib/site";

// Public sitemap — the simplified marketing surface (ADR-0009): the keepers only. App/private routes
// (dashboard, house, auth, api) are deliberately excluded. Crawlers only fetch this once robots.ts
// allows crawling (NEXT_PUBLIC_SITE_PUBLIC=1 at launch); it's ready and waiting.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/org", "/live", "/benchmark", "/connect", "/services", "/score", "/join", "/notices", "/privacy", "/terms"];
  const orgRoutes = ROLES.map((r) => `/org/${r.id}`);
  return [...staticRoutes, ...orgRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path.startsWith("/org/") ? 0.5 : 0.7,
  }));
}
