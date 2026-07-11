// ─────────────────────────────────────────────────────────────────────────────
// ARCHITECT KNOWLEDGE (P0 — "stand on the public frontier") — the ladder's compressor.
//
// We do NOT recapitulate the giants' 30-year journey; we start from its published endpoint. The hard-won
// architectural lessons behind Copilot-class products (permission-trimmed retrieval, cite-or-abstain
// grounding, per-tenant isolation, verification that compounds, adopt-don't-invent) are downloadable — so
// they become the Architect agent's STANDING knowledge, injected into every build brief. Proof is not
// downloadable; that is why receipts remain the gates ([[capability-launch-directive]]).
//
// This is the single source of truth for that injected block. The narrative lives in docs/ARCHITECT-KNOWLEDGE.md;
// the STRING below is what actually reaches the model. A test pins the load-bearing invariants so the doc
// and the injected directive can never silently drift.
// ─────────────────────────────────────────────────────────────────────────────

// The load-bearing invariants — asserted by the test, referenced by R10's grounded-feature brief.
export const ARCHITECT_INVARIANTS = {
  citeOrAbstain: "cite-or-abstain",
  tenantIsolation: "tenant-isolation",
  denyByDefault: "deny-by-default",
  verifyBeforeDone: "verify-before-done",
  adoptDontInvent: "adopt-don't-invent",
} as const;

// A compact, high-signal directive block. Kept tight on purpose — a wall of text degrades one-shot builds;
// these are the few principles that most separate a Copilot-class product from a toy.
export function architectKnowledge(): string {
  return [
    `ARCHITECT KNOWLEDGE (standing principles — build to these, they are graded):`,
    ``,
    `• GROUNDING (cite-or-abstain): any feature that answers questions from data must retrieve first and`,
    `  answer ONLY from what it retrieved, citing the source records. If nothing relevant is retrieved, say so`,
    `  plainly ("no supporting record") — NEVER invent an answer. A confident wrong answer is the worst outcome.`,
    `• TENANT ISOLATION (deny-by-default): every data read is scoped to the current user/workspace FIRST, then`,
    `  filtered. One user's query must never be able to reach another's rows. Default to no-access; open access`,
    `  explicitly. When persistence is Supabase, rely on row-level security keyed to auth.uid — never a`,
    `  service-role key in a user-facing path.`,
    `• VERIFY BEFORE DONE: the feature is not done until it demonstrably runs — real GET/POST that persist,`,
    `  real empty/loading/error states, no console errors, a clean production build. Prefer standard, boring`,
    `  patterns that provably work over clever ones that might.`,
    `• ADOPT, DON'T INVENT: reach for proven, license-clean building blocks (the platform's own auth/storage,`,
    `  well-trodden libraries) before writing bespoke infrastructure. Every line you don't invent is a line`,
    `  that can't regress.`,
    `• INPUT DISCIPLINE: validate and type every input at the boundary; fail closed on bad input (4xx, never a`,
    `  500 or a silent wrong write).`,
  ].join("\n");
}
