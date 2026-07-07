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
    expect(c.bluesky).toBe(false);
    expect(c.mastodon).toBe(false);
  });
  it("realExecutionEnabled is false without GITHUB_TOKEN", () => {
    expect(realExecutionEnabled()).toBe(false);
  });

  it("per-user connections turn github/email/ads live (email needs key AND from)", () => {
    expect(capabilities({ githubToken: "ghp_x", resendApiKey: "", resendFrom: "", adsWebhookUrl: "" }).github).toBe(true);
    expect(capabilities({ githubToken: "", resendApiKey: "re_x", resendFrom: "", adsWebhookUrl: "" }).email).toBe(false);
    expect(capabilities({ githubToken: "", resendApiKey: "re_x", resendFrom: "me@d.com", adsWebhookUrl: "" }).email).toBe(true);
    expect(capabilities({ githubToken: "", resendApiKey: "", resendFrom: "", adsWebhookUrl: "https://h.co/x" }).ads).toBe(true);
    // a connection never flips an operator-only integration
    expect(capabilities({ githubToken: "ghp_x", resendApiKey: "", resendFrom: "", adsWebhookUrl: "" }).deploy).toBe(false);
  });
});

describe("runAction — gated, falls back to simulated (no live calls without keys)", () => {
  it("build / deploy / outreach / payments all report disabled in a keyless env", async () => {
    for (const action of ["build", "deploy", "outreach", "payments", "bluesky", "mastodon"]) {
      const r = await runAction(action, co);
      expect(r.ok).toBe(false);
      expect(r.disabled).toBe(true);
    }
  });
  it("spend is blocked by the hard cap (Gate 2, below the prompt) — not merely disabled", async () => {
    const r = await runAction("spend", co); // default $50 request vs the default $0 cap
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/hard spend cap/i);
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

  it("SSRF-guards a user-supplied ads webhook (blocked URL → error, no network, not disabled)", async () => {
    const orig = process.env.HARD_SPEND_CAP_CENTS;
    process.env.HARD_SPEND_CAP_CENTS = "100000"; // raise the cap so the SSRF guard — not the cap — is what blocks
    try {
      const r = await runAction("spend", {
        company: { name: "X", idea: "y" },
        item: { kind: "spend", title: "t", amount: 10 },
        connections: { githubToken: "", resendApiKey: "", resendFrom: "", adsWebhookUrl: "https://169.254.169.254/hook" },
      });
      expect(r.ok).toBe(false);
      expect(r.disabled).toBeUndefined();
      expect(r.error).toMatch(/blocked|private/i);
    } finally {
      if (orig === undefined) delete process.env.HARD_SPEND_CAP_CENTS;
      else process.env.HARD_SPEND_CAP_CENTS = orig;
    }
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
