import { describe, it, expect } from "vitest";
import { rateLimited, clientIp, RATE_LIMIT } from "./ratelimit";

describe("rateLimited — per-IP fixed window", () => {
  it("allows up to MAX requests, then blocks within the window", () => {
    const ip = "ip-allow-then-block";
    const t = 1_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) expect(rateLimited(ip, t)).toBe(false);
    expect(rateLimited(ip, t)).toBe(true); // MAX+1 → blocked
  });

  it("resets after the window elapses", () => {
    const ip = "ip-reset";
    const t = 2_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) rateLimited(ip, t);
    expect(rateLimited(ip, t)).toBe(true);
    expect(rateLimited(ip, t + RATE_LIMIT.WINDOW_MS + 1)).toBe(false); // new window
  });

  it("tracks IPs independently", () => {
    const t = 3_000_000;
    for (let i = 0; i < RATE_LIMIT.MAX; i++) rateLimited("ip-a", t);
    expect(rateLimited("ip-a", t)).toBe(true);
    expect(rateLimited("ip-b", t)).toBe(false); // separate bucket
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
