import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://competitor-inc.vercel.app";
// Surprise-launch by default: stay out of search indexes during the private beta. Flip
// NEXT_PUBLIC_SITE_PUBLIC=1 at launch to allow crawling so the SEO content (playbooks) can rank.
const PUBLIC = process.env.NEXT_PUBLIC_SITE_PUBLIC === "1";

export default function robots(): MetadataRoute.Robots {
  if (!PUBLIC) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // Launched: allow crawling of the public surface; keep app/private routes out of the index.
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/house", "/login", "/signup", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
