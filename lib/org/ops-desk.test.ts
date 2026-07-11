import { describe, it, expect } from "vitest";
import { assessDeploys, probeProducts, watchDeploys, type WatchedProduct } from "./ops-desk";

const T0 = 1_800_000_000_000;

const PRODUCTS: WatchedProduct[] = [
  { productId: "support-desk", url: "https://support.example.vercel.app" },
  { productId: "tracker", url: "https://tracker.example.vercel.app" },
  { productId: "new-build", url: null }, // pipeline hasn't published a verified URL yet
];

describe("ops desk — deploy watch (Day One: ops agents watch deploys, honestly)", () => {
  it("assesses live / down / building from probe reality", () => {
    const report = assessDeploys(
      PRODUCTS,
      [
        { productId: "support-desk", ok: true, status: 200, realPage: true },
        { productId: "tracker", ok: true, status: 503, realPage: false },
      ],
      T0,
    );
    expect(report.counts).toEqual({ live: 1, down: 1, building: 1, unknown: 0 });
    expect(report.products.find((p) => p.productId === "support-desk")!.state).toBe("live");
    expect(report.products.find((p) => p.productId === "tracker")!.state).toBe("down");
    expect(report.products.find((p) => p.productId === "new-build")!.state).toBe("building");
    // a down product is an escalation the org must act on
    expect(report.escalations).toEqual([{ productId: "tracker", reason: expect.stringContaining("HTTP 503") }]);
  });

  it("HONESTY: no probe result or a failed probe is UNKNOWN — never guessed live", () => {
    const report = assessDeploys(PRODUCTS.slice(0, 2), [{ productId: "tracker", ok: false }], T0);
    expect(report.products.find((p) => p.productId === "support-desk")!.state).toBe("unknown"); // not probed
    expect(report.products.find((p) => p.productId === "tracker")!.state).toBe("unknown"); // probe failed
    expect(report.counts.live).toBe(0);
    for (const p of report.products) expect(p.evidence).toContain("not guessed");
  });

  it("a 200 that is still the scaffold counts as DOWN (SERVES_REAL analog), with evidence", () => {
    const report = assessDeploys(
      [PRODUCTS[0]],
      [{ productId: "support-desk", ok: true, status: 200, realPage: false }],
      T0,
    );
    expect(report.products[0].state).toBe("down");
    expect(report.products[0].evidence).toContain("not a real page");
  });

  it("probeProducts detects real pages vs scaffolds vs network failures (injected fetch, zero network)", async () => {
    const fetchImpl = async (url: string) => {
      if (url.includes("support")) return { status: 200, text: async () => "<html><body>Support desk</body></html>" };
      if (url.includes("tracker")) return { status: 200, text: async () => "<html><body>Get started by editing app/page.tsx</body></html>" };
      throw new Error("network");
    };
    const probes = await probeProducts(PRODUCTS, fetchImpl);
    expect(probes).toHaveLength(2); // building product (no url) is never probed
    expect(probes.find((p) => p.productId === "support-desk")).toMatchObject({ ok: true, status: 200, realPage: true });
    expect(probes.find((p) => p.productId === "tracker")).toMatchObject({ ok: true, status: 200, realPage: false }); // scaffold ≠ real
  });

  it("watchDeploys end to end: one pass, honest report", async () => {
    const fetchImpl = async () => ({ status: 200, text: async () => "<html><body>real</body></html>" });
    const report = await watchDeploys(PRODUCTS, fetchImpl, T0);
    expect(report.checkedAt).toBe(T0);
    expect(report.counts).toEqual({ live: 2, down: 0, building: 1, unknown: 0 });
    expect(report.escalations).toHaveLength(0);
  });
});
