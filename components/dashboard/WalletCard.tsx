"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet as WalletIcon, Pause, Play, ShieldOff, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import {
  DEFAULT_WALLET,
  balanceCents,
  spentThisMonthCents,
  budgetAlerts,
  decideSpend,
  pause,
  resume,
  revoke,
  reinstate,
  SPEND_CATEGORIES,
  type WalletConfig,
  type WalletTxn,
  type SpendCategory,
} from "@/lib/engine/wallet";

const KEY = "cofounder:wallet:v1";
const usd = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toCents = (dollars: string) => Math.max(0, Math.round(parseFloat(dollars || "0") * 100));

// A few categories worth a dedicated budget line; the rest fall under the monthly cap.
const BUDGET_CATS: SpendCategory[] = ["ads", "saas", "api", "cloud"];

export function WalletCard() {
  const [cfg, setCfg] = useState<WalletConfig>(DEFAULT_WALLET);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [preview, setPreview] = useState({ amount: "5.00", category: "ads" as SpendCategory });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw) as { cfg?: WalletConfig; txns?: WalletTxn[] };
        if (s.cfg) setCfg({ ...DEFAULT_WALLET, ...s.cfg });
        if (Array.isArray(s.txns)) setTxns(s.txns);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const save = (next: WalletConfig) => {
    setCfg(next);
    try { localStorage.setItem(KEY, JSON.stringify({ cfg: next, txns })); } catch { /* ignore */ }
  };
  const setCap = (field: keyof WalletConfig, dollars: string) => save({ ...cfg, [field]: toCents(dollars) });
  const setCatBudget = (cat: SpendCategory, dollars: string) => {
    const budgets = { ...cfg.categoryBudgetsCents };
    const c = toCents(dollars);
    if (c > 0) budgets[cat] = c; else delete budgets[cat];
    save({ ...cfg, categoryBudgetsCents: budgets });
  };

  const balance = useMemo(() => balanceCents(cfg, txns), [cfg, txns]);
  const spent = useMemo(() => spentThisMonthCents(txns), [txns]);
  const alerts = useMemo(() => budgetAlerts(cfg, txns), [cfg, txns]);
  // Preview evaluates how your LIMITS would classify a spend assuming the wallet is funded — so you can
  // tune caps/budgets before funding (which is the escalation). Uses an unlimited balance clone.
  const previewDecision = useMemo(
    () => decideSpend({ ...cfg, fundedCents: Number.MAX_SAFE_INTEGER, paused: false, revoked: false }, { agent: "growth", task: "preview", category: preview.category, amountCents: toCents(preview.amount) }, txns),
    [cfg, txns, preview]
  );

  if (!hydrated) return null;

  const pct = cfg.monthlyCapCents > 0 ? Math.min(100, Math.round((spent / cfg.monthlyCapCents) * 100)) : 0;

  return (
    <section className="rounded-2xl glass-panel p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><WalletIcon size={18} /> Business Wallet</h2>
      <p className="mt-1 text-sm text-muted">
        Fund it once; the crew spends within your limits — domains, hosting, ads, APIs, tools. Every
        spend is attributed to an agent + task, logged, and refundable. Pause or revoke anytime.
      </p>

      {/* status flags */}
      {(cfg.paused || cfg.revoked) && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm text-text">
          <AlertTriangle size={14} /> {cfg.revoked ? "Agent spending is revoked — no spend will clear." : "Spending is paused."}
        </div>
      )}

      {/* balance + this-month */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Spendable balance</div>
          <div className="mt-1 font-display text-2xl font-bold">{usd(balance)}</div>
          <div className="text-[11px] text-muted-2">of {usd(cfg.fundedCents)} funded</div>
        </div>
        <div className="rounded-xl bg-surface/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Spent this month</div>
          <div className="mt-1 font-display text-2xl font-bold">{usd(spent)}</div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-text" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] text-muted-2">cap {usd(cfg.monthlyCapCents)}</div>
        </div>
        <div className="rounded-xl bg-surface/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Controls</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => save(cfg.paused ? resume(cfg) : pause(cfg))}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text"
            >
              {cfg.paused ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause</>}
            </button>
            {cfg.revoked ? (
              <button onClick={() => save(reinstate(cfg))} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text">
                <ShieldCheck size={11} /> Reinstate
              </button>
            ) : confirmRevoke ? (
              <button onClick={() => { save(revoke(cfg)); setConfirmRevoke(false); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text">
                <ShieldOff size={11} /> Confirm revoke
              </button>
            ) : (
              <button onClick={() => setConfirmRevoke(true)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text">
                <ShieldOff size={11} /> Revoke
              </button>
            )}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {alerts.map((a) => (
            <div key={a.scope} className={`text-[11px] ${a.level === "critical" ? "text-text" : "text-muted"}`}>
              {a.level === "critical" ? "🔴" : "🟡"} {a.scope === "monthly" ? "Monthly" : a.scope} budget at {a.pct}% ({usd(a.usedCents)} / {usd(a.capCents)})
            </div>
          ))}
        </div>
      )}

      {/* limits */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <LimitInput label="Per-transaction cap" cents={cfg.perTransactionCapCents} onSet={(d) => setCap("perTransactionCapCents", d)} />
        <LimitInput label="Monthly cap" cents={cfg.monthlyCapCents} onSet={(d) => setCap("monthlyCapCents", d)} />
        <LimitInput label="Auto-approve under" cents={cfg.autoApproveUnderCents} onSet={(d) => setCap("autoApproveUnderCents", d)} hint="Spends at/above this ask you first" />
      </div>

      {/* category budgets */}
      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-2">Category budgets (optional, monthly)</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-4">
          {BUDGET_CATS.map((cat) => (
            <LimitInput key={cat} label={cat} cents={cfg.categoryBudgetsCents[cat] ?? 0} onSet={(d) => setCatBudget(cat, d)} placeholder="none" />
          ))}
        </div>
      </div>

      {/* live decision preview — makes the limits tangible */}
      <div className="mt-5 rounded-xl border border-border bg-bg/40 p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-2">Test a spend</div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-2">$</span>
          <input value={preview.amount} onChange={(e) => setPreview({ ...preview, amount: e.target.value })} className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none" aria-label="Preview amount" />
          <span className="text-muted-2">on</span>
          <select value={preview.category} onChange={(e) => setPreview({ ...preview, category: e.target.value as SpendCategory })} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none" aria-label="Preview category">
            {SPEND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${previewDecision.verdict === "auto" ? "bg-mint/12 text-mint" : previewDecision.verdict === "approve" ? "bg-amber/12 text-amber" : "bg-coral/10 text-coral"}`}>
            {previewDecision.verdict === "auto" ? "auto-approved" : previewDecision.verdict === "approve" ? "asks you first" : "blocked"}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-muted-2">{previewDecision.reason} <span className="opacity-70">(assuming the wallet is funded)</span></div>
      </div>

      {/* funding — the escalation */}
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-bg/40 p-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-muted-2" />
        <div className="text-[11px] leading-relaxed text-muted-2">
          <span className="font-medium text-muted">Funding requires you.</span> Adding real money runs through a
          secure payment processor (Polar / Stripe) and needs identity/merchant verification — the one part
          of the wallet only you can set up. Once funded, everything above operates autonomously within your limits.
        </div>
      </div>

      {/* transaction log */}
      <div className="mt-6">
        <div className="text-sm font-semibold">Transaction log</div>
        {txns.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-2">
            No agent spending yet. Every spend the crew makes appears here — agent, task, category, amount, and status — fully attributable.
          </div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {txns.slice(0, 12).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3 py-2 text-[12px]">
                <div className="min-w-0">
                  <span className="font-medium capitalize">{t.agent}</span> · {t.task} <span className="text-muted-2">· {t.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted">{usd(t.amountCents)}</span>
                  <span className="rounded bg-bg/60 px-1.5 py-0.5 text-[10px] text-muted-2">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LimitInput({ label, cents, onSet, hint, placeholder }: { label: string; cents: number; onSet: (dollars: string) => void; hint?: string; placeholder?: string }) {
  const [v, setV] = useState(cents > 0 ? (cents / 100).toString() : "");
  useEffect(() => { setV(cents > 0 ? (cents / 100).toString() : ""); }, [cents]);
  return (
    <label className="block">
      <span className="text-[11px] capitalize text-muted-2">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-border bg-surface px-2">
        <span className="text-sm text-muted-2">$</span>
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => onSet(v)}
          placeholder={placeholder}
          inputMode="decimal"
          className="w-full bg-transparent px-1.5 py-1.5 text-sm outline-none"
        />
      </div>
      {hint && <span className="mt-0.5 block text-[10px] text-muted-2">{hint}</span>}
    </label>
  );
}
