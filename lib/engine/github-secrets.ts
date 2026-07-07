import "server-only";

// Set GitHub Actions secrets on a repo the engine just created — the LONG-TERM path so full-stack builds work
// on ANY account with no org (and, later, per-user BYOK: each user's keys → their repos). GitHub requires the
// value be encrypted with a libsodium SEALED BOX against the repo's Actions public key before upload.
// Docs: GET /repos/{o}/{r}/actions/secrets/public-key → encrypt → PUT /repos/{o}/{r}/actions/secrets/{NAME}.

import _sodium from "libsodium-wrappers";
import type { FetchLike } from "./aider-build";

// Encrypt a secret value for GitHub Actions (crypto_box_seal against the repo's base64 public key).
export async function encryptSecret(publicKeyB64: string, value: string): Promise<string> {
  await _sodium.ready;
  const sodium = _sodium;
  const pk = sodium.from_base64(publicKeyB64, sodium.base64_variants.ORIGINAL);
  const sealed = sodium.crypto_box_seal(sodium.from_string(value), pk);
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);
}

// GET the repo's Actions public key → encrypt the value → PUT the secret. Returns true on success. Injectable
// fetch so the sequence is unit-testable. Never throws (a failure just means the Action will surface the
// missing secret honestly).
export async function setRepoSecret(
  fetchImpl: FetchLike,
  token: string,
  fullName: string,
  name: string,
  value: string,
): Promise<boolean> {
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  };
  try {
    const pkRes = await fetchImpl(`https://api.github.com/repos/${fullName}/actions/secrets/public-key`, { headers });
    if (!pkRes.ok) return false;
    const pk = (await pkRes.json().catch(() => ({}))) as { key?: string; key_id?: string };
    if (!pk.key || !pk.key_id) return false;
    const encrypted_value = await encryptSecret(pk.key, value);
    const put = await fetchImpl(`https://api.github.com/repos/${fullName}/actions/secrets/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ encrypted_value, key_id: pk.key_id }),
    });
    return put.ok;
  } catch {
    return false;
  }
}
