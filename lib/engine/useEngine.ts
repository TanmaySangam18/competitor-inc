"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity, AgentRole, ApprovalItem, ApprovalKind, Company, GrowthGoal, OperateData, ValidationResult } from "./types";
import type { GrowthExperiment } from "./growth";
import { companyNameFrom, getProvider, slugify, type ShiftResult } from "./provider";
import { getByok, getConnections, pingCustomerUpdate, pingApprovalRequest, fetchApprovalDecisions } from "./config";
import { draftBlitz } from "./blitz";
import { generateSocialDrafts, generateDistributionActivities } from "./distribution";
import { canRun, recordRun, FREE_CAPS } from "./usage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import { useDbSync, type SyncState } from "./sync";

const KEY = "cofounder:v2";
const LEGACY_KEY = "cofounder:v1";

// Autopilot pauses (rather than piling up consequential actions) once this many approvals are
// waiting. Shared by the interval guard and the derived `autopilotPaused` flag so they can't drift.
export const AUTOPILOT_PAUSE_AT = 3;

interface Store {
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
  activeId: string | null;
  operate: Record<string, OperateData>;
  experiments: Record<string, GrowthExperiment[]>;
}
const empty: Store = { companies: [], activities: {}, approvals: {}, activeId: null, operate: {}, experiments: {} };

function load(): Store {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      // guard a corrupted store: companies must be an array, the maps must be objects
      if (parsed && Array.isArray(parsed.companies)) {
        return {
          ...empty,
          ...parsed,
          activities: parsed.activities && typeof parsed.activities === "object" ? parsed.activities : {},
          approvals: parsed.approvals && typeof parsed.approvals === "object" ? parsed.approvals : {},
          operate: parsed.operate && typeof parsed.operate === "object" ? parsed.operate : {},
          experiments: parsed.experiments && typeof parsed.experiments === "object" ? parsed.experiments : {},
        };
      }
      // corrupted — fall through to legacy/empty
    }
    // migrate the old single-company shape, if present
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { company: Company | null; activities: Activity[]; approvals: ApprovalItem[] };
      if (old.company) {
        return {
          companies: [old.company],
          activities: { [old.company.id]: old.activities ?? [] },
          approvals: { [old.company.id]: old.approvals ?? [] },
          activeId: old.company.id,
          operate: {},
          experiments: {},
        };
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

const round = (n: number) => Math.round(n * 100) / 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rid = () => crypto.randomUUID();

async function callEngine(
  body:
    | { kind: "validate"; idea: string; nonce?: number }
    | { kind: "shift"; company: Company; experiments?: GrowthExperiment[] }
): Promise<{ validation: ValidationResult } | (ShiftResult & { experiments?: GrowthExperiment[] })> {
  try {
    const res = await fetch("/api/engine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, byok: getByok() ?? undefined }),
    });
    if (!res.ok) throw new Error("engine " + res.status);
    return await res.json();
  } catch {
    const p = getProvider();
    return body.kind === "validate"
      ? { validation: p.validate(body.idea, body.nonce != null ? String(body.nonce) : undefined) }
      : p.shift(body.company);
  }
}

