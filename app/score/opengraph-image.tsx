import { ImageResponse } from "next/og";

// Shareable link-preview for the free Idea Scorecard (Slice B). Rendered in-repo, matches the root OG.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Score your startup idea — free · competitor.inc";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#212121",
          padding: "80px",
          color: "#ececec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "#ececec" }} />
          <div style={{ fontSize: "40px", fontWeight: 700, fontFamily: "monospace", letterSpacing: "-1px" }}>competitor.inc</div>
        </div>
        <div style={{ fontSize: "76px", fontWeight: 700, marginTop: "44px", lineHeight: 1.05 }}>
          Score your startup idea.
        </div>
        <div style={{ fontSize: "30px", color: "#b4b4b4", marginTop: "28px", maxWidth: "920px" }}>
          An honest AI verdict in 30 seconds — the score, the evidence, and the crew that would build it. Free.
        </div>
      </div>
    ),
    size
  );
}
