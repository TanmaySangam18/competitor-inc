# ADR-0020: The Treasury — per-department budget envelopes ("the bank for the 56")

## Context
Founder: build "a bank for the 56 agents" so they debit/credit to spend and run the company, "so I
need not approve on Slack anymore." The honest core is real; the literal version (agents move real
money with no human) breaks the T3 money floor + the founder's 100% legal accountability.

## Decision
lib/core/treasury.ts: per-department budget ENVELOPES (human sets monthlyCapUsd once = standing
authorization). ruleSpend() is pure + deterministic:
- debit within the envelope AND within the policy per-transaction cap → AUTO, runs SILENTLY (no Slack).
- debit over the envelope OR over the per-transaction cap → ESCALATE (never silent overspend).
- withdraw (funds OUT) → BLOCK: human-only, the treasury records + escalates, never executes. The
  forbidden move_funds_out floor stands; competitor.inc never holds/moves funds — envelopes track
  spend on the customer's OWN connected account.
Composes with existing POLICY spend caps (per-txn/daily/monthly) — envelopes sit UNDER them, never above.
applyDebit/rollMonth/envelopeStatus for accrual, month roll, and the low-balance digest line.

## Consequences
Routine in-budget spend stops pinging the founder — the approval load drops to the irreducible floor
(over-budget + any withdrawal), exactly the ask, via standing authorization not floor-removal. NEXT
(wiring, not this pure core): a treasury table + per-department envelope config on /connect; the spend
executor calls ruleSpend before any charge; envelopeStatus feeds the Slack finance digest; escalations
route to #decisions. Real charges still require the customer's connected Stripe + the human-set caps.
