# Revenue Run — aim the machine at the first Proven Paying User

The build phase is largely done (governance spine + measurement + proof surface, all live). This is the
*run*: the smallest real loop that turns the machine into the first dollar. **North Star = PPU** (a user
on a paid plan WITH a verified, receipted outcome) — not signups. Target: first PPU, then 50–150.

## The one loop
`build something real → receipt it → the receipts are the marketing → trust converts → PPU → case study → repeat.`
The AI runs the loop at ~$0 and 24/7. The human supplies the keys, the merchant identity, the approvals,
and the will. Money happens where cheap honest receipts meet real demand.

## Who does what (classified by the five-gate filter)

### Step 0 — Founder unlock (ONLY you — "can it act?" + "who's liable?")
Nothing below is real until these are on. These are credentials + legal identity; an AI can't hold them.
- **GITHUB_TOKEN + VERCEL_DEPLOY_HOOK_URL** → the agents can ship a *real* artifact → the first receipt.
- **STRIPE_SECRET_KEY + STRIPE_PRICE_ID** (you = merchant of record) → can take a real payment.
- **RESEND_API_KEY + RESEND_FROM** on a *warmed* domain → can send compliant email.
- Then **approve the first real sends/deploys** in the Approval Inbox.

### Step 1 — First real receipt (dogfood) — AI builds, founder approves the deploy
Agents build + ship ONE small, genuinely useful **free tool that is also top-of-funnel** (e.g. a free
"idea demand-test" micro-tool): a real GitHub repo + a live URL. That live URL becomes the **first card on
the proof board** — checkable, not claimed. *Build/preview = AUTO; deploy to prod = APPROVE.*

### Step 2 — Demand tests across 3 channels — bounded + compliant
Small, real tests on three **compliant** channels (a relevant community post; warm/opted-in outreach; one
bounded paid test). Funnel data — not opinion — picks the one channel that converts. *Drafting/scheduling/
analysis = AUTO; any send/post/spend = APPROVE; spend capped at $50/txn by policy.*

### Step 3 — Convert to PPU — founder is the merchant
Point the winning channel at the free tool → free user → paid Operator → a real verified outcome (a
shipped MVP / live deploy) = **one PPU**. **Cost-per-PPU is the governor**; a channel over target gets cut.

### Step 4 — Case study from the receipt — AI drafts, founder approves
Every verified outcome → a redacted proof card + a short case study. **The marketing IS the receipts.**

## Guardrails (already enforced in code — lib/engine/policy.ts + /api/execute)
- **Lawful:** opted-in only, unsubscribe, real sender identity. No cold blasts (CAN-SPAM/GDPR + domain survival).
- **Bounded:** per-transaction + daily + monthly spend caps; kill switch.
- **Observable:** real-time alerts on cap_breach / failure / forbidden_attempt.
- **Reversible / Never:** nothing irreversible auto-runs; move-funds / sign-contract / mass-DM / scrape are forbidden.

## Kill rules (so we don't fool ourselves)
- A channel above the cost-per-PPU target after N tests → cut it.
- **No real receipts within ~1 week of keys-on → the problem is execution, not marketing** — diagnose there first.
- PPU flat after a working channel is found → it's a *value/delivery* problem, not a traffic problem.

## What the AI will NOT do
Fabricate a receipt or a "paying customer." The proof board shows only real, re-verified, live-executor
outcomes. If PPU is 0, it reads 0. Honesty is the product.
