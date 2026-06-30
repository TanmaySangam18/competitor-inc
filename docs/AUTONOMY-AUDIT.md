# The Autonomy Audit — re-score (2026-06-30)

**Playbook:** "The Autonomy Audit" (score the real code, 0=Manual … 4=Fully autonomous) + the Founder
Operating System (every change optimizes the 5 metrics; this one is **Defensibility** — being the
*honest* Level-2 in a field of unsubstantiated "fully autonomous" claims).

**Why now:** the founder un-held the re-score. The first run (2026-06-28) scored **~1.3/4** with a
convergent critical finding: `/api/execute` had *no* server-side auth or approval check — the
human-in-the-loop was a client-side React convention a direct POST could bypass. Since then the
keystone, policy engine, spend caps, alerts, memory read-back, compliance wiring, and ownership
verification all shipped. This re-scores against the code as it stands today.

## Scorecard — now vs. the 2026-06-28 baseline

| System | Was | Now | What changed (honest) |
|---|---|---|---|
| 1 Credentials / access | 1 | **2** | Actions are now per-agent-scoped by the policy matrix (AUTO/APPROVE/NEVER × action), and each founder can run on their **own** BYOK + per-user connections. Still 2, not higher: the server still holds shared god-keys (incl. the service-role key) — true per-agent *credential* isolation is v2. |
| 2 Money authority | 1 | **3** | Spend is now **bounded**, not merely "no path exists": a hard per-transaction cap + daily/monthly accumulator (`spendguard.ts`, recorded on real spend) + a kill switch (`ACTIONS_KILL_SWITCH` / config) + a forbidden floor (`move_funds_out`), all enforced in `/api/execute` before anything fires. Caveat: the accumulator is best-effort in-memory (per-instance); a durable DB spend-log is v2. |
| 3 Decision authority | 2 | **3** | The **keystone**: `/api/execute` now enforces the approval server-side — an authenticated session that **owns** the company (RLS) + an `approved` approval row matching the action kind. Plus the pure five-gate `decide()` and `governApprovals()`/`governShift()` filtering BLOCKed proposals out of the inbox. Stays 3 by **design** — human-on-the-loop, never L4. Promote-on-evidence *counting* still isn't wired. |
| 4 Compliance | 1 | **3** | CAN-SPAM footer (sender identity + opt-out) in the live send path; consent microcopy on `/join`, the demand-capture form, **and `/signup`**; privacy policy discloses self-enrichment + a "Your rights" (access/correct/delete, MA jurisdiction); terms name a Massachusetts governing law + LemonSqueezy as merchant-of-record; `channels` policy = opted-in-only, no auto-send. Caveat: a written WISP (201 CMR 17.00), a breach plan (M.G.L. 93H), and a lawyer review remain founder/legal items — I am not a lawyer. |
| 5 Observability | 1 | **3** | `raiseAlert()` makes the Glass Box **react**, not just log: real-time alerts on `cap_breach` / `failure` / `forbidden_attempt`, wired into `/api/execute` (refusals + executor errors) and the cron failure-spike. Proof receipts are re-verified on load + redacted. Honest gap: there's still **no true reversal** of a sent email / created repo / triggered deploy (undo is a ledger/UI flag for reversible steps), and side-effecting POSTs are **not** blind-retried (double-send risk) — `apiDown` = alert + pause. |
| 6 Memory / coherence | 1 | **2** | `recall()` is now wired into `runShift` (cron + live), so the write-only diary is **read back** — night-30 can build on night-3. Stays 2: this is semantic recall, not a real **entity graph (BKG)**, and there's no closed-loop outcome *scoring* yet — coherence improved, learning hasn't. |
| 7 Platform / ToS standing | 2 | **3** | **Import ownership-verification** now gates *operating* an imported project (DNS-TXT or a well-known file, per-(user,host) HMAC token — `lib/engine/ownership.ts`); reading/auditing stays open. The `channels` policy forbids mass automated DM; every outbound path stays single-recipient + approval-bound. Gap: human-rate *pacing* (vs. inbound abuse rate-limit) and a ban-recovery runbook are still missing. |

**Composite: ~2.7 / 4** (was ~1.3). The honest headline isn't the number — it's the *kind* of safety.
The first audit's safety was "safe because no execution path exists"; today it's **"safe because the
path is server-enforced and bounded."** That is the difference between a demo and something a founder
can actually leave running.

## The critical finding is resolved

The 2026-06-28 convergent finding — *a direct POST to `/api/execute` bypasses the entire Approval
Inbox* — is **closed**. The route now runs, in order: (1) the always-on **policy floor** (kill switch
→ forbidden floor → per-agent NEVER → hard spend ceiling), then (2) the **approval keystone** (session
+ RLS ownership + approved-row match). This satisfies the standing constraint that gated adding real
execution keys to prod (see `SECURITY-REVIEW.md`). The remaining inertness is intentional: with no keys
set, executors return `{ disabled: true }` and the UI falls back to its simulated view.

## Still honestly Level 2–3 — and that's the position

competitor.inc is **supervised autonomy** (human-*on*-the-loop): it does the work autonomously and
pauses only for one-way doors (real spend over a cap, outbound sends, production deploys, deletes). It
is **not** "fully autonomous," and the product never claims to be. The audit's thesis *is* the pitch:
"runs while you sleep" vs. "asks before anything risky" are in tension, and the honest gap between them
is the moat. We market exactly the level we can server-enforce.

## What would move the remaining numbers (v2, not pre-launch)

- **Sys 1 → 3:** per-agent credential scoping (scoped tokens / least-privilege service roles), so an
  agent can't reach beyond its lane even with a bug.
- **Sys 2 → 4:** durable DB spend-log so caps survive restarts + multi-instance, with an auditable trail.
- **Sys 5 → 4:** real reversal primitives (email cancel-window, repo archive, deploy rollback) so "undo"
  reverses the *world*, not just the ledger.
- **Sys 6 → 3+:** the BKG entity graph + a closed-loop outcome score feeding `promotionEligible()`'s
  clean-night counter — the actual learning loop.
- **Sys 7 → 4:** human-rate pacing on outbound + a documented ban-recovery runbook.

None of these are launch blockers. The launch-blocking item was the keystone, and it's done.

_Related: `AUTONOMY.md` (the philosophy), `SECURITY-REVIEW.md`, `REVENUE-RUN.md`, `MASTER-PLAN.md`._
