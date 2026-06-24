import type { MetadataRoute } from "next";

// Private beta: keep competitor.inc out of search indexes until the public launch. At launch, allow
// crawling (set `allow: "/"` and drop the disallow, or delete this file) so the surprise-launch SEO
// content can rank.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
