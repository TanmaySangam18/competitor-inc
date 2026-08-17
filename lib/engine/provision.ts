import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "./net";
import { readOrgToken } from "./org-connections-db";
import { provisionPlan, seatCheck, type Campus, type ProvisionItem } from "@/lib/core/campus";

// PROVISIONING — create a student's resources inside the UNIVERSITY's accounts, using tokens the campus
// admin already authorised. This is what makes "the student connects nothing" true.
//
// EVERY CALL HERE IS AN API CALL WITH A DELEGATED TOKEN. Not one of them creates an account, accepts terms,
// authenticates as a human, solves a CAPTCHA, grants consent or pays. That distinction is the entire
// design: the six hard-stops were performed once, by the right human, before any of this runs. Using a
// credential a human deliberately delegated is ordinary software; minting one is not.
//
// FAIL-CLOSED AND HONEST, like every executor in this codebase. No token means `skipped` with a reason, not
// a silent partial success and not a pretend one. A student who is told their repo exists must have a repo.
//
// The schema-per-student choice (rather than a project per student) is deliberate: it provisions in
// milliseconds, costs the university nothing extra, reuses the RLS-per-tenant pattern this codebase already
// runs on, and never blocks a student behind a paid plan. A student who wants to own their product outright
// graduates to their own project later, which is why `graduateStudent` is a stub with a plan rather than a
// missing idea.

const TIMEOUT_MS = 12_000;

export type ProvisionStatus = "created" | "existed" | "skipped" | "failed";

export interface ProvisionResult {
  kind: ProvisionItem["kind"];
  status: ProvisionStatus;
  /** External identity of the thing: repo full name, project id, schema name. */
  ref?: string;
  /** Always populated for skipped and failed, so nothing is ever mysteriously absent. */
  reason?: string;
}

