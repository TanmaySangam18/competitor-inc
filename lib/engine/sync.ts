"use client";

// Supabase persistence sync for the interactive app — GATED + best-effort.
//
// Status: built but NOT yet verified against a live database (no Supabase project was connected
// when this was written). It activates ONLY when Supabase is configured AND the user is signed in
// (non-guest); otherwise the app stays 100% on the localStorage store in useEngine, unchanged. All
// DB calls are best-effort: any failure is swallowed and localStorage remains the source of truth,
// matching the app's degrade-gracefully philosophy. Operate (Rocks/Issues) has no table yet, so it
// stays local even in DB mode.
//
// Design: a single centralized seam instead of instrumenting every mutator. We keep a snapshot of
// what we believe is in the DB and, whenever the store changes, diff it and push only the delta
// (create/update companies, append activities/approvals, flip undone/resolved). Ids are
// client-authoritative (see db.ts), so client and DB ids match and the diff can target rows by id.

import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ApprovalItem, Company, OperateData } from "./types";
import type { GrowthExperiment } from "./growth";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  fetchUserCompanies,
  fetchCompanyState,
  fetchOperate,
  fetchExperiments,
  createCompany,
  updateCompany,
  deleteCompany,
  insertActivities,
  insertApprovals,
  insertExperiments,
  closeExperiment,
  setApprovalResolved,
  setActivityUndone,
  upsertRocks,
  upsertIssues,
  deleteRocks,
  deleteIssues,
} from "./db";

// The slice of the store we persist.
export interface SyncState {
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
  operate: Record<string, OperateData>;
  experiments: Record<string, GrowthExperiment[]>;
}

export interface SyncOps {
  createCompanies: Company[];
  updateCompanies: Company[];
  deleteCompanies: string[]; // company ids removed locally → delete from the DB (children cascade)
  insertActivities: { companyId: string; items: Activity[] }[];
  undoActivities: string[];
  insertApprovals: { companyId: string; items: ApprovalItem[] }[];
  resolveApprovals: { id: string; resolved: "approved" | "rejected" }[];
  // experiments (Revenue Loop): append proposals + a one-shot close flip (like approvals.resolved)
  insertExperiments: { companyId: string; items: GrowthExperiment[] }[];
  closeExperiments: GrowthExperiment[];
  // operate is tiny → upsert the whole list on change + delete removed ids
  upsertRocks: { companyId: string; rocks: OperateData["rocks"] }[];
  deleteRockIds: string[];
  upsertIssues: { companyId: string; issues: OperateData["issues"] }[];
  deleteIssueIds: string[];
}

const EMPTY_STATE: SyncState = { companies: [], activities: {}, approvals: {}, operate: {}, experiments: {} };
const EMPTY_OPERATE: OperateData = { rocks: [], issues: [] };

// Tracked company fields — a change in any of these triggers an UPDATE. (slug/idea/createdAt are
// immutable after creation, so they're not compared.)
function companyChanged(a: Company, b: Company): boolean {
  return (
    a.status !== b.status ||
    a.night !== b.night ||
    a.name !== b.name ||
    JSON.stringify(a.ledger) !== JSON.stringify(b.ledger) ||
    JSON.stringify(a.validation ?? null) !== JSON.stringify(b.validation ?? null) ||
    JSON.stringify(a.product ?? null) !== JSON.stringify(b.product ?? null) ||
    JSON.stringify(a.growthGoal ?? null) !== JSON.stringify(b.growthGoal ?? null) ||
    (a.shareInPublic ?? false) !== (b.shareInPublic ?? false)
  );
}

