import type { MetadataRoute } from "next";
import { PLAYBOOKS } from "@/lib/engine/playbooks";

// Public sitemap — the marketing + content surface (playbooks are the SEO engine). App/private routes
// (dashboard, house, auth, api) are deliberately excluded. Crawlers only fetch this once robots.ts
// allows crawling (NEXT_PUBLIC_SITE_PUBLIC=1 at launch); it's ready and waiting.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://competitor-inc.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/how-it-works", "/delegation", "/playbooks", "/join", "/blog", "/privacy", "/terms"];
  const playbookRoutes = PLAYBOOKS.map((p) => `/playbooks/${p.slug}`);
  return [...staticRoutes, ...playbookRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path.startsWith("/playbooks") ? 0.8 : 0.6,
  }));
}
