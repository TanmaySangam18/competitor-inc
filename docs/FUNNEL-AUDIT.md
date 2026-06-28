# Funnel audit — Product-Led Growth lens (Wes Bush)

Playbook: **Wes Bush, *Product-Led Growth*** — two principles applied to every step from landing → value →
signup → paid: (1) **value before the ask** (let them feel the "aha" before a signup wall; ask at peak
intent), and (2) **every gate must earn its place** (a gate that doesn't protect value or capture intent is
just friction). Triggered by the founder's catch: "Meet your co-founder" drops you into validation with no
account moment.

## The model (decided)
Validation = the aha → keep it **ungated** (one free taste). **Sign-up is the gate on *save + build*** — asked
right after the verdict, where intent peaks. Building is already gated to sign-in (good). The gap is the
**missing signup moment after the aha** + weak signup visibility. We do NOT wall the first taste (that's the
#1 activation killer for first-time founders).

## Findings

| # | Sev | Finding | PLG principle | Fix | Status |
|---|-----|---------|---------------|-----|--------|
| 1 | HIGH | A guest can validate but is **never invited to create an account** to save/continue — work feels ephemeral, and we capture nothing. (The founder's catch, generalized.) | Ask at peak intent | Post-verdict **"Create a free account to save this & build"** prompt for guests | ✅ this pass |
| 2 | MED | **Sign-up isn't visible** in the nav — only "Sign in." A new visitor has no obvious "create account." | Clear path to value | Add **"Sign up free"** to the landing nav (+ keep Sign in) | ✅ this pass |
| 3 | HIGH | **Auth hidden on mobile** — sign in/up only show ≥sm/lg; a phone visitor can't sign in/up from the landing. | Every gate earns its place / no dead ends | Mobile menu (hamburger) exposing nav + auth | ⏳ Block F |
| 4 | MED | **"Meet your co-founder"** reads like "meet a person/demo," lands on validation. Intent is slightly fuzzy. | Clarity of the next step | Keep the brand phrase but ensure the first screen instantly = "type an idea" (it does); revisit copy A/B later | ⏳ later |
| 5 | MED | Entry-point **sprawl**: `/login`, `/signup`, `/join` (Founding waitlist), and the CTA → `/dashboard`. Four doors with overlapping intent. | One obvious path | Map intents: CTA = try (→ validate), Sign up/in = account, /join = Founding waitlist only. Tighten cross-links so they don't compete | ⏳ Block F |
| 6 | MED | After **"Hold for now"** on a verdict, the guest can dead-end (no clear next: tweak idea / sign up / see playbooks). | No dead ends | Add next-steps on the hold/rejected states (tweak & re-run · save · explore playbooks) | ⏳ Block F |
| 7 | LOW | **Login redirect** on the build gate must return the user to their in-progress company + preserve local work after sign-in. | Don't lose progress | Verify post-login redirect carries them back to build; localStorage already persists the company | ⏳ verify in Block F |
| 8 | LOW | Pricing CTAs route to `/dashboard` or checkout — confirm a logged-out click lands on value/signup, not a confusing wall. | Value before ask | Audit each pricing CTA's logged-out path | ⏳ Block F |

## This pass (corrections shipped)
- **#1 — post-aha signup prompt** (`GuestSavePrompt`): after the validation verdict, guests see "create a free
  account to save this & build." Captures at peak intent without walling the first taste.
- **#2 — "Sign up free"** added to the landing nav next to Sign in.

The rest (mobile auth menu, entry-point map, hold/rejected next-steps, redirect-preservation, pricing-CTA
logged-out paths) fold into **Block F** tomorrow — they're the same "value-before-the-ask / no-dead-ends" theme.