// Pure delta between the last-synced snapshot and the current store. Unit-tested in sync.test.ts.
export function diffStore(prev: SyncState, next: SyncState): SyncOps {
  const prevCos = new Map(prev.companies.map((c) => [c.id, c]));
  const createCompanies: Company[] = [];
  const updateCompanies: Company[] = [];
  for (const c of next.companies) {
    const p = prevCos.get(c.id);
    if (!p) createCompanies.push(c);
    else if (companyChanged(p, c)) updateCompanies.push(c);
  }
  // Deletes: a company that was in the DB snapshot (prev) but is gone from the store (next) was deleted
  // by the user → remove it from the DB so it stays gone. Without this the row survives + re-hydrates.
  const nextIds = new Set(next.companies.map((c) => c.id));
  const deleteCompanies = prev.companies.filter((c) => !nextIds.has(c.id)).map((c) => c.id);

  const insertActs: SyncOps["insertActivities"] = [];
  const undoActivities: string[] = [];
  const insertApps: SyncOps["insertApprovals"] = [];
  const resolveApprovals: SyncOps["resolveApprovals"] = [];
  const insertExps: SyncOps["insertExperiments"] = [];
  const closeExps: SyncOps["closeExperiments"] = [];
  const upRocks: SyncOps["upsertRocks"] = [];
  const deleteRockIds: string[] = [];
  const upIssues: SyncOps["upsertIssues"] = [];
  const deleteIssueIds: string[] = [];

  for (const c of next.companies) {
    // activities (append-only + an undone flip)
    const prevActs = new Map((prev.activities[c.id] ?? []).map((a) => [a.id, a]));
    const nextActs = next.activities[c.id] ?? [];
    const newActs = nextActs.filter((a) => !prevActs.has(a.id));
    if (newActs.length) insertActs.push({ companyId: c.id, items: newActs });
    for (const a of nextActs) {
      const p = prevActs.get(a.id);
      if (p && !p.undone && a.undone) undoActivities.push(a.id);
    }

    // approvals (append + a resolved flip)
    const prevApps = new Map((prev.approvals[c.id] ?? []).map((a) => [a.id, a]));
    const nextApps = next.approvals[c.id] ?? [];
    const newApps = nextApps.filter((a) => !prevApps.has(a.id));
    if (newApps.length) insertApps.push({ companyId: c.id, items: newApps });
    for (const a of nextApps) {
      const p = prevApps.get(a.id);
      if (a.resolved && (!p || p.resolved !== a.resolved)) resolveApprovals.push({ id: a.id, resolved: a.resolved });
    }

    // growth experiments (append + a one-shot close flip)
    const prevExps = new Map((prev.experiments[c.id] ?? []).map((x) => [x.id, x]));
    const nextExps = next.experiments[c.id] ?? [];
    const newExps = nextExps.filter((x) => !prevExps.has(x.id));
    if (newExps.length) insertExps.push({ companyId: c.id, items: newExps });
    for (const x of nextExps) {
      const p = prevExps.get(x.id);
      if (x.status !== "running" && p && p.status === "running") closeExps.push(x);
    }

    // operate (Rocks/Issues): if a list changed, upsert it whole + delete any vanished ids
    const pOp = prev.operate[c.id] ?? EMPTY_OPERATE;
    const nOp = next.operate[c.id] ?? EMPTY_OPERATE;
    if (JSON.stringify(pOp.rocks) !== JSON.stringify(nOp.rocks)) {
      if (nOp.rocks.length) upRocks.push({ companyId: c.id, rocks: nOp.rocks });
      const keep = new Set(nOp.rocks.map((r) => r.id));
      for (const r of pOp.rocks) if (!keep.has(r.id)) deleteRockIds.push(r.id);
    }
    if (JSON.stringify(pOp.issues) !== JSON.stringify(nOp.issues)) {
      if (nOp.issues.length) upIssues.push({ companyId: c.id, issues: nOp.issues });
      const keep = new Set(nOp.issues.map((i) => i.id));
      for (const i of pOp.issues) if (!keep.has(i.id)) deleteIssueIds.push(i.id);
    }
  }

  return {
    createCompanies, updateCompanies, deleteCompanies, insertActivities: insertActs, undoActivities,
    insertApprovals: insertApps, resolveApprovals,
    insertExperiments: insertExps, closeExperiments: closeExps,
    upsertRocks: upRocks, deleteRockIds, upsertIssues: upIssues, deleteIssueIds,
  };
}

export function isEmptyOps(o: SyncOps): boolean {
  return (
    o.createCompanies.length === 0 &&
    o.updateCompanies.length === 0 &&
    o.deleteCompanies.length === 0 &&
    o.insertActivities.length === 0 &&
    o.undoActivities.length === 0 &&
    o.insertApprovals.length === 0 &&
    o.resolveApprovals.length === 0 &&
    o.insertExperiments.length === 0 &&
    o.closeExperiments.length === 0 &&
    o.upsertRocks.length === 0 &&
    o.deleteRockIds.length === 0 &&
    o.upsertIssues.length === 0 &&
    o.deleteIssueIds.length === 0
  );
}

// Load the user's full state from the DB. Throws on the top-level company fetch (caller handles);
// per-company state failures are isolated so one bad company can't blank the whole load.
export async function loadFromDb(sb: SupabaseClient, userId: string): Promise<SyncState> {
  const companies = await fetchUserCompanies(sb, userId);
  const activities: Record<string, Activity[]> = {};
  const approvals: Record<string, ApprovalItem[]> = {};
  const operate: Record<string, OperateData> = {};
  const experiments: Record<string, GrowthExperiment[]> = {};
  await Promise.all(
    companies.map(async (c) => {
      try {
        const st = await fetchCompanyState(sb, c.id);
        activities[c.id] = st.activities;
        approvals[c.id] = st.approvals;
      } catch {
        activities[c.id] = [];
        approvals[c.id] = [];
      }
      try {
        operate[c.id] = await fetchOperate(sb, c.id);
      } catch {
        operate[c.id] = { rocks: [], issues: [] };
      }
      try {
        experiments[c.id] = await fetchExperiments(sb, c.id);
      } catch {
        experiments[c.id] = []; // table may predate migration 0012 — stay local
      }
    })
  );
  // No real money moves in this build — normalize every drafted cost + ledger total to 0 so a legacy DB
  // row never surfaces a fabricated spend number (mirrors useEngine's zeroMoney on the localStorage path).
  for (const list of Object.values(activities)) for (const a of list) a.cost = 0;
  for (const c of companies) c.ledger = { ...c.ledger, spent: 0, credited: 0 };
  return { companies, activities, approvals, operate, experiments };
}

