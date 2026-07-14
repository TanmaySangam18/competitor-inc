// lib/core/dsr.ts — DATA-SUBJECT REQUESTS: export + delete (Tier D · REQUIREMENTS §8, ORG #56 Data Steward).
//
// GDPR/CCPA-grade per-customer data handling. Export ASSEMBLES a customer's data into one bundle (the
// gather function is injected — real per-tenant reads wire at connect; fail-soft to an empty bundle).
// Deletion is NEVER executed autonomously: it is Tier 3 (irreversible) — planDeletion returns the ordered
// plan + requiresHuman, and the actual erase runs only after a human sign-off through govern(). The Data
// Steward owns retention; every deletion execution is logged (audit).

export interface ExportBundle {
  customer: string;
  generatedAt: string;
  sections: Record<string, unknown>;
  note: string;
}

// Assemble everything held for a customer. `gather` yields the real per-tenant data at connect; without it
// the bundle is honestly empty (never fabricated).
export function exportData(
  customer: string,
  gather?: (customer: string) => Record<string, unknown>,
  at: Date = new Date(),
): ExportBundle {
  let sections: Record<string, unknown> = {};
  let note = "assembled from connected stores";
  try {
    sections = gather ? gather(customer) : {};
    if (!gather) note = "no data source connected — empty bundle (nothing fabricated)";
  } catch {
    sections = {};
    note = "a data source failed — partial/empty bundle (fail-soft, not fabricated)";
  }
  return { customer, generatedAt: at.toISOString(), sections, note };
}

export interface DeletionPlan {
  customer: string;
  steps: string[];
  tier: "T3"; // irreversible — always human sign-off
  requiresHuman: true;
}

// The ordered erase plan for a customer. Returned for review, NOT executed — deletion is human-reserved.
export function planDeletion(customer: string): DeletionPlan {
  return {
    customer,
    steps: [
      `Freeze the ${customer} namespace (kill switch) so nothing new is written`,
      "Export a final bundle for the customer's records (data-export guarantee)",
      "Erase per-tenant rows under RLS: documents, records, memory, logs (except the append-only audit trail required for legal discovery)",
      "Revoke the customer's scoped vault tokens",
      "Confirm erase + record completion in the audit ledger",
    ],
    tier: "T3",
    requiresHuman: true,
  };
}
