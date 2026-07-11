# Architect Knowledge — standing on the public frontier (P0)

> The ladder's compressor. We do **not** recapitulate the giants' 30-year journey — we start from its
> published endpoint. The architectural lessons behind Copilot-class products are downloadable; **proof is
> not**, which is why real receipts remain the gates.

**Canonical source:** the string actually injected into every build brief lives in
[`lib/engine/architect-knowledge.ts`](../lib/engine/architect-knowledge.ts) (`architectKnowledge()`).
A test (`architect-knowledge.test.ts`) pins the invariants so this doc and the injected directive cannot
silently drift. This file is the narrative; that file is the source of truth.

## Why this exists

A single prompt→build cycle is only as good as what the model already knows plus what the brief tells it.
The model was trained on humanity's public engineering output — so every build already starts near the state
of the art. This module makes that explicit and consistent: the few principles that most separate a
Copilot-class product from a toy are stated in every brief, every time.

## The five standing invariants

1. **Grounding — cite or abstain.** Any feature that answers questions from data retrieves first and answers
   *only* from what it retrieved, citing sources. No relevant record → say so. A confident wrong answer is the
   worst possible outcome. (This is the exact contract the [Synthetic Proving Ground](../lib/sim/proving-ground.ts)
   enforces before any grounded feature is claimed.)
2. **Tenant isolation — deny by default.** Every read is scoped to the current user/workspace first. One
   user's query can never reach another's rows. Supabase persistence leans on RLS keyed to `auth.uid`; no
   service-role key in a user-facing path.
3. **Verify before done.** Not done until it demonstrably runs: real persistence, real empty/loading/error
   states, clean production build, no console errors. Boring patterns that work beat clever ones that might.
4. **Adopt, don't invent.** Proven, license-clean building blocks before bespoke infrastructure. Every line
   you don't invent can't regress. (Adopt-list for higher rungs: pgvector for the semantic index, the
   platform's own auth/storage, well-trodden RAG stacks.)
5. **Input discipline.** Validate and type every input at the boundary; fail closed (4xx, never a 500 or a
   silent wrong write).

## How it's wired

`fullstackPromptFile(goal)` prepends `architectKnowledge()` to the per-product brief, so the implementing
agent (and the Design-Lead review pass) both build against these principles. Higher rungs (R10 grounded
features, S3+ SaaS) extend the brief but never drop these invariants.

## Honest limits (what no public corpus provides)

- The giants' **moat-data** (hundreds of millions of seats of private tenant content) — our substrate fills
  only with real customers.
- Their **operational scars** (edge cases living in private incident logs) — re-earned from our own users.
- **Trust & distribution** (certs, contracts, installed base) — not downloadable; earned.