// Push a delta. Ordered so parents exist before children (companies → their activities/approvals).
// Every op is isolated: a single failure is logged and skipped, never thrown, so the UI is unaffected.
export async function applyOps(sb: SupabaseClient, userId: string, ops: SyncOps): Promise<void> {
  const guard = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.warn(`[sync] ${label} failed:`, e instanceof Error ? e.message : "unknown");
    }
  };
  for (const c of ops.createCompanies) await guard("createCompany", () => createCompany(sb, userId, c));
  for (const c of ops.updateCompanies) await guard("updateCompany", () => updateCompany(sb, c));
  for (const id of ops.deleteCompanies) await guard("deleteCompany", () => deleteCompany(sb, id));
  for (const g of ops.insertActivities) await guard("insertActivities", () => insertActivities(sb, g.companyId, g.items));
  for (const id of ops.undoActivities) await guard("setActivityUndone", () => setActivityUndone(sb, id));
  for (const g of ops.insertApprovals) await guard("insertApprovals", () => insertApprovals(sb, g.companyId, g.items));
  for (const r of ops.resolveApprovals) await guard("setApprovalResolved", () => setApprovalResolved(sb, r.id, r.resolved));
  for (const g of ops.insertExperiments) await guard("insertExperiments", () => insertExperiments(sb, g.companyId, g.items));
  for (const x of ops.closeExperiments) await guard("closeExperiment", () => closeExperiment(sb, x));
  for (const g of ops.upsertRocks) await guard("upsertRocks", () => upsertRocks(sb, g.companyId, g.rocks));
  if (ops.deleteRockIds.length) await guard("deleteRocks", () => deleteRocks(sb, ops.deleteRockIds));
  for (const g of ops.upsertIssues) await guard("upsertIssues", () => upsertIssues(sb, g.companyId, g.issues));
  if (ops.deleteIssueIds.length) await guard("deleteIssues", () => deleteIssues(sb, ops.deleteIssueIds));
}

export interface UseDbSyncParams {
  enabled: boolean; // isSupabaseConfigured() && authed && !guest
  hydrated: boolean; // the local store has finished its initial load
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
  operate: Record<string, OperateData>;
  experiments: Record<string, GrowthExperiment[]>;
  // Called once after a successful DB load that returns data — merges cloud state into the store.
  overlay: (s: SyncState) => void;
}

export function useDbSync({ enabled, hydrated, companies, activities, approvals, operate, experiments, overlay }: UseDbSyncParams): void {
  const syncedRef = useRef<SyncState | null>(null); // what we believe is in the DB
  const readyRef = useRef(false); // true after a successful initial load (gates write-through)
  const userIdRef = useRef<string | null>(null);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  // Hydrate from the DB once enabled. Best-effort: on any failure we stay on localStorage.
  useEffect(() => {
    if (!enabled) {
      readyRef.current = false;
      syncedRef.current = null;
      userIdRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const sb = getBrowserSupabase();
      if (!sb) return;
      try {
        const { data } = await sb.auth.getUser();
        const uid = data.user?.id;
        if (!uid || cancelled) return;
        userIdRef.current = uid;
        const dbState = await loadFromDb(sb, uid);
        if (cancelled) return;
        syncedRef.current = dbState;
        readyRef.current = true; // now safe to diff & push (incl. migrating any local-only companies up)
        if (dbState.companies.length) overlayRef.current(dbState);
      } catch (e) {
        console.warn("[sync] hydrate failed — staying local:", e instanceof Error ? e.message : "unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Write-through: whenever the store changes (and we've loaded), diff and push the delta.
  useEffect(() => {
    if (!enabled || !hydrated || !readyRef.current) return;
    const sb = getBrowserSupabase();
    const uid = userIdRef.current;
    if (!sb || !uid) return;
    const next: SyncState = { companies, activities, approvals, operate, experiments };
    const ops = diffStore(syncedRef.current ?? EMPTY_STATE, next);
    if (isEmptyOps(ops)) return;
    const prevSynced = syncedRef.current;
    syncedRef.current = next; // optimistic
    // A failed write must NOT be silent: roll back the optimistic "synced" marker so the next store change
    // re-diffs and RETRIES this delta (instead of the local store silently drifting ahead of the DB), and
    // log it so a persistent failure is diagnosable.
    applyOps(sb, uid, ops).catch((e) => {
      syncedRef.current = prevSynced;
      console.error("[sync] write-through failed — will retry on next change:", e instanceof Error ? e.message : "unknown");
    });
  }, [enabled, hydrated, companies, activities, approvals, operate, experiments]);
}
