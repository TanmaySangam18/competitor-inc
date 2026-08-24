import { describe, it, expect, vi } from "vitest";
import { classify, probeOne, sweep, appendHistory, DEGRADED_MS, HISTORY_LIMIT, type Target } from "./watcher";
import { decide, type Probe } from "@/lib/core/incident";

const res = (status: number) => new Response("ok", { status });
const targets = (n: number): Target[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, url: `https://p${i}.test` }));

describe("classifying one response", () => {
  it("calls a fast 2xx up", () => expect(classify(200, 120, false)).toBe("up"));
  it("calls a followed redirect up", () => expect(classify(301, 100, false)).toBe("up"));
  it("calls a slow 2xx degraded, because a page nobody waits for is not alive", () => {
    expect(classify(200, DEGRADED_MS + 1, false)).toBe("degraded");
  });
  it("calls 5xx down", () => expect(classify(500, 100, false)).toBe("down"));
  it("calls 404 at the root down, since the product is broken for its user", () => {
    expect(classify(404, 100, false)).toBe("down");
  });
  it("calls a thrown request down", () => expect(classify(null, 50, true)).toBe("down"));
  it("calls a missing status unknown rather than assuming", () => expect(classify(null, 50, false)).toBe("unknown"));
});

describe("probing never throws, because a crashed watcher is worse than an uncertain one", () => {
  it("returns a down probe when fetch rejects, carrying the reason", async () => {
    const p = await probeOne(targets(1)[0], { fetchImpl: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) });
    expect(p.health).toBe("down");
    expect(p.detail).toContain("ECONNREFUSED");
  });

  it("survives a non-Error rejection", async () => {
    const p = await probeOne(targets(1)[0], { fetchImpl: vi.fn().mockRejectedValue("just a string") });
    expect(p.health).toBe("down");
    expect(p.detail).toBe("probe failed");
  });

  it("records how long it took", async () => {
    let t = 1000;
    const p = await probeOne(targets(1)[0], { fetchImpl: async () => { t += 250; return res(200); }, now: () => t });
    expect(p.ms).toBe(250);
    expect(p.health).toBe("up");
  });
});

describe("THE SINGLE VANTAGE POINT GUARD", () => {
  it("reports unknown, not down, when every target fails in one sweep", async () => {
    // The likely cause of five unrelated products dying at the same instant is our own network.
    const s = await sweep(targets(5), { fetchImpl: vi.fn().mockRejectedValue(new Error("network down")) });
    expect(s.allFailed).toBe(true);
    expect(s.probes.every((p) => p.health === "unknown")).toBe(true);
    expect(s.probes[0].detail).toMatch(/more likely our own network/i);
  });

  it("and incident.ts then refuses to act on it, which is the point of the guard", async () => {
    const s = await sweep(targets(5), { fetchImpl: vi.fn().mockRejectedValue(new Error("network down")) });
    // Three prior real failures plus this sweep: without the guard this would revert every product.
    const history: Probe[] = [{ at: "x", health: "down" }, { at: "y", health: "down" }, { at: "z", health: "down" }];
    const v = decide({
      probes: [...history, s.probes[0]],
      deploys: [{ id: "new", at: new Date().toISOString(), provenHealthy: false }, { id: "old", at: new Date().toISOString(), provenHealthy: true }],
      now: new Date(),
    });
    expect(v.act.do).toBe("watch");
  });

  it("does NOT downgrade when only some targets fail, because then it is really them", async () => {
    const fetchImpl = vi.fn((url: string) => (url.includes("p0") ? Promise.reject(new Error("dead")) : Promise.resolve(res(200))));
    const s = await sweep(targets(3), { fetchImpl: fetchImpl as never });
    expect(s.allFailed).toBe(false);
    expect(s.probes.find((p) => p.id === "p0")!.health).toBe("down");
    expect(s.probes.find((p) => p.id === "p1")!.health).toBe("up");
  });

  it("does NOT downgrade a single target, since one failure of one target is just that target", async () => {
    const s = await sweep(targets(1), { fetchImpl: vi.fn().mockRejectedValue(new Error("dead")) });
    expect(s.allFailed).toBe(false);
    expect(s.probes[0].health).toBe("down");
  });

  it("handles an empty target list without claiming anything", async () => {
    const s = await sweep([], { fetchImpl: vi.fn() });
    expect(s.probes).toEqual([]);
    expect(s.allFailed).toBe(false);
  });
});

describe("history stays short and per-target", () => {
  it("appends oldest first and keeps targets separate", () => {
    let h: Record<string, Probe[]> = {};
    h = appendHistory(h, { id: "a", at: "1", health: "up" });
    h = appendHistory(h, { id: "b", at: "2", health: "down" });
    h = appendHistory(h, { id: "a", at: "3", health: "down" });
    expect(h.a.map((p) => p.at)).toEqual(["1", "3"]);
    expect(h.b).toHaveLength(1);
  });

  it("caps at the limit, dropping the oldest", () => {
    let h: Record<string, Probe[]> = {};
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) h = appendHistory(h, { id: "a", at: String(i), health: "up" });
    expect(h.a).toHaveLength(HISTORY_LIMIT);
    expect(h.a[0].at).toBe("5");
  });

  it("does not leak the id into the stored probe", () => {
    const h = appendHistory({}, { id: "a", at: "1", health: "up" });
    expect("id" in h.a[0]).toBe(false);
  });

  it("does not mutate the history it was given", () => {
    const before: Record<string, Probe[]> = { a: [{ at: "1", health: "up" }] };
    appendHistory(before, { id: "a", at: "2", health: "down" });
    expect(before.a).toHaveLength(1);
  });
});
