import { assertSafeBaseUrl } from "@/lib/engine/net";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// The in-app "live site preview" relay. competitor.inc fetches the built site SERVER-SIDE and re-serves
// its HTML from our own origin, so the preview renders INSIDE the app (the founder's "visible only within
// Competitor" reveal) via a sandboxed iframe pointed at THIS route — never at the site's real URL.
//
// Honest ceiling (disclosed to the founder): the current engine is client-side, so a determined user can
// still read the site's asset origins from network requests. This is a strong preview + wow surface, NOT
// DRM. The cryptographically leak-proof version (server-authoritative URLs, never on the client) is the
// hardening we add when real payment turns on. Until then this is safe because nothing is being charged.
//
// SAFETY: SSRF-guarded (https-only, blocks localhost/internal/metadata IPs), size + time capped, HTML
// only, rate-limited, served with `frame-ancestors 'self'` so only our own pages can frame it.

const MAX_BYTES = 600_000;
const TIMEOUT_MS = 10_000;

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function page(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Only competitor.inc's own pages may frame this relay.
      "content-security-policy": "frame-ancestors 'self'",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "private, max-age=60",
      "referrer-policy": "no-referrer",
    },
  });
}

function unavailable(msg: string, sub = ""): Response {
  // A graceful, on-brand in-frame message so the preview never shows a broken/blank box.
  return page(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
      `<body style="margin:0;font:14px system-ui,-apple-system,sans-serif;color:#57534e;background:#f3eee2;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:1.5rem">` +
      `<div style="max-width:22rem">` +
      `<div style="font-size:15px;font-weight:600;color:#14130e;margin-bottom:.4rem">${escapeAttr(msg)}</div>` +
      (sub ? `<div style="line-height:1.55">${escapeAttr(sub)}</div>` : "") +
      `</div></body></html>`,
  );
}

export async function GET(req: Request): Promise<Response> {
  if (await overLimit(`site-preview:${clientIp(req)}`)) return unavailable("Preview is busy — try again in a moment.");

  const raw = new URL(req.url).searchParams.get("u") || "";
  let u: URL;
  try {
    u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return unavailable("No site to preview yet.");
  }
  try {
    assertSafeBaseUrl(u.origin); // https-only + no private/loopback/metadata hosts
  } catch {
    return unavailable("This site can't be previewed here.");
  }

  let res: Response;
  try {
    res = await fetch(u.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "competitor.inc-preview", accept: "text/html" },
      redirect: "follow",
    });
  } catch {
    return unavailable("Couldn't load the live site just now.");
  }
  if (res.status === 404) return unavailable("No live site here yet.", "This idea got a preview build, not a real deploy. Connect a GitHub key in Settings and the crew ships a real, live URL right here.");
  if (!res.ok) return unavailable("Couldn't load the preview.", "The live site isn't responding right now — try again in a moment.");
  const ctype = res.headers.get("content-type") || "";
  if (!/html/.test(ctype)) return unavailable("This page isn't previewable.");

  let html = (await res.text()).slice(0, MAX_BYTES);

  // Resolve relative assets against the REAL final URL, and drop anything that would fight the frame:
  // the site's own <base>, and any page-level CSP that could block its own assets inside the sandbox.
  const baseHref = escapeAttr(res.url || u.toString());
  html = html
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");
  const baseTag = `<base href="${baseHref}">`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`) : `${baseTag}${html}`;

  return page(html);
}
