# Playbook: Conversion Gating — where auth walls and paywalls go (and where they must NOT)

**Standing lens (2026-07-03).** Every gate on competitor.inc — "sign up first?", "pay first?", "connect
an account?" — gets decided against this playbook, and every inch of the funnel is audited against it.
The default answer to "shouldn't we gate here?" is usually **no** — gates are conversion taxes; each one
must earn its place.

**Sources:** Product-Led Growth (Wes Bush / OpenView — value before capture) · Levels/Walling (give the
win first, monetize the expansion) · The Mom Test commitment ladder (ask for costly commitment only
after value is proven) · our own positioning ([[positioning-and-ppu]] validate-first) and honesty
invariant ([[crack-audit-and-no-fake-proof]]).

---

## The three rules

**Rule 1 — Never wall the aha.** The first taste of core value must be reachable with zero friction. For
us the aha is the **honest validation verdict**. No signup, no card, no "connect" before it. Walling the
aha is the single most common way to kill a PLG funnel — and it directly contradicts "validate free."

**Rule 2 — Ask for the account at peak intent, not before.** The signup moment is *after* the user has
something worth keeping (a validated idea, a company) — the natural "save this" beat. A soft prompt, never
a wall; guest can keep exploring.

**Rule 3 — Paywall the expanded value, and only after the value is felt.** Charge where the agents do
real, costly, on-their-behalf work — and place the wall *after* they've watched that value happen, so the
payment feels earned (endowment effect), not extracted. Never charge before we can both **deliver** and
(F1 reality) **collect**.

### The honesty overlays (non-negotiable)
- A gate must never imply a capability we don't have or a charge we can't honor. If billing isn't live,
  show **no paywall** (don't threaten a wall that isn't real).
- Set the expectation *before* a wall so it's never a surprise at the door.
- Never fabricate scarcity/urgency to force a gate.

---

## The canonical funnel + where each gate belongs

| Stage | Gate? | Correct placement | Anti-pattern (do NOT do) |
|---|---|---|---|
| Land on site | none | — | splash/email wall before the pitch |
| **Validate an idea** (the aha) | **none** | fully open, guest-friendly | "sign up to validate" ← the funnel-killer |
| After the verdict | **soft signup** | "create a free account to save + build" (guest can ignore) | hard signup wall |
| Approve build | **expectation-set only** | tell them building is free + opening the live link is the paid unlock | a blocking "pay now" popup at approve |
| Watch the crew build | none | value delivery in the open | — |
| **Open the live site** | **paywall** (when billing live) | pay-to-reveal — value already felt | paywalling before they've seen it built |
| Run it nightly / operate | plan-gated | Operator+ tier | — |
| Consequential action (send/post/spend/deploy) | **human approval** (not a paywall) | Approval Inbox / "approved" in chat | auto-acting (that's Polsia's flaw) |

Note the **two distinct kinds of gate**: a **paywall** (money, at expanded value) and a **governance
gate** (a human yes on consequential actions — the moat). Never confuse them; the approval gate is not a
monetization point.

---

## Applying it to the two questions that prompted this (verdict)

**"Require signup/login to validate?" → NO.** That violates Rule 1 and our positioning. We already do it
right: validation is open; `GuestSavePrompt` asks for the account *after* the verdict ("save this + build,
free, no card"). Keep it. *(Real dependency: signup itself only completes once Supabase auth providers are
enabled — the keystone. Until then the prompt leads to a sign-in that can't finish; that's a founder-key
gap, not a placement error.)*

**"Pop up 'you'd have to pay' when they approve build?" → NO popup; YES expectation.** The paywall already
exists — deliberately at **reveal** (open the live link), not at approve-build, because watching the build
is the value that earns the payment (pay-to-reveal, [[pay-to-reveal-funnel]]). A blocking pay-popup at
approve would move the wall *ahead* of the value (worse conversion) and, right now, charge before the
founder can legally collect (F1) — billing is intentionally off pre-launch. **The real gap the instinct
found is expectation-setting:** so we added one honest line at the gate ("building is free; opening the
live link is the paid unlock") — shown only when billing is live, so the free pre-launch stays wall-free.

---

## Audit — every gate today (2026-07-03)

| Gate | Where | Verdict |
|---|---|---|
| Validation open to guests | onboarding → `/api/demand`, no auth | ✅ correct (Rule 1) |
| Signup ask after verdict | `GuestSavePrompt` @ Validation Gate | ✅ correct (Rule 2) — ⚠️ depends on auth keystone to actually complete |
| Approve-build expectation-set | Validation Gate, `billingLive()`-gated | ✅ added this pass |
| Pay-to-reveal at open-live-site | Operating, `entitled`/`billingLive()` | ✅ correct (Rule 3, endowment) |
| No paywall while billing off | `billingLive()` false → `entitled` = everyone | ✅ honest (no threatened wall) |
| Founder $0 full access | `isFounderEmail` bypass | ✅ correct (dogfood) |
| Consequential actions | Approval Inbox + "approved" in chat | ✅ governance gate, not a paywall |
| Own-your-code doors | live-product card | ✅ value-add, ungated |
| House / founder tools | allow-list + secret | ✅ correct (private surface) |

**Open gaps (tracked, not placement errors):** (1) signup completion is blocked on the Supabase auth
keystone; (2) Phase-2 ad connect stays founder-approval-gated ([[phase2-ads-governance]]).

---

## How to use this going forward
Before adding OR removing any gate anywhere on the platform, name which rule it serves, confirm it's not
an anti-pattern, and check both honesty overlays. If a gate sits before the aha, it's almost always wrong.
When in doubt: **value first, capture second, govern the dangerous, wall the expansion.**
