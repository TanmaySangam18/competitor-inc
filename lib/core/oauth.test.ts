import { describe, it, expect, vi } from "vitest";
import { OAUTH_PROVIDERS, getProvider, providerArmed, oauthProviderFor, signState, verifyState, authorizeUrl, exchangeCode } from "./oauth";

const SECRET = "test-secret-of-decent-length";
const armed = { OAUTH_GITHUB_CLIENT_ID: "id", OAUTH_GITHUB_CLIENT_SECRET: "sec" };
const gh = getProvider("github")!;

describe("OAuth engine — the 2-minute connect with BYOK custody", () => {
  it("registry entries are complete and armed only by real env", () => {
    for (const p of OAUTH_PROVIDERS) {
      expect(p.id && p.connectionId && p.authorizeUrl && p.tokenUrl && p.clientIdEnv && p.clientSecretEnv).toBeTruthy();
      expect(providerArmed(p, {})).toBe(false);
    }
    expect(providerArmed(gh, armed)).toBe(true);
    expect(oauthProviderFor("github", armed)?.id).toBe("github");
    expect(oauthProviderFor("github", {})).toBeNull(); // unarmed → no button, no lies
  });

  it("state round-trips, is user-bound, and rejects tampering + staleness", () => {
    const s = signState({ provider: "github", userId: "u1" }, SECRET);
    expect(verifyState(s, SECRET)).toEqual({ provider: "github", userId: "u1" });
    expect(verifyState(s + "x", SECRET)).toBeNull();
    expect(verifyState(s, "other-secret-of-decent-len")).toBeNull();
    const old = signState({ provider: "github", userId: "u1" }, SECRET, Date.now() - 11 * 60 * 1000);
    expect(verifyState(old, SECRET)).toBeNull(); // 10-minute box
  });

  it("authorize URL carries client id, redirect, state, scopes", () => {
    const u = new URL(authorizeUrl(gh, "STATE", "https://x.example/cb", armed));
    expect(u.origin + u.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(u.searchParams.get("client_id")).toBe("id");
    expect(u.searchParams.get("state")).toBe("STATE");
    expect(u.searchParams.get("redirect_uri")).toBe("https://x.example/cb");
    expect(u.searchParams.get("scope")).toContain("repo");
  });

  it("exchangeCode: github happy path + slack error surfaced honestly", async () => {
    const ghFetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ access_token: "tok123" }) })) as unknown as typeof fetch;
    const r = await exchangeCode(gh, "code", "https://x.example/cb", { fetchImpl: ghFetch, env: armed });
    expect(r).toMatchObject({ ok: true, accessToken: "tok123" });

    const slack = getProvider("slack")!;
    const slackEnv = { OAUTH_SLACK_CLIENT_ID: "id", OAUTH_SLACK_CLIENT_SECRET: "sec" };
    const slackFetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: "invalid_code" }) })) as unknown as typeof fetch;
    const s = await exchangeCode(slack, "code", "https://x.example/cb", { fetchImpl: slackFetch, env: slackEnv });
    expect(s).toMatchObject({ ok: false, error: "Slack: invalid_code" });
  });
});
