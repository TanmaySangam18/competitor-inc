import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sell This — the go-to-market that sells any product · competitor.inc";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#0a0a0a", padding: "80px", color: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "#fafafa" }} />
          <div style={{ fontSize: "40px", fontWeight: 700, fontFamily: "monospace", letterSpacing: "-1px" }}>competitor.inc</div>
        </div>
        <div style={{ fontSize: "72px", fontWeight: 700, marginTop: "44px", lineHeight: 1.05 }}>
          Paste a product. Get the plan that sells it.
        </div>
        <div style={{ fontSize: "30px", color: "#a1a1aa", marginTop: "28px", maxWidth: "980px" }}>
          AI agents trained on 50 years of sales science. Others build the app — we get it paid. Free.
        </div>
      </div>
    ),
    size
  );
}
