# QA Remediation Log — Marcus JTBD + Hick's Law audit (2026-06-30)

Source: a 23-bug persona QA report (Marcus Chen, solo technical founder) + a button-density
audit. This log tracks every finding to a status, names assumptions, and lists blockers /
dependencies. Three commits: Sprint 1 `9848f16`, Sprint 2+3 `18ede3a`, follow-ups in this batch.

Standing rule honored throughout: **never fake a number or a link.** Where proof doesn't exist
(metric-only activity, unbuilt product), we say so rather than fabricate a clickable artifact.

---

## Status by bug

| # | Page | Sev | Status | Resolution |
|---|------|-----|--------|------------|
| BUG-13 | settings | 🔴 | ✅ Fixed (S1) | Operator "Upgrade" → live Polar checkout (`checkoutUrlFor`), Founder → /join. No dead buttons. |
| — | / vs settings | 🔴 | ✅ Fixed (S1) | Settings Billing now mirrors the public pricing page exactly (Validate/Operator $39/Founder $299). Killed the stale "Founding $99 once". |
| BUG-12 | settings | 🔴 | ✅ Fixed (S1) | Native `confirm()` (the renderer freeze) → two-step inline confirm. |
| BUG-15 | settings | 🟢 | ✅ Fixed (S1) | Guests see "Guest (local mode)" + Sign-in link, not a bare em-dash. |
| BUG-21/22 | /join | 🟡 | ✅ Fixed (S1) | Empty/invalid email → loud inline error (was a silent `return`). |
| BUG-23 | /join | 🟢 | ✅ Fixed (S1) | Counter refetches after join (no full reload needed). |
| BUG-03 | / | 🟡 | ✅ Fixed (S1) | Feedback widget validates a typed email (still optional if blank). |
| BUG-08 | dashboard | 🟡 | ✅ Fixed (S1) | "Draft launch blitz" flips to "Drafted — see Approval Inbox ✓". |
| BUG-10 | dashboard | 🟡 | ✅ Fixed (S1) | "Advanced · autonomous marketing" gets a rotating chevron affordance. |
| BUG-05/06/07 | /signup | 🟡/🔴 | ✅ Fixed (S2) | Inline email validation on blur, error sits next to the field; server domain-blocks surface in plain language. |
| BUG-18 | /live | 🔴 | ✅ Fixed (S2) | Activity rows with a real resolvable URL proof are clickable ("Open proof ↗"); metric/build proofs stay honest text. |
| BUG-14 | settings | 🟡 | ✅ Fixed (S2) | Self-connectable "Off" cards link to #connect-accounts; operator-level ones explain via tooltip. |
| BUG-17 | /delegation | 🟡 | ✅ Fixed (S2) | "waiting for your ok" badge deep-links to `#approval-inbox`. |
| BUG-01/02 | / | 🟡 | ✅ Fixed (S2) | Homepage demo Approve/Hold buttons now respond + reset (no longer decorative). |
| BUG-16 | /delegation | 🟡 | ✅ Verified | Already guarded (button `disabled` + handler early-return). No change needed. |
| BUG-11 | dashboard | 🟡 | ✅ Fixed (follow-up) | "Shipping your site…" banner now has "Add your keys →" → settings#connect-accounts. |
| BUG-09 | dashboard | 🟡 | ➖ Adequate | Rate-limit message already states reset ("come back tomorrow") + path ("Add your model key in Settings"). Left as-is. |
| — | / nav | 🟡 | ✅ Fixed (S3) | Removed redundant "Sign up free" nav link (Hick's Law); pill is primary, "Sign in" stays. |
| — | global | 🟡 | ✅ Fixed (S3) | Floating Feedback button is icon-only at rest, label on hover. |
| BUG-04 | /how-it-works | 🟢 | ⏸ Deferred | Part of the unified site-header work (below). |
| BUG-19 | /live | 🟡 | 📝 By design | Company cards ARE rendered; they're empty when the local store has no companies (board is localStorage-scoped). Documented, not a defect. Real public proof board ships at launch. |
| BUG-20 | /playbooks | 🟢 | ⏸ Deferred | "Coming soon" paid playbooks → add a notify capture. Low priority. |

**Net: 19 of 23 fixed, 1 verified-already-OK, 1 adequate, 1 by-design, 2 deferred (low-sev).**

---

## Deferred (with rationale)

1. **Unified site-wide header component** (covers BUG-04 + the audit's "navigation inconsistency"
   across /, /how-it-works, /live, /delegation, dashboard). This is a shared `<SiteHeader>` applied
   to ~10 routes. **Deferred to post-launch** — it churns the entire top-of-page surface while we're
   trying to hold a stable funnel for the first users. Low risk to ship later; high risk to ship now.
2. **Move "Re-test demand" + "Draft launch blitz" into a secondary actions menu** (audit Problem A,
   dashboard density 9/10). Moderate-risk restructure of the primary operations row. **Deferred** so
   we can A/B it against the current layout once real users are in — don't redesign the core cockpit
   blind.
3. **BUG-20 playbook notify-capture** — trivial, bundled into the next content pass.

---

## Assumptions made

- **Pricing is the public page's three tiers** (Validate $0 / Operator $39/mo / Founder $299/mo).
  The "Founding $99 once / seats" concept was treated as stale and removed from settings to end the
  trust-breaking mismatch. *If $99 founding seats is a real launch promo, it needs to be added back to
  BOTH surfaces, not just one.*
- **Only `operator` has a live Polar checkout** (`NEXT_PUBLIC_CHECKOUT_URL`). Founder routes to /join
  to apply. If a Founder-tier checkout link is created, set `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER` and it
  lights up automatically (no code change).
- **/live is intentionally workspace-scoped** (localStorage), not a public board yet. The public,
  receipted proof board is a launch deliverable.
- **example.com etc. are blocked by Supabase**, not our code — so we improved the *message*, not the
  block.

---

## Blockers / dependencies to resolve (owner: founder)

| Dependency | Needed for | Status |
|---|---|---|
| **OPT / EAD work authorization** | Turning the (now-working) checkout into banked revenue | ⛔ Blocking — apply now |
| `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER` | Founder-tier in-app checkout (else routes to /join) | Optional |
| Decision: keep or kill "$99 founding seats" | Final pricing truth across all surfaces | Needs founder call |
| Supabase configured in prod | Live signup counter > 0, feedback widget visible, /live real data | Partially (verify keys) |
| Delete broken GitHub PAT | Security hygiene | ⛔ Founder action (web UI) |

---

## Verification

Every commit passed the full gate: `tsc --noEmit`, 237 vitest tests, `next build`, smoke + fuzz.
Deployed to production (alias `competitor-inc-zeta.vercel.app`), routes spot-checked 200.
