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

export interface SiteAudit {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

// Deterministic, model-free audit — an honest heuristic read of the fetched page so the import on-ramp
// WORKS WITHOUT AN API KEY (same posture as the simulated validation engine; the on-ramp must never
// dead-end). When a model is configured, auditSite() in server.ts produces a richer read and this is the
// fallback. The "opportunities" are grounded in proven first-customer tactics (positioning, trigger-based
// outreach, programmatic SEO, honest community posts, do-things-that-don't-scale) — not generic filler.
export function simulatedAudit(title: string, text: string): SiteAudit {
  const t = (text || "").toLowerCase();
  const words = t.split(/\s+/).filter(Boolean).length;
  const has = (re: RegExp) => re.test(t);
  const hasPricing = has(/\$\d|\bpricing\b|\bper month\b|\/mo\b|\bsubscribe\b|\bplans?\b/);
  const hasCTA = has(/sign ?up|get started|try (it|free)|\bbuy\b|book a|\bjoin\b|download|start free|request|waitlist|early access/);
  const hasContact = has(/contact|@[a-z0-9.-]+\.[a-z]{2,}/);
  const hasProof = has(/testimonial|loved by|trusted by|reviews?|case stud|\d[\d,]*\s*(users|customers|downloads|signups)/);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (hasCTA) strengths.push("There's a clear call-to-action — visitors know the next step."); else weaknesses.push("No obvious call-to-action — visitors don't know what to do next.");
  if (hasPricing) strengths.push("Pricing/an offer is visible, so buyers can self-qualify."); else weaknesses.push("No visible pricing — friction for anyone ready to pay (charge from day one).");
  if (hasProof) strengths.push("Some social proof is present to build trust."); else weaknesses.push("No social proof (testimonials, customer counts) — hard for a cold visitor to trust.");
  if (hasContact) strengths.push("There's a way to get in touch."); else weaknesses.push("No easy way to reach you — warm leads slip away.");
  if (words >= 120) strengths.push("Enough copy to explain the offer and start ranking in search."); else weaknesses.push("The page is thin — too little to explain the value or rank.");

  const opportunities = [
    "Narrow the headline to ONE user and ONE job — vague positioning is the #1 reason first sales stall (April Dunford). It's free and multiplies everything else.",
    "Send 10–20 hand-written, trigger-based outreach notes to people with the exact problem — one pain, one ask. Trigger-based emails reply at ~20% vs ~4% cold.",
    "Spin up a few programmatic SEO pages ('[tool] alternative', integration & use-case pages) — a top channel for a no-audience maker's first 1,000 customers.",
    "Post one honest 'I built this but couldn't sell it — here's what I learned' story in r/SideProject and Indie Hackers. Real numbers, no link-drop; let people ask.",
    "Do things that don't scale (Paul Graham): onboard your first 5 users 1:1 and set them up on the spot — the documented retention unlock.",
  ];

  const summary = `${title || "This project"} reads as ${words < 120 ? "an early, thin" : "a real"} landing page${hasPricing ? " with a visible offer" : " with no clear offer"}. Building was never the hard part — getting the first paying customers is. Here's an honest read and where the demand likely is.`;

  return { summary, strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4), opportunities: opportunities.slice(0, 4) };
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
