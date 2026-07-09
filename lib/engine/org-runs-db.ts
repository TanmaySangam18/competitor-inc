import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgRun, RunStatus, RunTask } from "./org-run";

// Persistence for durable org runs (migration 0026). Writes use the service-role client (the cron step
// executor + the enqueue route); reads are also possible via the owner's session (RLS: owner-read). Every
// call throws on a hard error so the caller can decide (the cron wraps each in try/catch); a missing table
// (migration not applied yet) surfaces as an error the cron logs + skips — fail-soft at the call site.

interface OrgRunRow {
  id: string;
  company_id: string | null;
  user_id: string;
  goal: string;
  status: string;
  tasks: unknown;
  created_at: string;
  updated_at: string;
}

function toRun(r: OrgRunRow): OrgRun {
  return {
    id: r.id,
    goal: r.goal,
    status: (r.status as RunStatus) ?? "pending",
    tasks: Array.isArray(r.tasks) ? (r.tasks as RunTask[]) : [],
    createdAt: Date.parse(r.created_at) || 0,
    updatedAt: Date.parse(r.updated_at) || 0,
  };
}

export async function insertOrgRun(sb: SupabaseClient, userId: string, companyId: string | null, run: OrgRun): Promise<void> {
  const { error } = await sb.from("org_runs").insert({
    id: run.id, user_id: userId, company_id: companyId, goal: run.goal, status: run.status, tasks: run.tasks,
  });
  if (error) throw error;
}

export async function saveOrgRun(sb: SupabaseClient, run: OrgRun): Promise<void> {
  const { error } = await sb
    .from("org_runs")
    .update({ status: run.status, tasks: run.tasks, updated_at: new Date().toISOString() })
    .eq("id", run.id);
  if (error) throw error;
}

// Runs the cron should advance: not yet terminal, oldest-touched first (fair scheduling across runs).
export async function loadActiveOrgRuns(sb: SupabaseClient, limit = 10): Promise<Array<{ run: OrgRun; companyId: string | null }>> {
  const { data, error } = await sb
    .from("org_runs")
    .select("*")
    .in("status", ["pending", "running"])
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({ run: toRun(r as OrgRunRow), companyId: (r as OrgRunRow).company_id }));
}

export async function loadOrgRun(sb: SupabaseClient, id: string): Promise<{ run: OrgRun; companyId: string | null } | null> {
  const { data } = await sb.from("org_runs").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return { run: toRun(data as OrgRunRow), companyId: (data as OrgRunRow).company_id };
}
