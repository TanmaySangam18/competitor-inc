import type { MetadataRoute } from "next";
import { PLAYBOOKS } from "@/lib/engine/playbooks";
import { POSTS } from "@/app/blog/posts";
import { SITE_URL } from "@/lib/site";

// Public sitemap — the marketing + content surface (playbooks + blog are the SEO engine). App/private
// routes (dashboard, house, auth, api) are deliberately excluded. Crawlers only fetch this once
// robots.ts allows crawling (NEXT_PUBLIC_SITE_PUBLIC=1 at launch); it's ready and waiting.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/how-it-works", "/delegation", "/playbooks", "/compare", "/nu", "/proof", "/join", "/blog", "/privacy", "/terms"];
  const playbookRoutes = PLAYBOOKS.map((p) => `/playbooks/${p.slug}`);
  const blogRoutes = POSTS.map((p) => `/blog/${p.slug}`);
  return [...staticRoutes, ...playbookRoutes, ...blogRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path.startsWith("/playbooks") || path.startsWith("/blog/") ? 0.8 : 0.6,
  }));
}
