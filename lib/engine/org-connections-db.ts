import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptToken, decryptToken, vaultReady } from "./user-connections-db";

// CAMPUS-SCOPED credential vault (migration 0036). The org-scoped twin of user-connections-db.
//
// WHY A TWIN RATHER THAN A COPY: the crypto is IMPORTED, not reimplemented. AES-256-GCM under
// CONNECTIONS_SECRET already exists and is already tested; a second implementation would be a second thing
// to get wrong and a second thing to rotate. This file only changes WHO OWNS the token, from a user to a
// campus.
//
// THE POINT OF THE ORG SCOPE (see lib/core/campus.ts): a university admin authorises once, and every
// student inherits. Students never hold a vendor credential, never see a service-role key, and never
// accept a vendor's terms. That is how "the student connects nothing" is delivered without a machine ever
// performing one of the six hard-stops.
//
// CUSTODY IS UNCHANGED AND IT MATTERS: the token is the UNIVERSITY's, encrypted at rest under a key held
// only in env, revocable by them at any time. We are not a managed-credential provider. A leaked row is
// worthless without the env key.

export { vaultReady };

export type CampusRoleRow = "admin" | "faculty" | "student";

export interface OrgConnectionRow {
  provider: string;
  connectionId: string;
  meta: Record<string, string>;
}

/** Store a campus-level credential. Only ever called after an admin completed a real OAuth authorise. */
export async function saveOrgConnection(
  sb: SupabaseClient,
  row: { orgId: string; provider: string; connectionId: string; token: Record<string, unknown>; meta: Record<string, string>; authorisedBy: string },
): Promise<void> {
  const { error } = await sb.from("org_connections").upsert({
    org_id: row.orgId,
    provider: row.provider,
    connection_id: row.connectionId,
    enc: encryptToken(row.token),
    meta: row.meta,
    // WHO authorised is kept because binding an institution to a vendor's terms is an act with a name on
    // it. An audit that cannot say which human clicked Authorize is not an audit.
    authorised_by: row.authorisedBy,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Status only, never the token. Safe to render. */
export async function listOrgConnections(sb: SupabaseClient, orgId: string): Promise<OrgConnectionRow[]> {
  const { data, error } = await sb.from("org_connections").select("provider, connection_id, meta").eq("org_id", orgId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    provider: String(r.provider),
    connectionId: String(r.connection_id),
    meta: (r.meta ?? {}) as Record<string, string>,
  }));
}

/**
 * Read a campus token for server-side use. Service-role only by RLS: a student's session can never reach
 * this, which is the whole security property. A student inherits the CAPABILITY, never the credential.
 */
export async function readOrgToken(sb: SupabaseClient, orgId: string, provider: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await sb.from("org_connections").select("enc").eq("org_id", orgId).eq("provider", provider).maybeSingle();
  if (error || !data?.enc) return null;
  try {
    return decryptToken(String(data.enc));
  } catch {
    return null; // a token we cannot decrypt is a token we do not have. Fail closed, never guess.
  }
}

export async function deleteOrgConnection(sb: SupabaseClient, orgId: string, provider: string): Promise<void> {
  const { error } = await sb.from("org_connections").delete().eq("org_id", orgId).eq("provider", provider);
  if (error) throw error;
}

/** The campus a user belongs to, with their role. Null when they are not a member of any. */
export async function memberOrg(sb: SupabaseClient, userId: string): Promise<{ orgId: string; role: CampusRoleRow } | null> {
  const { data, error } = await sb.from("org_members").select("org_id, role").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return { orgId: String(data.org_id), role: String(data.role) as CampusRoleRow };
}

/** Seat usage, for the licence check in lib/core/campus.ts. */
export async function memberCount(sb: SupabaseClient, orgId: string): Promise<number> {
  const { count, error } = await sb.from("org_members").select("user_id", { count: "exact", head: true }).eq("org_id", orgId);
  if (error) return 0;
  return count ?? 0;
}