export function useEngine() {
  const [store, setStore] = useState<Store>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [working, setWorking] = useState<null | "validating" | "shift">(null);
  const [autopilot, setAutopilot] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const ref = useRef(store);
  const inFlightRef = useRef(false); // prevents overlapping shifts (autopilot interval / double-click)
  useEffect(() => {
    ref.current = store;
  });

  useEffect(() => {
    setStore(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* ignore */
    }
  }, [store, hydrated]);

  // Cloud persistence (GATED + best-effort). Only when Supabase is configured AND the user is signed
  // in (non-guest); otherwise this is inert and the app stays entirely on the localStorage store
  // above. localStorage always remains the offline cache/source-of-truth. NOTE: not yet verified
  // against a live DB — see lib/engine/sync.ts.
  const { user, ready: authReady } = useAuth();
  const dbEnabled = isSupabaseConfigured() && authReady && !!user && !user.guest;
  const overlayFromDb = useCallback((s: SyncState) => {
    // Merge cloud state in, including operate (Rocks/Issues now persist). Preserve the active
    // selection, falling back to the first cloud company.
    setStore((prev) => ({
      ...prev,
      companies: s.companies,
      activities: s.activities,
      approvals: s.approvals,
      operate: { ...prev.operate, ...s.operate },
      experiments: { ...prev.experiments, ...s.experiments },
      activeId: prev.activeId ?? s.companies[0]?.id ?? null,
    }));
  }, []);
  useDbSync({
    enabled: dbEnabled,
    hydrated,
    companies: store.companies,
    activities: store.activities,
    approvals: store.approvals,
    operate: store.operate,
    experiments: store.experiments,
    overlay: overlayFromDb,
  });

  const company = store.companies.find((c) => c.id === store.activeId) ?? null;
  const activities = company ? store.activities[company.id] ?? [] : [];
  const approvals = company ? store.approvals[company.id] ?? [] : [];
  const operate = company ? store.operate[company.id] ?? { rocks: [], issues: [] } : { rocks: [], issues: [] };
  const experiments = company ? store.experiments[company.id] ?? [] : [];

  const createCompany = useCallback((idea: string) => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    if (!canRun("validate")) {
      setBlocked(`That's today's ${FREE_CAPS.validate} free validations. Add your own model key in Settings to keep going — or come back tomorrow.`);
      return;
    }
    recordRun("validate");
    const name = companyNameFrom(trimmed);
    const c: Company = {
      id: rid(),
      name,
      slug: slugify(name),
      idea: trimmed,
      createdAt: Date.now(),
      status: "validating",
      night: 0,
      ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
    };
    setStore((s) => ({
      companies: [c, ...s.companies],
      activities: { ...s.activities, [c.id]: [] },
      approvals: { ...s.approvals, [c.id]: [] },
      operate: { ...s.operate, [c.id]: { rocks: [], issues: [] } },
      experiments: { ...s.experiments, [c.id]: [] },
      activeId: c.id,
    }));
    setWorking("validating");

    (async () => {
      const started = Date.now();
      const res = (await callEngine({ kind: "validate", idea: trimmed })) as { validation?: ValidationResult };
      const validation = res?.validation ?? getProvider().validate(trimmed); // guard a malformed 200
      const remaining = 1900 - (Date.now() - started);
      if (remaining > 0) await sleep(remaining);
      setStore((s) => ({
        ...s,
        companies: s.companies.map((x) =>
          x.id === c.id
            ? { ...x, status: "validated", validation, ledger: { ...x.ledger, spent: validation.spend } }
            : x
        ),
      }));
      // Opt-in customer update (no-op unless they connected a channel) — fires on validation.
      pingCustomerUpdate(
        `${name}: validation in — ${validation.verdict} signal (${validation.confidence}% confidence). Open competitor.inc to decide your next move.`
      );
      setWorking(null);
    })();
  }, []);

  // Import-and-sell on-ramp: adopt an ALREADY-BUILT product (a pasted URL). The product exists and is
  // live, so we skip "build" entirely — we read demand, then the crew's whole job is getting it
  // customers. The wedge: the internet is full of built-but-unsold projects; we sell them, not rebuild them.
  const importCompany = useCallback((url: string, title: string) => {
    const cleanUrl = (url || "").trim();
    if (!cleanUrl) return;
    if (!canRun("validate")) {
      setBlocked(`That's today's ${FREE_CAPS.validate} free reads. Add your own model key in Settings to keep going — or come back tomorrow.`);
      return;
    }
    recordRun("validate");
    const name = companyNameFrom((title || cleanUrl).trim());
    const idea = `${name} — an existing, already-built product (${cleanUrl}). The goal isn't to build it; it's to get it real customers.`;
    const c: Company = {
      id: rid(),
      name,
      slug: slugify(name),
      idea,
      createdAt: Date.now(),
      status: "validating",
      night: 0,
      ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
      product: { url: cleanUrl, status: "live" }, // already built + live — born with proof-of-work
    };
    setStore((s) => ({
      companies: [c, ...s.companies],
      activities: { ...s.activities, [c.id]: [] },
      approvals: { ...s.approvals, [c.id]: [] },
      operate: { ...s.operate, [c.id]: { rocks: [], issues: [] } },
      experiments: { ...s.experiments, [c.id]: [] },
      activeId: c.id,
    }));
    setWorking("validating");
    (async () => {
      const started = Date.now();
      const res = (await callEngine({ kind: "validate", idea })) as { validation?: ValidationResult };
      const validation = res?.validation ?? getProvider().validate(idea);
      const remaining = 1900 - (Date.now() - started);
      if (remaining > 0) await sleep(remaining);
      setStore((s) => ({
        ...s,
        companies: s.companies.map((x) =>
          x.id === c.id
            ? { ...x, status: "validated", validation, ledger: { ...x.ledger, spent: validation.spend } }
            : x
        ),
      }));
      pingCustomerUpdate(
        `${name}: demand read in — ${validation.verdict} signal (${validation.confidence}% confidence). Open competitor.inc to put your crew on getting it customers.`
      );
      setWorking(null);
    })();
  }, []);

  const switchCompany = useCallback((id: string | null) => setStore((s) => ({ ...s, activeId: id })), []);

  const deleteCompany = useCallback((id: string) => {
    setStore((s) => {
      const companies = s.companies.filter((c) => c.id !== id);
      const activities = { ...s.activities };
      const approvals = { ...s.approvals };
      const operate = { ...s.operate };
      const experiments = { ...s.experiments };
      delete activities[id];
      delete approvals[id];
      delete operate[id];
      delete experiments[id];
      return { companies, activities, approvals, operate, experiments, activeId: s.activeId === id ? companies[0]?.id ?? null : s.activeId };
    });
  }, []);

  // Best-effort bridge to the gated real-execution layer (/api/execute). Returns null when the
  // integration is off or the call fails, so the simulated/optimistic UI is never blocked.
  const executeAction = useCallback(
    async (
      action: string,
      // companyId + approvalId let /api/execute enforce the approval gate server-side: a real executor
      // only fires for the authenticated owner of this company, tied to this approved inbox item. agent
      // drives the per-agent policy matrix (which actions that role may take).
      payload: { company: { name: string; idea: string }; item?: { kind: string; title?: string; detail?: string; amount?: number }; companyId?: string; approvalId?: string; agent?: AgentRole }
    ) => {
      try {
        const res = await fetch("/api/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload, connections: getConnections() ?? undefined }) });
        if (!res.ok) return null;
        return (await res.json()) as { ok: boolean; disabled?: boolean; proof?: { kind: "url" | "build" | "metric"; value: string }; error?: string };
      } catch {
        return null;
      }
    },
    []
  );

  // When a real action returns a verified proof, log it to the Glass Box (and set the live product
  // URL for a real build). Append-only — never mutates existing entries, so it's safe offline.
  const appendRealResult = useCallback(
    (companyId: string, a: { action: string; agent: AgentRole; proof: { kind: "url" | "build" | "metric"; value: string }; meta?: string; productUrl?: string }) => {
      setStore((s) => {
        const c = s.companies.find((x) => x.id === companyId);
        if (!c) return s;
        const act: Activity = { id: rid(), night: c.night, agent: a.agent, action: a.action, meta: a.meta, cost: 0, status: "done", proof: a.proof };
        return {
          ...s,
          companies: a.productUrl ? s.companies.map((x) => (x.id === companyId ? { ...x, product: { url: a.productUrl!, status: "live" } } : x)) : s.companies,
          activities: { ...s.activities, [companyId]: [act, ...(s.activities[companyId] ?? [])] },
        };
      });
    },
    []
  );

  const decideBuild = useCallback((approve: boolean) => {
    const active = ref.current.companies.find((x) => x.id === ref.current.activeId);
    setStore((s) => {
      const c = s.companies.find((x) => x.id === s.activeId);
      if (!c) return s;
      // Idempotent: never re-build a company that's already operating (double-click / re-entry
      // after redirect would otherwise ship a second MVP and double-charge the ledger).
      if (approve && c.status === "operating") return s;
      if (!approve) {
        return { ...s, companies: s.companies.map((x) => (x.id === c.id ? { ...x, status: "rejected" } : x)) };
      }
      // Two ways in. IMPORTED product (already live) → we never rebuild it; we adopt it and the crew's
      // whole job becomes distribution. NEW idea → build the validated MVP (the real, openable link is set
      // by appendRealResult once the build executor ships it; until then it's honestly "building" — never
      // a fabricated link, even in pure simulation).
      const isImported = c.product?.status === "live";
      const cost = isImported ? 0 : 0.42;
      const first: Activity = isImported
        ? {
            id: rid(),
            night: 1,
            agent: "growth",
            action: `Adopted ${c.name} — the crew is now focused on getting it customers`,
            meta: "already built · distribution first",
            cost: 0,
            status: "done",
            proof: { kind: "url", value: c.product!.url },
          }
        : {
            id: rid(),
            night: 1,
            agent: "engineering",
            action: "Started shipping the validated MVP",
            meta: "build in progress",
            cost: 0.42,
            status: "done",
            proof: { kind: "metric", value: "build started — shipping your site" },
          };
      const extraActivities = isImported ? generateDistributionActivities(c, 1) : [];
      const extraApprovals = isImported ? generateSocialDrafts(c, 1) : [];
      return {
        ...s,
        companies: s.companies.map((x) =>
          x.id === c.id
            ? {
                ...x,
                status: "operating",
                night: 1,
                product: isImported ? x.product : { url: "", status: "building" },
                ledger: { ...x.ledger, spent: round(x.ledger.spent + cost), tasksDone: x.ledger.tasksDone + 1 },
              }
            : x
        ),
        activities: { ...s.activities, [c.id]: [...extraActivities, first, ...(s.activities[c.id] ?? [])] },
        approvals: { ...s.approvals, [c.id]: [...(s.approvals[c.id] ?? []), ...extraApprovals] },
      };
    });
    // Real execution (gated): when keys are set, actually build the MVP on GitHub and log the verified
    // proof. Skipped for imported products (already live — nothing to build). With no keys, /api/execute
    // returns disabled and nothing extra happens.
    if (approve && active && active.status !== "operating" && active.product?.status !== "live") {
      void executeAction("build", { company: { name: active.name, idea: active.idea }, companyId: active.id, agent: "engineering" }).then((r) => {
        if (r?.ok && r.proof) {
          appendRealResult(active.id, {
            action: "Shipped the MVP to GitHub",
            agent: "engineering",
            proof: r.proof,
            meta: "real build ✓",
            productUrl: r.proof.kind === "url" ? r.proof.value : undefined,
          });
        }
      });
    }
  }, [executeAction, appendRealResult]);

  // Re-test demand on an operating company — continuous validation, not one-shot. Re-runs the gate
  // with a fresh seed (the engine varies the reading), logs the new verdict + a confidence delta to
  // the Glass Box, and updates the company's live validation. Honest: it's a real demand test, so it
  // costs (logged in the ledger) and counts against the free-tier validation cap.
  const revalidate = useCallback(() => {
    if (inFlightRef.current) return;
    const active = ref.current.companies.find((c) => c.id === ref.current.activeId);
    if (!active || active.status !== "operating") return;
    if (!canRun("validate")) {
      setBlocked(`That's today's ${FREE_CAPS.validate} free demand tests. Add your own model key in Settings to keep going — or come back tomorrow.`);
      return;
    }
    recordRun("validate");
    inFlightRef.current = true;
    setWorking("validating");
    (async () => {
      try {
        const prevConf = active.validation?.confidence ?? 0;
        const nonce = (active.night + 1) * 1000 + (Date.now() % 1000);
        const res = (await callEngine({ kind: "validate", idea: active.idea, nonce })) as { validation?: ValidationResult };
        const validation = res?.validation ?? getProvider().validate(active.idea, String(nonce));
        const delta = Math.round(validation.confidence - prevConf);
        const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "→";
        const reActivity: Activity = {
          id: rid(),
          night: active.night,
          agent: "marketing",
          action: `Re-tested demand — ${validation.confidence}% confidence (${arrow}${Math.abs(delta)} pts vs last)`,
          meta: `${validation.verdict} signal`,
          cost: validation.spend,
          status: "done",
          proof: { kind: "metric", value: `${validation.waitlist} signups · ${validation.ctr}% CTR` },
        };
        setStore((s) => ({
          ...s,
          companies: s.companies.map((x) =>
            x.id === active.id
              ? { ...x, validation, ledger: { ...x.ledger, spent: round(x.ledger.spent + validation.spend), tasksDone: x.ledger.tasksDone + 1 } }
              : x
          ),
          activities: { ...s.activities, [active.id]: [reActivity, ...(s.activities[active.id] ?? [])] },
        }));
      } finally {
        inFlightRef.current = false;
        setWorking(null);
      }
    })();
  }, []);

  const runShift = useCallback(() => {
    if (inFlightRef.current) return; // no overlapping shifts
    const active = ref.current.companies.find((c) => c.id === ref.current.activeId);
    if (!active || active.status !== "operating") return;
    if (!canRun("shift")) {
      setBlocked(`That's today's ${FREE_CAPS.shift} free shifts. Add your own model key in Settings to keep going.`);
      return;
    }
    recordRun("shift");
    inFlightRef.current = true;
    setWorking("shift");
    (async () => {
      try {
        const started = Date.now();
        // Revenue Loop: send the open experiments so the server can close them against real funnel
        // data and propose the next ones. The returned array is the company's full updated ledger.
        const openExps = (ref.current.experiments[active.id] ?? []).filter((x) => x.status === "running");
        const res = (await callEngine({ kind: "shift", company: active, experiments: openExps })) as Partial<
          ShiftResult & { experiments: GrowthExperiment[] }
        >;
        const acts = Array.isArray(res?.activities) ? res.activities : []; // guard malformed 200
        const apps = Array.isArray(res?.approvals) ? res.approvals : [];
        const exps = Array.isArray(res?.experiments) ? res.experiments : [];
        const remaining = 900 - (Date.now() - started);
        if (remaining > 0) await sleep(remaining);
        const done = acts.filter((a) => a.status === "done");
        const failed = acts.filter((a) => a.status === "failed-credited");
        const spent = done.reduce((t, a) => t + a.cost, 0);
        const credited = failed.reduce((t, a) => t + a.cost, 0);
        setStore((s) => {
          const c = s.companies.find((x) => x.id === active.id);
          if (!c) return s;
          return {
            ...s,
            companies: s.companies.map((x) =>
              x.id === c.id
                ? {
                    ...x,
                    night: x.night + 1,
                    ledger: {
                      spent: round(x.ledger.spent + spent),
                      credited: round((x.ledger.credited ?? 0) + credited),
                      tasksDone: x.ledger.tasksDone + done.length,
                      tasksFailed: x.ledger.tasksFailed + failed.length,
                    },
                  }
                : x
            ),
            activities: { ...s.activities, [c.id]: [...acts, ...(s.activities[c.id] ?? [])] },
            approvals: { ...s.approvals, [c.id]: [...apps, ...(s.approvals[c.id] ?? [])] },
            // Experiment merge: replace touched ids (closes), append new ones, keep untouched history.
            experiments: exps.length
              ? {
                  ...s.experiments,
                  [c.id]: (() => {
                    const byId = new Map(exps.map((x) => [x.id, x]));
                    const keptOrUpdated = (s.experiments[c.id] ?? []).map((x) => byId.get(x.id) ?? x);
                    const existing = new Set(keptOrUpdated.map((x) => x.id));
                    const brandNew = exps.filter((x) => !existing.has(x.id));
                    return [...brandNew, ...keptOrUpdated];
                  })(),
                }
              : s.experiments,
          };
        });
        // Opt-in customer update (no-op unless they connected a channel) — fires on every shift.
        pingCustomerUpdate(
          `${active.name}: night ${active.night + 1} wrapped — ${done.length} task${done.length === 1 ? "" : "s"} shipped${apps.length ? `, ${apps.length} waiting for your ok` : ""}. See the Glass Box.`
        );
        // ChatOps: push each consequential approval to the phone with Approve/Reject buttons.
        for (const ap of apps) {
          pingApprovalRequest({ id: ap.id, title: ap.title, agent: ap.agent, kind: ap.kind, detail: ap.detail, amount: ap.amount, company: active.name });
        }
      } finally {
        inFlightRef.current = false;
        setWorking(null);
      }
    })();
  }, []);

  // Autopilot — the "heartbeat": runs a shift on an interval while enabled (the in-app
  // equivalent of the nightly cron; a deployed cron hits /api/cron). Pauses if approvals pile up.
  useEffect(() => {
    if (!autopilot) return;
    const t = setInterval(() => {
      const s = ref.current;
      const active = s.companies.find((c) => c.id === s.activeId);
      const pending = active ? (s.approvals[active.id] ?? []).filter((a) => !a.resolved).length : 0;
      if (active && active.status === "operating" && pending < AUTOPILOT_PAUSE_AT) runShift();
    }, 6000);
    return () => clearInterval(t);
  }, [autopilot, runShift]);

  const resolveApproval = useCallback((id: string, approve: boolean) => {
    const before = ref.current;
    const activeCo = before.companies.find((c) => c.id === before.activeId);
    const seed = activeCo ? (before.approvals[activeCo.id] ?? []).find((a) => a.id === id) : undefined;
    setStore((s) => {
      if (!s.activeId) return s;
      const list = s.approvals[s.activeId] ?? [];
      const item = list.find((a) => a.id === id);
      if (!item) return s;
      // Idempotent: a re-resolve (double-click) must not re-charge the ledger or re-log the action.
      if (item.resolved) return s;
      const approvals = {
        ...s.approvals,
        [s.activeId]: list.map((a) => (a.id === id ? { ...a, resolved: approve ? "approved" : ("rejected" as const) } : a)) as ApprovalItem[],
      };
      if (!approve) return { ...s, approvals };
      const cost = item.amount ?? 0;
      // Ad spend runs on the user's OWN connected ad account (off-platform) — it is NOT competitor.inc's
      // money, and with no account connected NOTHING is actually spent. So a spend approval must never
      // inflate our ledger or claim "$X spent"; it's queued honestly. Real connected spend would be
      // reflected only via executeAction's real proof.
      const charged = item.kind === "spend" ? 0 : cost;
      const active = s.companies.find((c) => c.id === s.activeId);
      if (!active) return { ...s, approvals };
      const newActivity: Activity = {
        id: rid(),
        night: active.night,
        agent: item.agent,
        action: item.title + " — approved by you",
        meta: "you signed off",
        cost: charged,
        status: "done",
        // Honest: approving QUEUES the action — it doesn't claim the real-world act happened. The
        // real result (a live URL / send id) is appended by executeAction only when an integration
        // is actually connected; in simulation nothing is reported as done in the world.
        proof:
          item.kind === "deploy"
            ? { kind: "metric", value: "approved — queued to deploy" }
            : item.kind === "outreach"
            ? { kind: "metric", value: "approved — drafted, queued to send" }
            : item.kind === "spend"
            ? { kind: "metric", value: "approved — queued to your ad account · nothing spent until you connect one" }
            : { kind: "metric", value: "approved" },
      };
      return {
        ...s,
        approvals,
        activities: { ...s.activities, [active.id]: [newActivity, ...(s.activities[active.id] ?? [])] },
        companies: s.companies.map((c) =>
          c.id === active.id
            ? { ...c, ledger: { ...c.ledger, spent: round(c.ledger.spent + charged), tasksDone: c.ledger.tasksDone + 1 } }
            : c
        ),
      };
    });
    // Real execution (gated): carry out the approved action for real when keys exist; log the proof.
    if (approve && activeCo && seed && !seed.resolved) {
      void executeAction(seed.kind, {
        company: { name: activeCo.name, idea: activeCo.idea },
        item: { kind: seed.kind, title: seed.title, detail: seed.detail, amount: seed.amount },
        companyId: activeCo.id,
        approvalId: seed.id,
        agent: seed.agent,
      }).then((r) => {
        if (r?.ok && r.proof) appendRealResult(activeCo.id, { action: `Executed: ${seed.title}`, agent: seed.agent, proof: r.proof, meta: "real action ✓" });
      });
    }
  }, [executeAction, appendRealResult]);

  // ChatOps reconcile: if the founder tapped Approve/Reject in Telegram, apply it here so effects run
  // exactly once through the normal path (resolveApproval is idempotent). Polls only while the active
  // company has pending approvals AND a channel is connected (fetchApprovalDecisions is a no-op otherwise).
  const pendingIds = (company ? store.approvals[company.id] ?? [] : []).filter((a) => !a.resolved).map((a) => a.id);
  const pendingKey = pendingIds.join(",");
  useEffect(() => {
    if (!hydrated || pendingIds.length === 0) return;
    let on = true;
    const check = async () => {
      const decisions = await fetchApprovalDecisions(pendingIds);
      if (!on) return;
      for (const [id, decision] of Object.entries(decisions)) resolveApproval(id, decision === "approved");
    };
    void check();
    const iv = setInterval(() => void check(), 8000);
    return () => { on = false; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pendingKey]);

  // Surge's launch blitz: draft demand-capture posts for the active company and queue each as an
  // OUTREACH approval — so the blitz is ready to fire but nothing posts without the founder's yes
  // (human-in-the-loop). Logs a Glass Box entry noting the drafts are waiting.
  const launchBlitz = useCallback(() => {
    const active = ref.current.companies.find((c) => c.id === ref.current.activeId);
    if (!active || active.status !== "operating") return;
    const drafts = draftBlitz({ name: active.name, idea: active.idea });
    if (drafts.length === 0) return;
    setStore((s) => {
      const cid = active.id;
      const queued: ApprovalItem[] = drafts.map((d) => ({
        id: rid(),
        night: active.night,
        agent: "growth",
        kind: "outreach",
        title: d.title,
        detail: d.body,
      }));
      const logged: Activity = {
        id: rid(),
        night: active.night,
        agent: "growth",
        action: `Drafted the launch blitz — ${drafts.length} posts queued for your approval`,
        meta: "outbound waits for your yes",
        cost: 0,
        status: "done",
        proof: { kind: "metric", value: `${drafts.length} drafts ready` },
      };
      return {
        ...s,
        approvals: { ...s.approvals, [cid]: [...queued, ...(s.approvals[cid] ?? [])] },
        activities: { ...s.activities, [cid]: [logged, ...(s.activities[cid] ?? [])] },
      };
    });
  }, []);

  // The Revenue Loop scoreboard: set/replace the active company's growth goal. Persistence rides the
  // normal localStorage + sync path (companyChanged compares growthGoal).
  const setGrowthGoal = useCallback((goal: GrowthGoal | undefined) => {
    setStore((s) => {
      if (!s.activeId) return s;
      return { ...s, companies: s.companies.map((c) => (c.id === s.activeId ? { ...c, growthGoal: goal } : c)) };
    });
  }, []);

  // Queue an approval from outside a shift (e.g. a consequential request made in chat). Keeps the
  // promise "I'll queue it for your approval" honest — the item really lands in the Approval Inbox.
  const addApproval = useCallback(
    (seed: { agent: AgentRole; kind: ApprovalKind; title: string; detail: string; amount?: number }) => {
      setStore((s) => {
        if (!s.activeId) return s;
        const c = s.companies.find((x) => x.id === s.activeId);
        if (!c) return s;
        const item: ApprovalItem = {
          id: rid(),
          night: c.night,
          agent: seed.agent,
          kind: seed.kind,
          title: seed.title,
          detail: seed.detail,
          amount: seed.amount,
        };
        return { ...s, approvals: { ...s.approvals, [c.id]: [item, ...(s.approvals[c.id] ?? [])] } };
      });
    },
    []
  );

  const undoActivity = useCallback((id: string) => {
    setStore((s) => {
      if (!s.activeId) return s;
      const list = s.activities[s.activeId] ?? [];
      const act = list.find((a) => a.id === id);
      if (!act || act.undone) return s;
      return {
        ...s,
        activities: { ...s.activities, [s.activeId]: list.map((a) => (a.id === id ? { ...a, undone: true } : a)) },
        companies: s.companies.map((c) =>
          c.id === s.activeId
            ? { ...c, ledger: { ...c.ledger, spent: round(Math.max(0, c.ledger.spent - act.cost)), credited: round((c.ledger.credited ?? 0) + act.cost) } }
            : c
        ),
      };
    });
  }, []);

  const updateOperate = useCallback((fn: (o: OperateData) => OperateData) => {
    setStore((s) => {
      if (!s.activeId) return s;
      const cur = s.operate[s.activeId] ?? { rocks: [], issues: [] };
      return { ...s, operate: { ...s.operate, [s.activeId]: fn(cur) } };
    });
  }, []);
  const addRock = useCallback((title: string) => {
    const t = title.trim();
    if (t) updateOperate((o) => ({ ...o, rocks: [...o.rocks, { id: rid(), title: t, done: false }] }));
  }, [updateOperate]);
  const toggleRock = useCallback((id: string) => updateOperate((o) => ({ ...o, rocks: o.rocks.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })), [updateOperate]);
  const deleteRock = useCallback((id: string) => updateOperate((o) => ({ ...o, rocks: o.rocks.filter((r) => r.id !== id) })), [updateOperate]);
  const addIssue = useCallback((title: string) => {
    const t = title.trim();
    if (t) updateOperate((o) => ({ ...o, issues: [{ id: rid(), title: t, resolved: false }, ...o.issues] }));
  }, [updateOperate]);
  const resolveIssue = useCallback((id: string) => updateOperate((o) => ({ ...o, issues: o.issues.map((i) => (i.id === id ? { ...i, resolved: !i.resolved } : i)) })), [updateOperate]);

  // Seed a fully-populated, already-operating demo company so anyone can explore the whole product
  // (Glass Box, approvals, history, the 3D floor) end-to-end without running shifts by hand.
  const loadDemo = useCallback(() => {
    const idea = "AI meal-prep plans for night-shift nurses";
    const name = companyNameFrom(idea);
    const id = rid();
    let c: Company = {
      id,
      name,
      slug: slugify(name),
      idea,
      createdAt: Date.now(),
      status: "operating",
      night: 0,
      validation: getProvider().validate(idea),
      ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
      // Demo company: no fabricated "live" URL — a real link only appears from a real build (honest).
      product: { url: "", status: "building" },
    };
    let acts: Activity[] = [];
    let apprs: ApprovalItem[] = [];
    for (let i = 0; i < 3; i++) {
      const r = getProvider().shift(c);
      acts = [...r.activities, ...acts];
      apprs = [...r.approvals, ...apprs];
      const done = r.activities.filter((a) => a.status === "done");
      const failed = r.activities.filter((a) => a.status === "failed-credited");
      c = {
        ...c,
        night: c.night + 1,
        ledger: {
          spent: round(c.ledger.spent + done.reduce((t, a) => t + a.cost, 0)),
          credited: round(c.ledger.credited + failed.reduce((t, a) => t + a.cost, 0)),
          tasksDone: c.ledger.tasksDone + done.length,
          tasksFailed: c.ledger.tasksFailed + failed.length,
        },
      };
    }
    setStore((s) => ({
      ...s,
      companies: [c, ...s.companies],
      activities: { ...s.activities, [id]: acts },
      approvals: { ...s.approvals, [id]: apprs },
      activeId: id,
    }));
  }, []);

  const resetAll = useCallback(() => setStore(empty), []);
  const clearBlocked = useCallback(() => setBlocked(null), []);

  const pendingApprovals = approvals.filter((a) => !a.resolved);
  // Autopilot is on but has stopped firing because consequential actions are waiting on the human.
  const autopilotPaused =
    autopilot && company?.status === "operating" && pendingApprovals.length >= AUTOPILOT_PAUSE_AT;

  return {
    company,
    activities,
    approvals,
    experiments,
    companies: store.companies,
    activeId: store.activeId,
    hydrated,
    working,
    autopilot,
    setAutopilot,
    autopilotPaused,
    blocked,
    clearBlocked,
    pendingApprovals,
    createCompany,
    importCompany,
    loadDemo,
    switchCompany,
    deleteCompany,
    decideBuild,
    runShift,
    revalidate,
    launchBlitz,
    setGrowthGoal,
    resolveApproval,
    addApproval,
    undoActivity,
    operate,
    addRock,
    toggleRock,
    deleteRock,
    addIssue,
    resolveIssue,
    resetAll,
  };
}
