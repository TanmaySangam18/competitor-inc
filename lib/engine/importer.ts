import "server-only";
import { assertSafeBaseUrl } from "./net";

// 2.8 Import on-ramp (PDR §5) — read an EXISTING project's public landing page so the agents can audit it.
// SAFETY: SSRF-guarded (blocks localhost/internal IPs), http(s) only, html only, timeout + size caps. This
// is a READ-ONLY public audit (no ownership needed — same as any SEO auditor). OPERATING the project
// (building improvements) is gated separately on ownership verification — that's the line we don't cross.

export interface SiteText {
  ok: boolean;
  title?: string;
  text?: string;
  error?: string;
}

export async function fetchSiteText(url: string): Promise<SiteText> {
  let u: URL;
  try {
    u = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return { ok: false, error: "that doesn't look like a URL" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, error: "URL must be http(s)" };
  try {
    assertSafeBaseUrl(u.origin); // SSRF guard — no localhost / internal hosts
  } catch {
    return { ok: false, error: "that URL isn't allowed" };
  }
  try {
    const res = await fetch(u.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: { "user-agent": "competitor.inc-importer" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, error: `couldn't reach the site (${res.status})` };
    const ctype = res.headers.get("content-type") || "";
    if (!/html|text/.test(ctype)) return { ok: false, error: "that page isn't HTML we can read" };
    const html = (await res.text()).slice(0, 200_000);
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim().slice(0, 200);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    if (!text) return { ok: false, error: "couldn't find readable content on that page" };
    return { ok: true, title, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }
}
