import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_WALLET, type WalletConfig, type WalletTxn, type TxnStatus, type SpendCategory } from "./wallet";
import type { AgentRole } from "./types";

// Server-side wallet access for the autonomous loop (cron) + /api/execute. Fail-SAFE by design: if
// there's no wallet row (not funded/configured) or Supabase is down, we return an UNFUNDED default —
// which makes decideSpend block every real spend. The crew can never spend money the founder hasn't
// funded, even if a wallet was never set up. Money is cents end-to-end.

/* ── pure mappers (unit-testable, no I/O) ─────────────────────────────────── */

// A wallet row → config. Missing/garbage row → the unfunded DEFAULT (spend blocks). Never throws.
export function walletRowToConfig(row: Record<string, unknown> | null | undefined): WalletConfig {
  if (!row) return { ...DEFAULT_WALLET };
  const int = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const budgets = (row.category_budgets_cents ?? {}) as Partial<Record<SpendCategory, number>>;
  return {
    fundedCents: int(row.funded_cents, 0),
    perTransactionCapCents: int(row.per_transaction_cap_cents, DEFAULT_WALLET.perTransactionCapCents),
    monthlyCapCents: int(row.monthly_cap_cents, DEFAULT_WALLET.monthlyCapCents),
    autoApproveUnderCents: int(row.auto_approve_under_cents, DEFAULT_WALLET.autoApproveUnderCents),
    categoryBudgetsCents: typeof budgets === "object" && budgets ? budgets : {},
    paused: !!row.paused,
    revoked: !!row.revoked,
  };
}

export function txnRowsToTxns(rows: Array<Record<string, unknown>> | null | undefined): WalletTxn[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    id: String(r.id ?? ""),
    agent: (r.agent ?? "engineering") as AgentRole,
    task: String(r.task ?? ""),
    category: (r.category ?? "other") as SpendCategory,
    amountCents: typeof r.amount_cents === "number" ? r.amount_cents : 0,
    vendor: (r.vendor as string) ?? undefined,
    description: (r.description as string) ?? undefined,
    status: (r.status ?? "pending") as TxnStatus,
    refundCents: typeof r.refund_cents === "number" ? r.refund_cents : undefined,
    createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
    month: String(r.month ?? new Date().toISOString().slice(0, 7)),
  }));
}

/* ── async load / record (fail-safe) ──────────────────────────────────────── */

export interface LoadedWallet {
  walletId: string | null;
  config: WalletConfig;
  txns: WalletTxn[];
}

export async function loadWallet(sb: SupabaseClient, companyId: string): Promise<LoadedWallet> {
  try {
    const [w, t] = await Promise.all([
      sb.from("wallets").select("*").eq("company_id", companyId).maybeSingle(),
      sb.from("wallet_transactions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
    ]);
    return {
      walletId: (w.data?.id as string) ?? null,
      config: walletRowToConfig(w.data as Record<string, unknown> | null),
      txns: txnRowsToTxns(t.data as Array<Record<string, unknown>> | null),
    };
  } catch {
    // Fail-safe: unfunded default → every real spend blocks.
    return { walletId: null, config: { ...DEFAULT_WALLET }, txns: [] };
  }
}

async function recordWalletTxn(
  sb: SupabaseClient,
  companyId: string,
  walletId: string,
  txn: WalletTxn
): Promise<void> {
  try {
    await sb.from("wallet_transactions").insert([
      {
        id: txn.id,
        wallet_id: walletId,
        company_id: companyId,
        agent: txn.agent,
        task: txn.task,
        category: txn.category,
        amount_cents: txn.amountCents,
        vendor: txn.vendor ?? null,
        description: txn.description ?? null,
        status: txn.status,
        refund_cents: txn.refundCents ?? null,
        month: txn.month,
      },
    ]);
  } catch (e) {
    console.error("[wallet-db] recordWalletTxn failed:", e instanceof Error ? e.message : "unknown");
  }
}
