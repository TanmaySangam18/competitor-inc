# Agent audit — competitor.inc (brutally honest)

Per the Founder OS charter: don't assume any in-house agent deserves to exist. For each, the test —
what does it do, which customer outcome + metric depends on it, would anyone notice if it vanished, can
it merge/simplify — and a verdict: **KEEP / MERGE / REWRITE / SIMPLIFY / REMOVE**.

**Headline:** the crew is **already lean**. There are exactly **5 core agents** (`AgentRole` =
ceo·engineering·marketing·support·growth), plus 2 deterministic per-company specialists (`crew.ts`). The 3D
"Delegation" floor (`delegation.ts`) is a *render* of the same 5 — not extra agents. The generator/evaluator
"verifier" is a *duty* on Apex + Guard, not a separate agent. So there's nothing to REMOVE — the honest
risk here is the opposite of bloat: resisting the urge to *add* agents when **playbooks** are the better
investment (see the strategic note at the end).

| Agent | Role | What it does | Metric it defends | Verdict |
|---|---|---|---|---|
| **Apex** | Strategy (ceo) | Strategy + unit economics; the "build / don't / cut" verdict; **independent evaluator** of other agents' work | Customer ROI, Defensibility | **KEEP** — it *is* the validate-first wedge + the loop-engineering separation |
| **Forge** | Engineering | Ships the smallest real version of the winner; **verify-before-done** | Activation, Revenue | **KEEP** — no Forge, no product; "ships only the winner" depends on it |
| **Pitch** | Marketing | Runs **real demand tests**, finds the one channel, owns activation/"aha" | Activation, Revenue | **KEEP** — the demand test is the core wedge; highest-value agent for first-time founders |
| **Surge** | Growth | Distribution, referral loops, the launch blitz, drafts demand-capture posts | Activation, Retention | **SIMPLIFY (watch)** — real overlap with Pitch (both touch demand/posts). See below |
| **Guard** | Support | Handles users (refunds, can't touch payments); **read-only verifier** of shipped work + outgoing messages | Retention, Defensibility | **KEEP** — but its *support* duty is dormant pre-launch; its *verifier* duty is the active value now |
| **Specialists** | per-company (crew.ts) | 2 bespoke roles per domain (e.g. Compliance Lead, Supply Scout) | Activation, Defensibility | **KEEP** — cheap, deterministic, makes "run ANY company" real inside the niche; ~0 maintenance |

## The one real finding: Pitch ↔ Surge overlap
Marketing (Pitch) and Growth (Surge) both touch "demand" and "drafting posts," and to a first-time founder
that distinction is fuzzy. Two honest options:
- **SIMPLIFY (recommended):** sharpen the boundary in copy — **Pitch = *pre-launch*, prove demand exists;
  Surge = *post-launch*, compound it (referral/word-of-mouth loops).** Keeps both identities (both are
  on-brand and map to distinct playbooks: Traction vs Hacking Growth) while removing the blur.
- **MERGE:** fold Surge into one "GTM/Growth" agent. Cleaner count, but loses the crisp "validate first"
  (Pitch) vs "grow what's launched" (Surge) story, and Surge has little to do until there's a launched
  product anyway. Reconsider a merge only if, post-launch, the two never act distinctly.

I'm **not** churning carefully-tuned agent copy this turn for a cosmetic overlap — that's its own
complexity. Flagged as the next copy pass; founder's call on SIMPLIFY vs MERGE.

## Strategic conclusion (the charter's "playbooks > more agents")
The crew is the right size. The leverage is **not** more or fewer agents — it's giving the 5 we have
**elite, battle-tested playbooks** to execute, and exposing those to customers. Next investment should be
the **playbook library**, not roster changes. Adding agents from here would be complexity-debt; subtracting
any would cost a customer outcome. **Hold the line at 5 + specialists.**
