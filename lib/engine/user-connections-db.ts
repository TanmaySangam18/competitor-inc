import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Per-user OAuth token vault (migration 0033, ADR-0010). BYOK custody: tokens encrypted at rest with
// AES-256-GCM under CONNECTIONS_SECRET (env-only key — a leaked DB row alone reveals nothing), NON-secret
// display meta kept separate, owner can read status + revoke; only the service role writes.

function key(env: Record<string, string | undefined> = process.env): Buffer | null {
  const s = env.CONNECTIONS_SECRET;
  if (!s || s.length < 16) return null; // refuse weak/absent keys — never store weakly-encrypted tokens
  return createHash("sha256").update(s).digest();
}

export function vaultReady(env: Record<string, string | undefined> = process.env): boolean {
  return key(env) !== null;
}

export function encryptToken(payload: Record<string, unknown>, env: Record<string, string | undefined> = process.env): string {
  const k = key(env);
  if (!k) throw new Error("CONNECTIONS_SECRET missing — the vault is not armed");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptToken(enc: string, env: Record<string, string | undefined> = process.env): Record<string, unknown> {
  const k = key(env);
  if (!k) throw new Error("CONNECTIONS_SECRET missing — the vault is not armed");
  const raw = Buffer.from(enc, "base64");
  const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), ct = raw.subarray(28);
  const d = createDecipheriv("aes-256-gcm", k, iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString("utf8")) as Record<string, unknown>;
}

export async function saveUserConnection(
  sb: SupabaseClient,
  row: { userId: string; provider: string; connectionId: string; token: Record<string, unknown>; meta: Record<string, string> },
): Promise<void> {
  const { error } = await sb.from("user_connections").upsert({
    user_id: row.userId,
    provider: row.provider,
    connection_id: row.connectionId,
    enc: encryptToken(row.token),
    meta: row.meta,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function listUserConnections(sb: SupabaseClient, userId: string): Promise<Array<{ provider: string; connectionId: string; meta: Record<string, string> }>> {
  const { data, error } = await sb.from("user_connections").select("provider, connection_id, meta").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({ provider: String(r.provider), connectionId: String(r.connection_id), meta: (r.meta ?? {}) as Record<string, string> }));
}

export async function deleteUserConnection(sb: SupabaseClient, userId: string, provider: string): Promise<void> {
  const { error } = await sb.from("user_connections").delete().eq("user_id", userId).eq("provider", provider);
  if (error) throw error;
}
