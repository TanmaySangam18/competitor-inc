import { describe, it, expect } from "vitest";
import { realExecutionEnabled, verifyProof, buildOnGitHub, runAction, capabilities } from "./execution";

const co = { company: { name: "Demo Co", idea: "an idea" } };

describe("execution capabilities — every integration OFF without keys", () => {
  it("reports github/deploy/email/payments/ads as disabled in a keyless env", () => {
    const c = capabilities();
    expect(c.github).toBe(false);
    expect(c.deploy).toBe(false);
    expect(c.email).toBe(false);
    expect(c.payments).toBe(false);
    expect(c.ads).toBe(false);
  });
  it("realExecutionEnabled is false without GITHUB_TOKEN", () => {
    expect(realExecutionEnabled()).toBe(false);
  });
});

describe("runAction — gated, falls back to simulated (no live calls without keys)", () => {
  it("build / deploy / outreach / spend / payments all report disabled", async () => {
    for (const action of ["build", "deploy", "outreach", "spend", "payments"]) {
      const r = await runAction(action, co);
      expect(r.ok).toBe(false);
      expect(r.disabled).toBe(true);
    }
  });
  it("delete is acknowledged locally (no destructive API)", async () => {
    const r = await runAction("delete", co);
    expect(r.ok).toBe(true);
    expect(r.proof?.value).toMatch(/deletion/i);
  });
  it("unknown action is rejected", async () => {
    const r = await runAction("nonsense", co);
    expect(r.ok).toBe(false);
  });
  it("buildOnGitHub no-ops when disabled", async () => {
    expect((await buildOnGitHub({ repo: "x", description: "y", files: {} })).ok).toBe(false);
  });
});

describe("verifyProof — verify-before-done (the trust moat)", () => {
  it("rejects missing or empty proof", async () => {
    expect(await verifyProof(undefined)).toBe(false);
    expect(await verifyProof({ kind: "url", value: "" })).toBe(false);
  });
  it("accepts a self-describing metric", async () => {
    expect(await verifyProof({ kind: "metric", value: "128 signups" })).toBe(true);
  });
  it("accepts a commit-SHA-shaped build proof, rejects junk", async () => {
    expect(await verifyProof({ kind: "build", value: "a1b2c3d4e5" })).toBe(true);
    expect(await verifyProof({ kind: "build", value: "nope" })).toBe(false);
  });
  it("rejects non-https or malformed urls without any network call", async () => {
    expect(await verifyProof({ kind: "url", value: "not-a-url" })).toBe(false);
    expect(await verifyProof({ kind: "url", value: "http://example.com" })).toBe(false);
  });
});