export interface ProvisionReport {
  orgId: string;
  userId: string;
  results: ProvisionResult[];
  /** True only when every planned item is created or already existed. */
  ready: boolean;
  /** Milliseconds from call to finish. Step 3's promise is a measured number, not an estimate. */
  elapsedMs: number;
  line: string;
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "student";

/** A stable, collision-resistant name for a student's resources. */
export function studentSlug(userId: string, handle?: string): string {
  return `${slug(handle || "student")}-${userId.replace(/-/g, "").slice(0, 8)}`;
}

// ── GitHub: a repo inside the university's org ───────────────────────────────

async function provisionRepo(token: string, org: string | undefined, name: string): Promise<ProvisionResult> {
  // Org repo when the campus named an org, else the token owner's account. A university will always have
  // an org; the fallback exists so a pilot can run before the org is created.
  const url = org ? `https://api.github.com/orgs/${encodeURIComponent(org)}/repos` : "https://api.github.com/user/repos";
  try {
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ name, private: true, auto_init: true, description: "Built with competitor.inc" }),
    }, TIMEOUT_MS);
    if (res.status === 422) {
      // GitHub's 422 on a name clash means it is already there, which is success for our purposes.
      return { kind: "repo", status: "existed", ref: org ? `${org}/${name}` : name };
    }
    if (!res.ok) return { kind: "repo", status: "failed", reason: `github ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { full_name?: string };
    return { kind: "repo", status: "created", ref: data.full_name ?? name };
  } catch (e) {
    return { kind: "repo", status: "failed", reason: e instanceof Error ? e.message : "unknown" };
  }
}

// ── Vercel: a project in the university's team ───────────────────────────────

async function provisionHosting(token: string, teamId: string | undefined, name: string): Promise<ProvisionResult> {
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  try {
    const res = await fetchWithTimeout(`https://api.vercel.com/v11/projects${qs}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ name, framework: "nextjs" }),
    }, TIMEOUT_MS);
    if (res.status === 409) return { kind: "hosting-project", status: "existed", ref: name };
    if (!res.ok) return { kind: "hosting-project", status: "failed", reason: `vercel ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { id?: string; name?: string };
    return { kind: "hosting-project", status: "created", ref: data.id ?? data.name ?? name };
  } catch (e) {
    return { kind: "hosting-project", status: "failed", reason: e instanceof Error ? e.message : "unknown" };
  }
}

// ── Supabase: a schema inside the campus project ─────────────────────────────

/**
 * The SQL that isolates one student. Exported and pure so it is reviewable and testable without a database,
 * which matters because this is the statement that enforces one student cannot read another's rows.
 *
 * `schema` is validated by the caller against a strict pattern before it reaches here. It is interpolated
 * rather than bound because PostgreSQL does not accept a bind parameter for an identifier, so the
 * validation is the defence and it must stay strict.
 */
export function studentSchemaSql(schema: string): string {
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(schema)) throw new Error(`unsafe schema name: ${schema}`);
  return [
    `create schema if not exists "${schema}";`,
    `revoke all on schema "${schema}" from public;`,
    `grant usage on schema "${schema}" to authenticated;`,
    `alter default privileges in schema "${schema}" grant select, insert, update, delete on tables to authenticated;`,
  ].join("\n");
}

async function provisionSchema(sb: SupabaseClient, schema: string): Promise<ProvisionResult> {
  try {
    const sql = studentSchemaSql(schema);
    // `exec_sql` is the project's existing migration-runner RPC. Absent it, we report skipped rather than
    // claiming a schema exists, because a product told it can persist and then cannot is worse than one
    // told it cannot yet.
    const { error } = await sb.rpc("exec_sql", { sql });
    if (error) return { kind: "db-schema", status: "skipped", reason: `schema runner unavailable: ${error.message}` };
    return { kind: "db-schema", status: "created", ref: schema };
  } catch (e) {
    return { kind: "db-schema", status: "failed", reason: e instanceof Error ? e.message : "unknown" };
  }
}

// ── the whole thing ─────────────────────────────────────────────────────────

export interface ProvisionInput {
  campus: Campus;
  userId: string;
  /** Non-secret display handle, used only to make resource names readable. */
  handle?: string;
  currentMembers: number;
  /** Campus-level GitHub org and Vercel team, from the connection meta. */
  githubOrg?: string;
  vercelTeamId?: string;
  now?: () => number;
}

/**
 * Provision everything a student needs, then record it. The student performed zero acts to reach here:
 * they signed in, and the campus admin's earlier authorise clicks did the rest.
 *
 * The elapsed time is returned because step 3 of the goal is "under 3 minutes" and that has to be measured
 * rather than asserted. This is the number to publish.
 */
export async function provisionStudent(sb: SupabaseClient, input: ProvisionInput): Promise<ProvisionReport> {
  const clock = input.now ?? (() => Date.now());
  const started = clock();
  const { campus, userId } = input;
  const results: ProvisionResult[] = [];

  const seats = seatCheck(campus, input.currentMembers);
  if (!seats.allowed) {
    return {
      orgId: campus.id, userId, results, ready: false, elapsedMs: clock() - started,
      line: `Not provisioned: ${seats.reason}`,
    };
  }

  const name = studentSlug(userId, input.handle);

  for (const item of provisionPlan(campus)) {
    if (item.kind === "repo") {
      const tok = await readOrgToken(sb, campus.id, "github");
      const access = typeof tok?.access_token === "string" ? tok.access_token : null;
      results.push(access
        ? await provisionRepo(access, input.githubOrg, name)
        : { kind: "repo", status: "skipped", reason: "the campus has not authorised GitHub yet" });
      continue;
    }
    if (item.kind === "hosting-project") {
      const tok = await readOrgToken(sb, campus.id, "hosting");
      const access = typeof tok?.access_token === "string" ? tok.access_token : null;
      results.push(access
        ? await provisionHosting(access, input.vercelTeamId, name)
        : { kind: "hosting-project", status: "skipped", reason: "the campus has not authorised hosting yet" });
      continue;
    }
    results.push(await provisionSchema(sb, `s_${name.replace(/-/g, "_")}`));
  }

  // Record what we made in someone else's account. De-provisioning a student later is only possible if we
  // wrote down what exists, and "what did you create in our org" is a question a university WILL ask.
  for (const r of results) {
    if (r.status !== "created" && r.status !== "existed") continue;
    await sb.from("org_provisioned").insert({
      org_id: campus.id, user_id: userId, kind: r.kind, external_ref: r.ref ?? name,
    }).then(() => undefined, () => undefined); // best effort: a bookkeeping failure must not fail the student
  }

  const bad = results.filter((r) => r.status === "failed" || r.status === "skipped");
  return {
    orgId: campus.id,
    userId,
    results,
    ready: results.length > 0 && bad.length === 0,
    elapsedMs: clock() - started,
    line: bad.length === 0
      ? `Ready. ${results.length} ${results.length === 1 ? "resource" : "resources"} in ${campus.name}'s own accounts, and the student did nothing.`
      : `Partly ready. ${bad.map((r) => `${r.kind}: ${r.reason ?? r.status}`).join("; ")}`,
  };
}

/**
 * GRADUATION: move a student's schema into a project they own outright.
 *
 * Deliberately not implemented yet, and deliberately not silent about it. It is needed the first time a
 * student asks to keep their product after leaving, which has not happened because there are no students.
 * What mattered now was choosing a schema layout that makes the move possible later, and that choice is
 * made. Building the migration before anyone needs it would be speculation dressed as progress.
 */
export function graduateStudent(): { supported: false; reason: string } {
  return {
    supported: false,
    reason: "Graduation is designed but not built. A student's product lives in its own schema precisely so it can be moved to a project they own, and that migration gets written the first time a real student asks.",
  };
}
