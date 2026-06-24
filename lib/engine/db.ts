// Data-access layer for competitor.inc persistence on Supabase.
// Maps DB rows <-> domain types. Used once a user is authenticated; until Supabase is
// provisioned (see docs/SUPABASE-SETUP.md) the app falls back to the local store in useEngine.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ApprovalItem, Company, Issue, Ledger, OperateData, Proof, Rock, ValidationResult } from "./types";

/* ── row shapes ─────────────────────────────────────────────── */
interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  idea: string;
  status: Company["status"];
  night: number;
  ledger: Ledger;
  validation: ValidationResult | null;
  created_at: string;
}
interface ActivityRow {
  id: string;
  company_id: string;
  night: number;
  agent: Activity["agent"];
  action: string;
  meta: string | null;
  cost: number;
  status: Activity["status"];
  proof: Proof | null;
  undone: boolean;
}
interface ApprovalRow {
  id: string;
  company_id: string;
  night: number;
  agent: ApprovalItem["agent"];
  kind: ApprovalItem["kind"];
  title: string;
  detail: string | null;
  amount: number | null;
  resolved: "approved" | "rejected" | null;
}

/* ── mappers ────────────────────────────────────────────────── */
export function toCompany(r: CompanyRow): Company {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    idea: r.idea,
    createdAt: new Date(r.created_at).getTime(),
    status: r.status,
    night: r.night,
    ledger: r.ledger,
    validation: r.validation ?? undefined,
  };
}
function toActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    night: r.night,
    agent: r.agent,
    action: r.action,
    meta: r.meta ?? undefined,
    cost: Number(r.cost),
    status: r.status,
    proof: r.proof ?? undefined,
    undone: r.undone,
  };
}
function toApproval(r: ApprovalRow): ApprovalItem {
  return {
    id: r.id,
    night: r.night,
    agent: r.agent,
    kind: r.kind,
    title: r.title,
    detail: r.detail ?? "",
    amount: r.amount ?? undefined,
    resolved: r.resolved ?? undefined,
  };
}

/* ── reads ──────────────────────────────────────────────────── */
export async function fetchUserCompanies(sb: SupabaseClient, userId: string): Promise<Company[]> {
  const { data, error } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as CompanyRow[]) ?? []).map(toCompany);
}

export async function fetchCompanyState(sb: SupabaseClient, companyId: string) {
  const [c, a, ap] = await Promise.all([
    sb.from("companies").select("*").eq("id", companyId).single(),
    sb.from("activities").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    sb.from("approvals").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
  ]);
  if (c.error) throw c.error;
  return {
    company: toCompany(c.data as CompanyRow),
    activities: ((a.data as ActivityRow[]) ?? []).map(toActivity),
    approvals: ((ap.data as ApprovalRow[]) ?? []).map(toApproval),
  };
}

/* ── writes ─────────────────────────────────────────────────── */
export async function createCompany(sb: SupabaseClient, userId: string, c: Company): Promise<Company> {
  const { data, error } = await sb
    .from("companies")
    .insert({
      // Client-authoritative id: the offline store generates the UUID, so we persist the SAME id
      // (the column default only applies when omitted). Keeps client and DB ids identical, which the
      // sync layer relies on to diff and to target child activities/approvals + undo/resolve by id.
      id: c.id,
      user_id: userId,
      name: c.name,
      slug: c.slug,
      idea: c.idea,
      status: c.status,
      night: c.night,
      ledger: c.ledger,
      validation: c.validation ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toCompany(data as CompanyRow);
}

export async function updateCompany(sb: SupabaseClient, c: Company): Promise<void> {
  const { error } = await sb
    .from("companies")
    .update({ name: c.name, status: c.status, night: c.night, ledger: c.ledger, validation: c.validation ?? null })
    .eq("id", c.id);
  if (error) throw error;
}

export async function insertActivities(sb: SupabaseClient, companyId: string, items: Activity[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await sb.from("activities").insert(
    items.map((a) => ({
      id: a.id, // client-authoritative (see createCompany) — lets setActivityUndone target by id
      company_id: companyId,
      night: a.night,
      agent: a.agent,
      action: a.action,
      meta: a.meta ?? null,
      cost: a.cost,
      status: a.status,
      proof: a.proof ?? null,
      undone: a.undone ?? false,
    }))
  );
  if (error) throw error;
}

export async function insertApprovals(sb: SupabaseClient, companyId: string, items: ApprovalItem[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await sb.from("approvals").insert(
    items.map((p) => ({
      id: p.id, // client-authoritative (see createCompany) — lets setApprovalResolved target by id
      company_id: companyId,
      night: p.night,
      agent: p.agent,
      kind: p.kind,
      title: p.title,
      detail: p.detail ?? null,
      amount: p.amount ?? null,
    }))
  );
  if (error) throw error;
}

export async function setApprovalResolved(sb: SupabaseClient, id: string, resolved: "approved" | "rejected"): Promise<void> {
  const { error } = await sb.from("approvals").update({ resolved }).eq("id", id);
  if (error) throw error;
}

export async function setActivityUndone(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("activities").update({ undone: true }).eq("id", id);
  if (error) throw error;
}

/* ── operate (Rocks + Issues) ───────────────────────────────── */
// Tiny per-company lists, so the sync layer upserts the whole list on change + deletes any removed
// ids — simpler and more robust than fine-grained diffing. Ids are client-authoritative.
interface RockRow { id: string; title: string; done: boolean }
interface IssueRow { id: string; title: string; resolved: boolean }

export async function fetchOperate(sb: SupabaseClient, companyId: string): Promise<OperateData> {
  const [r, i] = await Promise.all([
    sb.from("rocks").select("*").eq("company_id", companyId).order("created_at", { ascending: true }),
    sb.from("issues").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
  ]);
  if (r.error) throw r.error;
  if (i.error) throw i.error;
  return {
    rocks: ((r.data as RockRow[]) ?? []).map((x) => ({ id: x.id, title: x.title, done: x.done })),
    issues: ((i.data as IssueRow[]) ?? []).map((x) => ({ id: x.id, title: x.title, resolved: x.resolved })),
  };
}

export async function upsertRocks(sb: SupabaseClient, companyId: string, rocks: Rock[]): Promise<void> {
  if (rocks.length === 0) return;
  const { error } = await sb.from("rocks").upsert(rocks.map((r) => ({ id: r.id, company_id: companyId, title: r.title, done: r.done })));
  if (error) throw error;
}

export async function upsertIssues(sb: SupabaseClient, companyId: string, issues: Issue[]): Promise<void> {
  if (issues.length === 0) return;
  const { error } = await sb.from("issues").upsert(issues.map((i) => ({ id: i.id, company_id: companyId, title: i.title, resolved: i.resolved })));
  if (error) throw error;
}

export async function deleteRocks(sb: SupabaseClient, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await sb.from("rocks").delete().in("id", ids);
  if (error) throw error;
}

export async function deleteIssues(sb: SupabaseClient, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await sb.from("issues").delete().in("id", ids);
  if (error) throw error;
}
