# Plan — Autonomy engine (the generalizable per-company operating loop)

## Context (why)
The 40k mission needs ONE reliable per-company operating loop that generalizes. The audit (2026-07-08) found
**~70% already exists, real + tested + in prod (flag-gated):** `supervisor.ts` (decompose → task → verify →
escalate → terminate+refund), `agent-lifecycle.ts` (state machine + budget + refund), `task-queue.ts` (DAG +
cycle detection), `sub-agent-executor.ts` (spawn/budget/blocking), `verifyProof`/`verifySiteLive`/`makeBuildExecute`
(verify-before-done), `policy.ts` (5 gates + per-agent matrix + spend caps + kill switch + forbidden floor),
`accountability-spine.ts` (prepared packets → human), `operating-loop.ts` (memory + cycle-level self-heal,
`SUPERVISED_CYCLE=1`). This plan closes the gaps that make the loop **more reliable and more hands-off** — the
biggest lever toward "runs many companies unsupervised" — without breaking any governance invariant.

## Invariants (NEVER break — property-tested)
generator ≠ evaluator (verifier differs from producer, even on retry) · no proof → not "done" · money +
forbidden actions NEVER auto · hard spend caps enforced at the executor · kill switch halts everything ·
gated/irreducible acts escalate to the human spine. Anything that *widens* autonomy ships behind a flag,
default off.

## Slices (value × safety order)
- **Slice 1 ✅ SHIPPED (2026-07-08, commit b450cc4, QA-green 603 tests):** per-task **self-repair** in `runSupervisor`.
  Today a task runs `execute()` once; a failed verification cascades the whole goal to fail. Add a **bounded
  retry loop** (default 2) that, on verification failure, re-runs with **diagnostic feedback** ("prior proof
  failed: <why> — produce a valid, verified proof"), keeps the verifier distinct, and stays budget-bounded
  (recordSpend still caps it). Files: `lib/engine/supervisor.ts` + `supervisor.test.ts`. No new autonomy, just
  fewer spurious failures (e.g., a URL not live yet → retry, not fail).
- **Slice 2: sub-agent dispatch from the supervisor.** Sub-agents exist + are tested but run in isolation. When
  a task's role has templates (`getSubAgentTemplates`), the supervisor spawns them (`executeSubAgentsSequential`),
  aggregates their status into the `TaskResult`, and rolls their spend into the instance budget. Files:
  `supervisor.ts` (dispatch seam) + tests. Deeper per-role decomposition; still deterministic.
- **Slice 3 (most sensitive — the autonomy widener): tiered auto-approval + promotion-on-evidence.** Add a
  `SAFE_AUTO` path: an action *type* promotes `APPROVE → AUTO` only after N clean nights
  (`policy.rollout.promoteAfterCleanNights`, counter wired in cron), and **reverts to APPROVE on any incident**.
  Eligibility is hard-fenced: money, payments, forbidden, and irreversible actions are **never** eligible;
  kill switch overrides; all 5 gates still apply. Behind a flag (default off). Files: `policy.ts` (eligibility +
  counter), cron wiring, a `promotion_records` store (new migration), tests locking the fences.
- **Slice 4 (later): converge `runShift` ↔ `runOperatingCycle`** and exercise the **handoff data flow**
  (build produces the artifact → launch consumes it) with the real full-stack builder now that #1 works.

## Verification
`npm run qa` green each slice. Property/honesty tests must still pass (verifier≠producer, no-proof-no-done,
money-never-auto, caps, kill switch). Slice 3's fences (money/forbidden/irreversible never AUTO; incident →
revert) get dedicated invariant tests. Flag-gate Slice 3; verify the flag-off path is unchanged.
