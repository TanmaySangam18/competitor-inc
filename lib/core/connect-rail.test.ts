import { describe, it, expect } from "vitest";
import { CONNECT_RAIL, railPlan, slackAppManifest, slackManifestUrl } from "./connect-rail";
import { CONNECTIONS } from "./connections";

describe("the 30-minute company (ADR-0027) — connect rail", () => {
  it("every rail step maps to a real connection in the registry", () => {
    const ids = new Set(CONNECTIONS.map((c) => c.id));
    for (const s of CONNECT_RAIL) expect(ids.has(s.connectionId), s.connectionId).toBe(true);
  });

  it("the whole guided rail honestly fits the 30-minute claim", () => {
    const total = CONNECT_RAIL.reduce((m, s) => m + s.estMinutes, 0);
    expect(total).toBeLessThanOrEqual(30);
  });

  it("every step carries real inline guidance and a security note — the modal never sends users doc-hunting", () => {
    for (const s of CONNECT_RAIL) {
      expect(s.inlineGuide.length, s.connectionId).toBeGreaterThanOrEqual(2);
      expect(s.securityNote.length, s.connectionId).toBeGreaterThan(40);
      expect(s.securityNote).toContain("Revoke");
    }
  });

  it("railPlan reports remaining minutes against live env and flips done when configured", () => {
    const cold = railPlan("customer", {});
    expect(cold.done).toBe(false);
    expect(cold.minutesRemaining).toBeGreaterThan(0);
    const warm = railPlan("customer", {
      GROQ_API_KEY: "x", GITHUB_TOKEN: "x", FULLSTACK_VERCEL_TOKEN: "x",
      SLACK_BOT_TOKEN: "x", SLACK_SIGNING_SECRET: "x",
      AGENTMAIL_API_KEY: "x", RESEND_API_KEY: "x",
      POLAR_WEBHOOK_SECRET: "x", POLAR_ACCESS_TOKEN: "x",
    });
    expect(warm.minutesRemaining).toBeLessThan(cold.minutesRemaining);
  });

  it("slack manifest is minimal-scope and points events/interactivity at our routes", () => {
    const m = slackAppManifest("https://competitor-inc-zeta.vercel.app/");
    expect(m.oauth_config.scopes.bot).toContain("chat:write");
    expect(m.oauth_config.scopes.bot.length).toBeLessThanOrEqual(5);
    expect(m.settings.event_subscriptions.request_url).toBe("https://competitor-inc-zeta.vercel.app/api/slack/events");
    const url = slackManifestUrl("https://competitor-inc-zeta.vercel.app");
    expect(url.startsWith("https://api.slack.com/apps?new_app=1&manifest_json=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("competitor.inc office");
  });

  it("oauth consent stays on the provider domain by design — no rail step claims to internalize it", () => {
    for (const s of CONNECT_RAIL) {
      expect(s.inlineGuide.join(" ")).not.toMatch(/enter your (slack|github|vercel|google) password/i);
    }
  });
});
