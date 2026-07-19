import { ImageResponse } from "next/og";

// Branded social/link-preview image, rendered in-repo (no design tool, no connector).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "competitor.inc — Prove it before you build it";

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
        <div style={{ fontSize: "78px", fontWeight: 700, marginTop: "44px", lineHeight: 1.05 }}>
          Prove it before you build it.
        </div>
        <div style={{ fontSize: "30px", color: "#b4b4b4", marginTop: "28px", maxWidth: "900px" }}>
          The AI co-founder that validates your idea — honestly — before it builds the winner.
        </div>
      </div>
    ),
    size
  );
}
