import { describe, it, expect, beforeAll } from "vitest";
import _sodium from "libsodium-wrappers";
import { encryptSecret, setRepoSecret } from "./github-secrets";
import type { FetchLike } from "./aider-build";

let pkB64 = "";
beforeAll(async () => {
  await _sodium.ready;
  pkB64 = _sodium.to_base64(_sodium.crypto_box_keypair().publicKey, _sodium.base64_variants.ORIGINAL);
});

describe("github-secrets — sealed-box encryption + repo secret upload", () => {
  it("encryptSecret returns non-empty base64 that isn't the plaintext", async () => {
    const enc = await encryptSecret(pkB64, "super-secret-value");
    expect(enc.length).toBeGreaterThan(0);
    expect(enc).not.toContain("super-secret-value");
  });

  it("setRepoSecret does public-key GET → encrypted PUT and returns true", async () => {
    const calls: string[] = [];
    let putBody: string | undefined;
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/actions/secrets/public-key")) return { ok: true, status: 200, json: async () => ({ key: pkB64, key_id: "kid1" }) };
      putBody = init?.body;
      return { ok: true, status: 201, json: async () => ({}) };
    };
    const ok = await setRepoSecret(fetchImpl, "t", "octo/app", "LLM_API_KEY", "val");
    expect(ok).toBe(true);
    expect(calls.some((c) => c.includes("public-key"))).toBe(true);
    expect(calls.some((c) => c.startsWith("PUT") && c.includes("/actions/secrets/LLM_API_KEY"))).toBe(true);
    // the PUT carries an encrypted_value + key_id, never the raw secret
    expect(putBody).toBeTruthy();
    const body = JSON.parse(putBody!);
    expect(body.key_id).toBe("kid1");
    expect(typeof body.encrypted_value).toBe("string");
    expect(body.encrypted_value).not.toContain("val");
  });

  it("returns false (never throws) when the public key can't be fetched", async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 404, json: async () => ({}) });
    expect(await setRepoSecret(fetchImpl, "t", "octo/app", "X", "v")).toBe(false);
  });
});
