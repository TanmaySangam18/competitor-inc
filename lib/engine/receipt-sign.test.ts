import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { signMetricCard, verifyMetricSig, signedMetricCardUrl } from "./receipt-sign";

describe("signed metric receipts — only OUR server can mint a stamped number (6b closure)", () => {
  beforeEach(() => vi.stubEnv("RECEIPT_SIGNING_SECRET", "test-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("sign → verify roundtrips; any tamper (title, value, or sig) fails", () => {
    const sig = signMetricCard("Signups this week", "34 real signups")!;
    expect(verifyMetricSig("Signups this week", "34 real signups", sig)).toBe(true);
    expect(verifyMetricSig("Signups this week", "340 real signups", sig)).toBe(false); // inflated value
    expect(verifyMetricSig("Revenue", "34 real signups", sig)).toBe(false); // swapped title
    expect(verifyMetricSig("Signups this week", "34 real signups", sig.slice(0, -2) + "ab")).toBe(false); // forged sig
    expect(verifyMetricSig("Signups this week", "34 real signups", "")).toBe(false);
  });

  it("no secret ⇒ no cards at all (fail-closed: a stamp we can't verify doesn't exist)", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("RECEIPT_SIGNING_SECRET", "");
    vi.stubEnv("TRACK_SALT", "");
    expect(signMetricCard("x", "y")).toBeNull();
    expect(signedMetricCardUrl("https://site", "x", "y")).toBeNull();
    expect(verifyMetricSig("x", "y", "deadbeef")).toBe(false);
  });

  it("the mint URL carries kind/title/value/sig and verifies against itself", () => {
    const url = new URL(signedMetricCardUrl("https://competitor-inc-zeta.vercel.app/", "Weekly report", "6 builds shipped")!);
    expect(url.pathname).toBe("/api/receipt-card");
    expect(url.searchParams.get("kind")).toBe("metric");
    expect(verifyMetricSig(url.searchParams.get("title")!, url.searchParams.get("value")!, url.searchParams.get("sig")!)).toBe(true);
  });
});
