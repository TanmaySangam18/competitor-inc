// Independent reviewer/QA gate on generated app/site code (MISSION §2: nothing merges without review).
// The builder (generateSiteFiles) authors the files; THIS reviews them before they're accepted as "live".
// Conservative by design: it only rejects on CLEAR breakage (a broken/placeholder artifact reaching a
// customer is the failure we're preventing — see the "Coming Soon" incident), never on style. A rejection
// makes the caller fall back to the credible product site, which is honest, not broken.

export interface SiteReview {
  ok: boolean;
  issues: string[];
}

// `kind` mirrors generateSiteFiles: "app" must be interactive; "site" is a static marketing page.
export function reviewGeneratedSite(files: Record<string, string>, kind: "site" | "app"): SiteReview {
  const issues: string[] = [];
  const index = files["index.html"];

  if (!index) {
    return { ok: false, issues: ["no index.html"] };
  }
  const html = index.trim();

  if (!/<!doctype|<html/i.test(html)) issues.push("index.html is not an HTML document");
  if (html.length < 60) issues.push("index.html is effectively empty (placeholder/truncated build)");
  if (!/<body[\s>]/i.test(html) && !/<\/body>/i.test(html)) issues.push("index.html has no <body>");
  // Truncation smell: a valid page ends with a closing tag, not mid-tag / mid-attribute.
  if (/<[a-zA-Z][^>]*$/.test(html)) issues.push("index.html appears truncated (ends mid-tag)");

  // Local <script src="..."> references must resolve to a file we actually shipped (a dangling ref = a
  // blank/broken page in the browser). External URLs (http...) are out of scope here.
  const refs = [...index.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((src) => !/^https?:\/\//i.test(src))
    .map((src) => src.replace(/^\.?\//, ""));
  for (const r of refs) {
    if (!files[r] && !files[`/${r}`]) issues.push(`references a missing local script: ${r}`);
  }

  if (kind === "app") {
    const hasJs = /<script[\s>]/i.test(index) || !!files["app.js"] || Object.keys(files).some((f) => f.endsWith(".js"));
    if (!hasJs) issues.push("app mode produced no JavaScript — not an interactive app");
    if (/coming\s*soon/i.test(index)) issues.push("app mode produced a 'coming soon' placeholder, not a working app");
  }

  return { ok: issues.length === 0, issues };
}
