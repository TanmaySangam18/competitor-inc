"use client";

// Server-authoritative sync (flag: SERVER_AUTHORITATIVE). For signed-in users, Supabase is the source of
// truth: reads load from the DB, writes are AWAITED with rollback + surfaced errors, and a one-time no-loss
// upload migrates any local-only companies up before the DB is trusted. This module imports one-directionally
// from ./sync (reusing its tested diff/apply/merge machinery) to avoid a circular import.

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ApprovalItem, Company, OperateData } from "./types";
import type { GrowthExperiment } from "./growth";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  type SyncState,
  EMPTY_STATE,
  diffStore,
  applyOps,
  loadFromDb,
  isEmptyOps,
  mergeSyncState,
} from "./sync";

// ── Pure helpers (node-testable) ──────────────────────────────────────────────────────────────────

// The one-time migration trigger: the DB has no companies for this user but the local device does. When
// true we UPLOAD local → DB before treating the DB as truth, so an existing local-only user (or a guest who
// just signed up) never loses their companies. Deliberately conservative: only fires on a genuinely empty DB.
export function shouldUploadMigrate(cloud: SyncState, local: SyncState): boolean {
  return cloud.companies.length === 0 && local.companies.length > 0;
}

// Push the entire local state into an empty DB by diffing against EMPTY_STATE (→ every company is a create +
// its children are inserts) and reusing the tested applyOps writers. Never deletes local; caller only calls
// this when shouldUploadMigrate is true.
export async function uploadLocalToDb(sb: SupabaseClient, userId: string, local: SyncState): Promise<void> {
  await applyOps(sb, userId, diffStore(EMPTY_STATE, local));
}

// Reconcile an incoming (cloud / realtime / cron) snapshot into the current state without data loss — a thin,
// intentional wrapper over the property-tested mergeSyncState (union-by-id, higher-night wins, tombstones).
export function reconcileRealtime(current: SyncState, incoming: SyncState, deletedIds: string[] = []): SyncState {
  return mergeSyncState(current, incoming, deletedIds);
}

// Optimistic-apply → await persist → rollback on failure. Pure w.r.t. an injected `apply` (setState) so the
// rollback contract is unit-testable: on success only the optimistic value is applied; on failure the exact
// pre-mutation snapshot is re-applied and the error is returned.
export async function applyOptimisticThenPersist<S>(
  current: S,
  optimistic: (s: S) => S,
  persist: () => Promise<void>,
  apply: (s: S) => void,
): Promise<{ ok: boolean; error?: unknown }> {
  const snapshot = current;
  apply(optimistic(current));
  try {
    await persist();
    return { ok: true };
  } catch (error) {
    apply(snapshot); // rollback to the exact pre-mutation state
    return { ok: false, error };
  }
}

// One-time upload marker, per user, so a later legitimately-empty DB (e.g. the user deleted everything) does
// NOT re-upload tombstoned data.
const MIGRATED_PREFIX = "cofounder:migrated:";
export function isMigrated(uid: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MIGRATED_PREFIX + uid) === "1";
  } catch {
    return false;
  }
}
export function markMigrated(uid: string): void {
  try {
    window.localStorage.setItem(MIGRATED_PREFIX + uid, "1");
  } catch {
    /* ignore */
  }
}

// ── The hook ──────────────────────────────────────────────────────────────────────────────────────

export interface UseAuthoritativeSyncParams {
  enabled: boolean; // SERVER_AUTHORITATIVE && Supabase configured && authed && !guest
  hydrated: boolean; // local store finished its initial load
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
  operate: Record<string, OperateData>;
  experiments: Record<string, GrowthExperiment[]>;
  deletedIds: string[];
  overlay: (s: SyncState) => void; // merge DB-as-truth into the store (via mergeSyncState)
  onError?: (msg: string | null) => void; // surface a write/hydrate failure to the UI (null clears it)
}

export interface AuthoritativeSyncApi {
  ready: boolean; // true after a successful DB hydrate (+ any needed upload migration)
  flush: () => Promise<void>; // resolves when the next write-through cycle persists; rejects on failure
}

