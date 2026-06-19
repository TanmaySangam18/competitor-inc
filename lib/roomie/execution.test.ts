import { describe, it, expect } from "vitest";
import { realExecutionEnabled, verifyProof, buildOnGitHub } from "./execution";

describe("Phase 1 execution — gated OFF without credentials", () => {
  it("real execution is disabled when no GITHUB_TOKEN is set", () => {
    expect(realExecutionEnabled()).toBe(false);
  });
  it("buildOnGitHub no-ops (falls back to simulated) when disabled — no live calls", async () => {
    const out = await buildOnGitHub({ repo: "x", description: "y", files: {} });
    expect(out.ok).toBe(false);
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
