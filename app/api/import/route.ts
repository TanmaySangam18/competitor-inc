import { overLimit, clientIp } from "@/lib/engine/ratelimit";
import { fetchSiteText, simulatedAudit } from "@/lib/engine/importer";
import { auditSite } from "@/lib/engine/server";

export const runtime = "nodejs";

// 2.8 Import on-ramp (PDR §5). POST { url } → read the public landing page (SSRF-guarded) → model audit
// (strengths/weaknesses/opportunities). READ-ONLY public audit — no ownership needed. Operating the
// project (building improvements) is gated separately on ownership verification. Fail-soft, rate-limited.
export async function POST(req: Request) {
  if (await overLimit(`import:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const url = typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url.trim() : "";
  if (!url) return Response.json({ ok: false, error: "no url" }, { status: 400 });

  const site = await fetchSiteText(url);
  if (!site.ok || !site.text) return Response.json({ ok: false, error: site.error || "couldn't read that page" });

  // Prefer a model-powered audit; fall back to a deterministic heuristic read so the on-ramp NEVER
  // dead-ends without a key (consistent with the simulated validation engine).
  const audit = (await auditSite(site.title || url, site.text).catch(() => null)) || simulatedAudit(site.title || url, site.text);

  return Response.json({ ok: true, title: site.title || url, audit });
}
