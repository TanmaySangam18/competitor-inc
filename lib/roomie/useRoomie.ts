"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity, AgentRole, ApprovalItem, ApprovalKind, Company, OperateData, ValidationResult } from "./types";
import { companyNameFrom, getProvider, slugify, type ShiftResult } from "./provider";
import { getByok } from "./config";
import { canRun, recordRun, FREE_CAPS } from "./usage";

const KEY = "roomie:v2";
const LEGACY_KEY = "roomie:v1";

// Autopilot pauses (rather than piling up consequential actions) once this many approvals are
// waiting. Shared by the interval guard and the derived `autopilotPaused` flag so they can't drift.
export const AUTOPILOT_PAUSE_AT = 3;

interface Store {
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
  activeId: string | null;
  operate: Record<string, OperateData>;
}
const empty: Store = { companies: [], activities: {}, approvals: {}, activeId: null, operate: {} };

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
  body: { kind: "validate"; idea: string } | { kind: "shift"; company: Company }
): Promise<{ validation: ValidationResult } | ShiftResult> {
  try {
    const res = await fetch("/api/roomie", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, byok: getByok() ?? undefined }),
    });
    if (!res.ok) throw new Error("engine " + res.status);
    return await res.json();
  } catch {
    const p = getProvider();
    return body.kind === "validate" ? { validation: p.validate(body.idea) } : p.shift(body.company);
  }
}

export function useRoomie() {
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

  const company = store.companies.find((c) => c.id === store.activeId) ?? null;
  const activities = company ? store.activities[company.id] ?? [] : [];
  const approvals = company ? store.approvals[company.id] ?? [] : [];
  const operate = company ? store.operate[company.id] ?? { rocks: [], issues: [] } : { rocks: [], issues: [] };

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
      delete activities[id];
      delete approvals[id];
      delete operate[id];
      return { companies, activities, approvals, operate, activeId: s.activeId === id ? companies[0]?.id ?? null : s.activeId };
    });
  }, []);

  // Best-effort bridge to the gated real-execution layer (/api/execute). Returns null when the
  // integration is off or the call fails, so the simulated/optimistic UI is never blocked.
  const executeAction = useCallback(
    async (
      action: string,
      payload: { company: { name: string; idea: string }; item?: { kind: string; title?: string; detail?: string; amount?: number } }
    ) => {
      try {
        const res = await fetch("/api/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
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
      // build the winner — ship an initial MVP with a real artifact (proof-of-work)
      const url = `https://${c.slug}.competitor.inc`;
      const mvpCost = 0.42;
      const mvp: Activity = {
        id: rid(),
        night: 1,
        agent: "engineering",
        action: "Shipped the validated MVP",
        meta: "build passed",
        cost: mvpCost,
        status: "done",
        proof: { kind: "url", value: url },
      };
      return {
        ...s,
        companies: s.companies.map((x) =>
          x.id === c.id
            ? {
                ...x,
                status: "operating",
                night: 1,
                product: { url, status: "live" },
                ledger: { ...x.ledger, spent: round(x.ledger.spent + mvpCost), tasksDone: x.ledger.tasksDone + 1 },
              }
            : x
        ),
        activities: { ...s.activities, [c.id]: [mvp, ...(s.activities[c.id] ?? [])] },
      };
    });
    // Real execution (gated): when keys are set, actually build the MVP on GitHub and log the
    // verified proof. With no keys, /api/execute returns disabled and nothing extra happens.
    if (approve && active && active.status !== "operating") {
      void executeAction("build", { company: { name: active.name, idea: active.idea } }).then((r) => {
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
        const res = (await callEngine({ kind: "shift", company: active })) as Partial<ShiftResult>;
        const acts = Array.isArray(res?.activities) ? res.activities : []; // guard malformed 200
        const apps = Array.isArray(res?.approvals) ? res.approvals : [];
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
          };
        });
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
      const active = s.companies.find((c) => c.id === s.activeId);
      if (!active) return { ...s, approvals };
      const newActivity: Activity = {
        id: rid(),
        night: active.night,
        agent: item.agent,
        action: item.title + " — approved by you",
        meta: "you signed off",
        cost,
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
            ? { kind: "metric", value: `$${cost} approved` }
            : { kind: "metric", value: "approved" },
      };
      return {
        ...s,
        approvals,
        activities: { ...s.activities, [active.id]: [newActivity, ...(s.activities[active.id] ?? [])] },
        companies: s.companies.map((c) =>
          c.id === active.id
            ? { ...c, ledger: { ...c.ledger, spent: round(c.ledger.spent + cost), tasksDone: c.ledger.tasksDone + 1 } }
            : c
        ),
      };
    });
    // Real execution (gated): carry out the approved action for real when keys exist; log the proof.
    if (approve && activeCo && seed && !seed.resolved) {
      void executeAction(seed.kind, {
        company: { name: activeCo.name, idea: activeCo.idea },
        item: { kind: seed.kind, title: seed.title, detail: seed.detail, amount: seed.amount },
      }).then((r) => {
        if (r?.ok && r.proof) appendRealResult(activeCo.id, { action: `Executed: ${seed.title}`, agent: seed.agent, proof: r.proof, meta: "real action ✓" });
      });
    }
  }, [executeAction, appendRealResult]);

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
      product: { url: `https://${slugify(name)}.demo.competitor.inc`, status: "live" },
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
    loadDemo,
    switchCompany,
    deleteCompany,
    decideBuild,
    runShift,
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