export function useAuthoritativeSync(p: UseAuthoritativeSyncParams): AuthoritativeSyncApi {
  const { enabled, hydrated } = p;
  const syncedRef = useRef<SyncState | null>(null); // what we believe is in the DB
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const uidRef = useRef<string | null>(null);
  const waitersRef = useRef<Array<{ resolve: () => void; reject: (e: unknown) => void }>>([]);

  // Refs mirror the latest props so the (enable-only) hydrate effect and the imperative flush read current
  // state without stale closures.
  const latestRef = useRef<SyncState>(EMPTY_STATE);
  latestRef.current = { companies: p.companies, activities: p.activities, approvals: p.approvals, operate: p.operate, experiments: p.experiments };
  const overlayRef = useRef(p.overlay);
  overlayRef.current = p.overlay;
  const onErrorRef = useRef(p.onError);
  onErrorRef.current = p.onError;

  // Hydrate DB-as-truth + one-time no-loss upload migration. Runs on enable only.
  useEffect(() => {
    if (!enabled) {
      readyRef.current = false;
      setReady(false);
      syncedRef.current = null;
      uidRef.current = null;
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
        uidRef.current = uid;
        let dbState = await loadFromDb(sb, uid);
        // No-loss migration: empty DB + local companies → push local up once, then reload as truth.
        if (shouldUploadMigrate(dbState, latestRef.current) && !isMigrated(uid)) {
          await uploadLocalToDb(sb, uid, latestRef.current);
          markMigrated(uid);
          if (cancelled) return;
          dbState = await loadFromDb(sb, uid);
        }
        if (cancelled) return;
        syncedRef.current = dbState;
        readyRef.current = true;
        setReady(true);
        overlayRef.current(dbState); // union-merge (never drops a local-only not-yet-uploaded company)
      } catch (e) {
        console.warn("[authoritative] hydrate failed — staying on cache:", e instanceof Error ? e.message : "unknown");
        onErrorRef.current?.("Offline — your latest changes may not be saved yet.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Awaited write-through: on every store change, diff against the DB snapshot and push the delta. Unlike the
  // best-effort path, failures are surfaced (onError) and any flush() waiters are settled so callers (e.g.
  // decideBuild) can confirm a write landed or roll back.
  useEffect(() => {
    if (!enabled || !hydrated || !readyRef.current) return;
    const sb = getBrowserSupabase();
    const uid = uidRef.current;
    if (!sb || !uid) return;
    const next: SyncState = { companies: p.companies, activities: p.activities, approvals: p.approvals, operate: p.operate, experiments: p.experiments };
    const ops = diffStore(syncedRef.current ?? EMPTY_STATE, next);
    const waiters = waitersRef.current;
    waitersRef.current = [];
    if (isEmptyOps(ops)) {
      waiters.forEach((w) => w.resolve());
      return;
    }
    const prevSynced = syncedRef.current;
    syncedRef.current = next; // optimistic
    applyOps(sb, uid, ops)
      .then(() => {
        onErrorRef.current?.(null); // a successful sync clears any prior error
        waiters.forEach((w) => w.resolve());
      })
      .catch((e) => {
        syncedRef.current = prevSynced; // roll back the marker → next change re-diffs & retries
        console.error("[authoritative] write-through failed:", e instanceof Error ? e.message : "unknown");
        onErrorRef.current?.("Couldn't save your latest change — retrying.");
        waiters.forEach((w) => w.reject(e));
      });
  }, [enabled, hydrated, p.companies, p.activities, p.approvals, p.operate, p.experiments]);

  // Resolves when the write-through cycle triggered by the caller's preceding state change has persisted (or
  // rejects on failure). Callers MUST mutate state before awaiting flush (so a write-through cycle fires).
  const flush = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        if (!readyRef.current) {
          resolve();
          return;
        }
        waitersRef.current.push({ resolve, reject });
      }),
    [],
  );

  return { ready, flush };
}
