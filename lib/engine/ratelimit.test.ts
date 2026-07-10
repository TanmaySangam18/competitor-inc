import { describe, it, expect } from "vitest";
import { memoryLimited, durableLimited, overLimit, clientIp, RATE_LIMIT } from "./ratelimit";

describe("memoryLimited — per-key fixed window (layer 1, unchanged semantics)", () => {
  it("allows up to MAX requests, then blocks within the window", () => {
    const ip = "ip-allow-then-block";
    const t = 1_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) expect(memoryLimited(ip, t)).toBe(false);
    expect(memoryLimited(ip, t)).toBe(true); // MAX+1 → blocked
  });

  it("resets after the window elapses", () => {
    const ip = "ip-reset";
    const t = 2_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) memoryLimited(ip, t);
    expect(memoryLimited(ip, t)).toBe(true);
    expect(memoryLimited(ip, t + RATE_LIMIT.WINDOW_MS + 1)).toBe(false); // new window
  });

  it("tracks IPs independently", () => {
    const t = 3_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) memoryLimited("ip-a", t);
    expect(memoryLimited("ip-a", t)).toBe(true);
    expect(memoryLimited("ip-b", t)).toBe(false); // separate bucket
  });
});

describe("durableLimited — shared Upstash window (layer 2)", () => {
  const env = { url: "https://fake.upstash.io", token: "tok" };
  const respond = (count: number, ok = true) =>
    (async () => new Response(JSON.stringify([{ result: count }, { result: 1 }]), { status: ok ? 200 : 500 })) as unknown as typeof fetch;

  it("unconfigured ⇒ false (layer 1 stands alone; keyless behavior unchanged)", async () => {
    expect(await durableLimited("k", 1_000, {})).toBe(false);
  });

  it("under the limit ⇒ false; over ⇒ true (the shared INCR count decides)", async () => {
    expect(await durableLimited("k", 1_000, env, respond(RATE_LIMIT.MAX))).toBe(false);
    expect(await durableLimited("k", 1_000, env, respond(RATE_LIMIT.MAX + 1))).toBe(true);
  });

  it("fails OPEN on store errors — the limiter can never become the outage", async () => {
    expect(await durableLimited("k", 1_000, env, respond(999, false))).toBe(false); // HTTP 500
    const throwing = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    expect(await durableLimited("k", 1_000, env, throwing)).toBe(false);
  });

  it("buckets the key by window so counts roll over", async () => {
    let seenKey = "";
    const capture = (async (_url: string, init?: RequestInit) => {
      seenKey = (JSON.parse(String(init?.body)) as string[][])[0][1];
      return new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 });
    }) as unknown as typeof fetch;
    await durableLimited("k", 0, env, capture);
    const first = seenKey;
    await durableLimited("k", RATE_LIMIT.WINDOW_MS + 1, env, capture);
    expect(seenKey).not.toBe(first); // a new window ⇒ a new bucket key
  });
});

describe("overLimit — the route guard (memory first, then durable)", () => {
  it("memory blocks immediately without touching the store", async () => {
    const t = 4_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) memoryLimited("ip-c", t);
    expect(await overLimit("ip-c", t)).toBe(true);
  });

  it("passes when memory is under and no store is configured", async () => {
    expect(await overLimit("ip-fresh-key", 5_000_000)).toBe(false);
  });
});

describe("clientIp", () => {
  const req = (h: Record<string, string>) => new Request("http://x", { headers: h });
  it("takes the first x-forwarded-for entry", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
