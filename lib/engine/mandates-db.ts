import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerMandate, MandateAct } from "@/lib/org/customer-mandate";

// Persistence for the customer's standing mandate (migration 0027). The deny-by-default core holds at
// the storage layer too: NO ROW ⇒ unsigned mandate ⇒ decideMandate holds everything as needs-you. The
// owner signs/updates via their RLS session (/api/mandate); the cron reads via the service role before
// applying any recorded decision unattended.

interface MandateRow {
  company_id: string;
  user_id: string;
  signed_at: string | null;
  scopes: unknown;
  monthly_spend_cap_cents: number;
  kill_switch: boolean;
}

function toMandate(r: MandateRow): CustomerMandate {
  return {
    signedAt: r.signed_at ? Date.parse(r.signed_at) || null : null,
    scopes: Array.isArray(r.scopes) ? (r.scopes as MandateAct[]) : [],
    monthlySpendCapCents: r.monthly_spend_cap_cents ?? 0,
    killSwitch: !!r.kill_switch,
  };
}

// The UNSIGNED mandate — what a company has before its human signs (or after a revoke): nothing runs.
export const UNSIGNED: CustomerMandate = { signedAt: null, scopes: [], monthlySpendCapCents: 0, killSwitch: false };

// Load a company's mandate. null row ⇒ UNSIGNED (deny-by-default). Throws only on a hard DB error the
// caller should see (the cron treats any throw as UNSIGNED too — an outage can never widen authority).
export async function loadMandate(client: SupabaseClient, companyId: string): Promise<CustomerMandate> {
  const { data, error } = await client.from("customer_mandates").select("*").eq("company_id", companyId).maybeSingle();
  if (error) throw new Error(`loadMandate: ${error.message}`);
  return data ? toMandate(data as MandateRow) : UNSIGNED;
}

// Sign (or re-sign / update) the mandate — the owner's ONE signature. Upsert keyed by company.
export async function saveMandate(
  client: SupabaseClient,
  userId: string,
  companyId: string,
  mandate: CustomerMandate,
): Promise<void> {
  const { error } = await client.from("customer_mandates").upsert({
    company_id: companyId,
    user_id: userId,
    signed_at: mandate.signedAt ? new Date(mandate.signedAt).toISOString() : null,
    scopes: mandate.scopes,
    monthly_spend_cap_cents: mandate.monthlySpendCapCents,
    kill_switch: mandate.killSwitch,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`saveMandate: ${error.message}`);
}
