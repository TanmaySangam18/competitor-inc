import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken, vaultReady } from "./user-connections-db";

const env = { CONNECTIONS_SECRET: "a-strong-enough-test-secret" };

describe("token vault — encrypted BYOK custody", () => {
  it("refuses to arm on absent or weak secrets", () => {
    expect(vaultReady({})).toBe(false);
    expect(vaultReady({ CONNECTIONS_SECRET: "short" })).toBe(false);
    expect(vaultReady(env)).toBe(true);
    expect(() => encryptToken({ a: 1 }, {})).toThrow(/not armed/);
  });

  it("round-trips a token payload and produces non-deterministic ciphertext (fresh IV)", () => {
    const payload = { access_token: "xoxb-secret", scope: "chat:write" };
    const e1 = encryptToken(payload, env);
    const e2 = encryptToken(payload, env);
    expect(e1).not.toEqual(e2);
    expect(decryptToken(e1, env)).toEqual(payload);
    expect(e1).not.toContain("xoxb"); // ciphertext leaks nothing
  });

  it("tampered ciphertext fails closed (GCM auth)", () => {
    const e = encryptToken({ t: "x" }, env);
    const bad = Buffer.from(e, "base64");
    bad[bad.length - 1] ^= 0xff;
    expect(() => decryptToken(bad.toString("base64"), env)).toThrow();
  });
});
