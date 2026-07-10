import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// THE RECEIPT CARD (Receipts Campaign, slice 1) — a Company-Ledger-styled proof image for a REAL,
// LIVE build. These are our "reels": every verified customer build mints one, and the persona posts
// carry it. Honesty is enforced IN the route: the URL must be a *.vercel.app deploy that responds 200
// RIGHT NOW, or no card exists at all (404) — this route can never stamp something that isn't live,
// no matter what params are passed. Never a dead receipt, never a borrowed one.

const CREAM = "#F5EFE3";
const CREAM2 = "#FDFBF6";
const INK = "#1A1712";
const INK_MUTED = "#6B6355";
const SIENNA = "#8C3A22";
const PINE = "#1F5130";
const RULE = "#D9D0BE";

// Fonts, fetched once per instance from Google Fonts (fail-soft: the card still renders on the
// bundled default if the fetch fails — a receipt beats no receipt).
let fontsPromise: Promise<{ serif: ArrayBuffer | null; mono: ArrayBuffer | null }> | null = null;
async function loadFont(cssUrl: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(cssUrl, { headers: { "user-agent": "Mozilla/5.0" } })).text();
    const m = css.match(/src: url\((https:[^)]+\.(?:ttf|woff2?)[^)]*)\)/);
    if (!m) return null;
    return await (await fetch(m[1])).arrayBuffer();
  } catch {
    return null;
  }
}
function fonts() {
  fontsPromise ??= Promise.all([
    loadFont("https://fonts.googleapis.com/css2?family=Fraunces:wght@500&display=swap"),
    loadFont("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap"),
  ]).then(([serif, mono]) => ({ serif, mono }));
  return fontsPromise;
}

// The metric variant — same ledger card, the number where the URL would be, "VERIFIED · METRIC" stamp.
function metricCard(title: string, value: string, serif: ArrayBuffer | null, mono: ArrayBuffer | null) {
  const serifFamily = serif ? "Fraunces" : "serif";
  const monoFamily = mono ? "JetBrains Mono" : "monospace";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM, padding: "44px", fontFamily: serifFamily }}>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: CREAM2, border: `3px solid ${INK}`, borderRadius: "28px", boxShadow: `10px 10px 0 ${INK}`, padding: "56px 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 22, letterSpacing: "0.14em", color: SIENNA, fontWeight: 500 }}>MEASURED BY THE COMPANY · COMPETITOR.INC</div>
            <div style={{ display: "flex", transform: "rotate(-3deg)", border: `4px solid ${SIENNA}`, color: SIENNA, borderRadius: "10px", padding: "8px 18px", fontFamily: monoFamily, fontSize: 26, fontWeight: 500, letterSpacing: "0.1em" }}>VERIFIED · METRIC</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 56, color: INK, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{title}</div>
            <div style={{ display: "flex", marginTop: 24, fontFamily: monoFamily, fontSize: 40, color: PINE, fontWeight: 500 }}>{value}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${RULE}`, paddingTop: 28 }}>
            <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 22, color: INK_MUTED }}>first-party measurement · server-signed</div>
            <div style={{ display: "flex", fontSize: 22, color: INK_MUTED, fontStyle: "italic" }}>never projected, never invented</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(serif ? [{ name: "Fraunces", data: serif, weight: 500 as const, style: "normal" as const }] : []),
        ...(mono ? [{ name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
      ],
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    }
  );
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const title = (q.get("title") ?? "").slice(0, 80).trim() || "A real product, shipped";
  const review = (q.get("review") ?? "").slice(0, 120).trim();
  const raw = (q.get("url") ?? "").trim();

  // ── METRIC receipts (Block 6b, honest closure): a metric can't be re-verified from params like a
  // live URL can — so metric cards mint ONLY with a valid server HMAC (signedMetricCardUrl). No secret
  // configured ⇒ 503; bad/missing sig ⇒ 403. Nobody outside our server can fabricate a stamped number.
  if (q.get("kind") === "metric") {
    const value = (q.get("value") ?? "").slice(0, 120).trim();
    const sig = (q.get("sig") ?? "").trim();
    if (!value) return new Response("value required", { status: 400 });
    const { verifyMetricSig, signMetricCard } = await import("@/lib/engine/receipt-sign");
    if (!signMetricCard(title, value)) return new Response("metric receipts not configured", { status: 503 });
    if (!verifyMetricSig(title, value, sig)) return new Response("invalid signature — no receipt", { status: 403 });
    const { serif, mono } = await fonts();
    return metricCard(title, value, serif, mono);
  }

  // The honesty gate: only a real https *.vercel.app deploy can appear on a receipt…
  let live: URL;
  try {
    live = new URL(raw);
  } catch {
    return new Response("url required", { status: 400 });
  }
  if (live.protocol !== "https:" || !live.hostname.endsWith(".vercel.app")) {
    return new Response("only verified platform deploys get a receipt", { status: 400 });
  }
  // …and it must be serving RIGHT NOW. Dead build ⇒ no card exists.
  try {
    const head = await fetch(live.href, { method: "HEAD", signal: AbortSignal.timeout(6000) });
    if (!head.ok) return new Response("build is not live — no receipt", { status: 404 });
  } catch {
    return new Response("build is not live — no receipt", { status: 404 });
  }

  const { serif, mono } = await fonts();
  const serifFamily = serif ? "Fraunces" : "serif";
  const monoFamily = mono ? "JetBrains Mono" : "monospace";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM, padding: "44px", fontFamily: serifFamily }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: CREAM2,
            border: `3px solid ${INK}`,
            borderRadius: "28px",
            boxShadow: `10px 10px 0 ${INK}`,
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 22, letterSpacing: "0.14em", color: SIENNA, fontWeight: 500 }}>
              SHIPPED BY THE COMPANY · COMPETITOR.INC
            </div>
            <div
              style={{
                display: "flex",
                transform: "rotate(-3deg)",
                border: `4px solid ${SIENNA}`,
                color: SIENNA,
                borderRadius: "10px",
                padding: "8px 18px",
                fontFamily: monoFamily,
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "0.1em",
              }}
            >
              VERIFIED · LIVE
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 68, color: INK, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{title}</div>
            {review ? (
              <div style={{ display: "flex", marginTop: 26, fontFamily: monoFamily, fontSize: 24, color: INK_MUTED, lineHeight: 1.45 }}>
                design review — “{review}”
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${RULE}`, paddingTop: 28 }}>
            <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 26, color: PINE, fontWeight: 500 }}>{live.hostname} ↗</div>
            <div style={{ display: "flex", fontSize: 22, color: INK_MUTED, fontStyle: "italic" }}>built, reviewed, and published by AI employees — governed by a human</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(serif ? [{ name: "Fraunces", data: serif, weight: 500 as const, style: "normal" as const }] : []),
        ...(mono ? [{ name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
      ],
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    }
  );
}
