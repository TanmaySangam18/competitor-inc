// Proof-type tagging — turn a raw receipted activity into a scannable proof TYPE for the ledger.
// Pure + testable. Two axes:
//   - label : the FORM of evidence in plain words (a live link, a shipped build, a verified number)
//   - ring  : WHOSE proof it is. Today the board is Ring-0 ONLY (competitor.inc's own dogfood), so
//             everything is "ours"; consent-gated CUSTOMER cards (Ring 2) tag "customer" when that
//             surface ships. Kept explicit now so flipping the board public stays honest by default.

export type ProofRing = "ours" | "customer";

export interface ProofType {
  label: string; // short chip, e.g. "Live link"
  ring: ProofRing;
}

export function classifyProof(
  proofKind: "url" | "build" | "metric" | null,
  action: string,
  ring: ProofRing = "ours"
): ProofType {
  const a = (action || "").toLowerCase();
  let label: string;
  if (proofKind === "build") label = "Shipped build";
  else if (proofKind === "metric") label = "Verified metric";
  else if (proofKind === "url") {
    label = /email|outreach|sent|campaign|message/.test(a) ? "Delivered message" : "Live link";
  } else label = "Receipt";
  return { label, ring };
}
