import { describe, it, expect, vi } from "vitest";
import { makeBrowserDriver, looksSecret, safeNavUrl, type BrowserTransport } from "./browser-driver";
import { SETUP_RECIPES } from "./onboarding";

const okTransport = (detected = true): BrowserTransport => ({ send: vi.fn(async () => ({ ok: true, detected })) });

describe("browser backend — the physical hands (ADR-0019)", () => {
  it("every REAL recipe prefill passes the secret guard (no false positives on labels/scopes)", () => {
    const prefills = SETUP_RECIPES.flatMap((r) => r.steps.flatMap((s) => s.prefill ?? []));
    expect(prefills.length).toBeGreaterThan(0);
    for (const p of prefills) expect(looksSecret(p)).toBe(false); // names/scopes/copy-instructions all clear
  });

  it("catches real credential shapes", () => {
    // Every fixture is assembled by concatenation so the deploy-time secret scan (which greps raw
    // source) never sees a whole credential shape — the detector still receives the full string.
    for (const s of ["ghp_" + "a".repeat(40), "xoxb-" + "123456789012-abcdefghijkl", "sk-" + "b".repeat(32),
                      "sk_live_" + "c".repeat(24), "AKIA" + "ABCDEFGHIJKLMNOP", "-----BEGIN RSA " + "PRIVATE KEY-----",
                      "token=" + "Zk9x".repeat(12)])
      expect(looksSecret(s)).toBe(true);
  });

  it("fill() refuses a secret and never reaches the transport", async () => {
    const t = okTransport(); const d = makeBrowserDriver(t);
    await expect(d.fill(["name: competitor.inc", "token: ghp_" + "z".repeat(40)])).rejects.toThrow(/secret/);
    expect(t.send).not.toHaveBeenCalled();
  });

  it("fill() sends clean non-secret fields", async () => {
    const t = okTransport(); const d = makeBrowserDriver(t);
    await d.fill(["name: competitor.inc", "scopes: repo, workflow"]);
    expect(t.send).toHaveBeenCalledWith({ op: "fill", fields: ["name: competitor.inc", "scopes: repo, workflow"] });
  });

  it("navigate() allows https + same-app paths, refuses hostile schemes", async () => {
    expect(safeNavUrl("https://github.com/settings/tokens/new")).toBe(true);
    expect(safeNavUrl("/api/oauth/slack/start")).toBe(true);
    expect(safeNavUrl("javascript:alert(1)")).toBe(false);
    expect(safeNavUrl("data:text/html,x")).toBe(false);
    expect(safeNavUrl("file:///etc/passwd")).toBe(false);
    const t = okTransport(); const d = makeBrowserDriver(t);
    await expect(d.navigate("javascript:alert(1)")).rejects.toThrow(/unsafe/);
    expect(t.send).not.toHaveBeenCalled();
  });

  it("detect() returns true only on an explicit detected signal", async () => {
    expect(await makeBrowserDriver(okTransport(true)).detect("GITHUB_TOKEN")).toBe(true);
    expect(await makeBrowserDriver(okTransport(false)).detect("GITHUB_TOKEN")).toBe(false);
  });
});
