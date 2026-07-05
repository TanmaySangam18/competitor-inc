import { describe, it, expect } from "vitest";
import { connectorStatus, CONNECTORS } from "./connectors";

describe("connectors", () => {
  it("reports connected status from capabilities", () => {
    const caps = { model: true, github: true, email: false, ads: false, deploy: false, payments: false, bluesky: false, mastodon: false, reddit: false };
    const st = connectorStatus(caps);
    expect(st.length).toBe(CONNECTORS.length);
    expect(st.find((s) => s.connector.id === "github")!.connected).toBe(true);
    expect(st.find((s) => s.connector.id === "email")!.connected).toBe(false);
  });

  it("marks every outbound (non-build) connector consequential — never auto-fires", () => {
    for (const c of CONNECTORS) {
      expect(c.consequential).toBe(c.category !== "build");
    }
  });
});
