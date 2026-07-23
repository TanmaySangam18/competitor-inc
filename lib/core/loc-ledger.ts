// ─────────────────────────────────────────────────────────────────────────────
// THE HONEST LINE LEDGER (ADR-0019). Lets the company claim a code-volume number the RIGHT way —
// EARNED and COUNTED, never asserted. Two separate, labeled buckets so the number can never mislead:
//   • companyZero — lines the AI org shipped building competitor.inc itself (real, countable today)
//   • customerShipped — lines shipped in verified customer-product deployments (0 until real receipts)
//
// This exists specifically so "N lines of code" is a fact off the ledger, not a marketing figure. It
// REFUSES to invent: unknown/negative counts clamp to 0, and the claim string always names provenance
// and the verified-deployment count behind customer lines. No fabricated totals, ever ([[crack-audit
// -and-no-fake-proof]]).
// ─────────────────────────────────────────────────────────────────────────────

export interface LocInput {
  companyZeroLines: number; // measured from THIS repo (scripts count git-tracked source lines)
  customerShippedLines: number; // summed from verified customer deployments only
  verifiedDeployments: number; // how many real customer deploys back the customerShipped number
}

export interface LocTally {
  companyZero: number;
  customerShipped: number;
  verifiedDeployments: number;
  total: number;
  claim: string; // the ONLY string the site should show — provenance baked in
}

const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
const fmt = (n: number) => n.toLocaleString("en-US");

export function locTally(input: LocInput): LocTally {
  const companyZero = clamp(input.companyZeroLines);
  const customerShipped = clamp(input.customerShippedLines);
  const verifiedDeployments = clamp(input.verifiedDeployments);
  const total = companyZero + customerShipped;

  // The claim names exactly where every line came from — earned, not asserted.
  const parts: string[] = [];
  parts.push(`${fmt(companyZero)} lines building competitor.inc itself`);
  parts.push(
    customerShipped > 0
      ? `${fmt(customerShipped)} lines shipped across ${fmt(verifiedDeployments)} verified customer deployment${verifiedDeployments === 1 ? "" : "s"}`
      : "0 customer lines yet — the honest number until a real product ships",
  );
  const claim = `${fmt(total)} lines of code, counted on the ledger: ${parts.join("; ")}.`;
  return { companyZero, customerShipped, verifiedDeployments, total, claim };
}
