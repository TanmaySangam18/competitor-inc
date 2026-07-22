# PLAN — $10K/month via three layered paths, with honest failsafes (2026-07-19)

Founder ask: a "fool-proof plan with a failsafe backup" from two lenses — a business one that reaches
**$10,000/month**, and a technical one where the setup *actually works* (a student can run a hackathon
end-to-end on it, the way Guildly did — they placed 2nd). Third named option: partner with **NU or
Babson** first, using the proof.

Honest preface: no plan is fool-proof, and I won't pretend one is. What this is instead is **layered** —
three revenue paths where each one backstops the others, so no single failure sinks the goal. And every
number below is a target labeled as a target; nothing here claims traction that doesn't exist.

---

## 0 · GROUND TRUTH — what's actually built (verified 2026-07-19)

**BUILT + QA-green (~1,191 tests):**
- The org (56 roles), the governance spine (tiers, kill switch, audit ledger), the Stream.
- Build → deploy → verify pipeline; change desk; regression wall.
- The five loops: incident, finance, support-escalation, hackathon-radar, office (Slack).
- **Sales Desk** — source(manual) → qualify → consent gate → drafted first-touch → queues for sign-off;
  governed sender (CAN-SPAM disclosure + opt-out, fails closed without a credential); Cal.com booking route.
- `/connect` + OAuth "2-min" flow + one-line CLI activation + the onboarding co-pilot brain & hands.
- "Win a hackathon" service + live radar; the dark canvas site + founder profile + the flow diagram.

**NOT LIVE — the real gaps:**
1. **Payments / checkout** — `billing.ts` reads empty `NEXT_PUBLIC_CHECKOUT_URL*`; `billingLive()` = false.
   No dollar can settle from anyone. THE blocker for a recurring number. (R1, still pending.)
2. **A model key in prod** — cognition is off until a key is set. Recommend **Kimi K2.6** as the cheap
   default (~$0.60/$2.50 per M tokens; ~12% of Claude's cost) so providing test-AI to users is affordable.
3. **A real lead SOURCE** — the Sales Desk qualifies leads it's handed; it doesn't find them yet.
4. **Deploy** — the site isn't on production yet (the Micah / ViratK runbook).

**DORMANT BY DECISION:** `outreach.ts` Lead Desk — parked until paying users exist.

---

## 1 · THE THREE PATHS (layered, not parallel)

| Path | What it is | Revenue shape | Speed to $10K/mo |
|---|---|---|---|
| **A — Win hackathons** | The org enters + wins cash-prize hackathons (you = customer #1) | Lumpy prize money | A bridge, not a salary |
| **B — Students run ventures** | Student founders run their company on the platform | Recurring, but free-for-students → monetize employers/tier | Slow (needs volume) |
| **C — University partnership** | NU / Babson licenses campus-wide access / accelerator tooling | One institutional contract | **Fastest to recurring $10K/mo** |

**The dependency that makes it foolproof-ish:** A and B *produce the proof*; C *converts proof into the
$10K/mo deal*. They're not three bets — they're one funnel. A hackathon win (A) and a student who shipped
(B) are the exact evidence that closes a university (C).

---

## 2 · THE $10K/MONTH MATH (honest)

- **Via C (the reliable path):** one campus/accelerator license in the ~$2–10k/mo range → one or two deals
  = the goal. Institutional sales cycle is weeks-to-months, but the *number per deal* is large and
  recurring. This is where $10K/mo actually lives.
- **Via B:** free-for-students by design, so revenue is employer-side (hiring from proof-of-work) or a paid
  power tier — real, but needs user volume to reach $10K/mo.
- **Via A:** prize money funds compute and buys proof; it is *not* a monthly salary and shouldn't be
  modeled as one.

Conclusion: **target the recurring $10K/mo through C, bridged by B's trickle and A's lumps.** Anyone who
tells you hackathon winnings are a $10K/mo business is selling; they're the fuel, not the engine.

---

## 3 · WHAT'S LEFT — prioritized

**P0 — the shared unlock (nothing works without these):**
- Deploy to prod (Micah / the runbook).
- Set a model key — Kimi K2.6 as the cheap default (adapter is a small build; the layer is already
  provider-agnostic).
- Payments live — R1: create the Polar/Stripe product + set the checkout envs. The webhook handler exists.

**P1 — the proof engine (needs P0):**
- Run **one hackathon end-to-end** on the platform — the "a student did this" artifact (your Guildly
  parallel). This single win/ship feeds both B and C.

**P2 — the money engine:**
- The Sales Desk's missing SOURCE + the **university-partnership offer** (a one-page pitch + a pilot MOU
  for NU/Babson). Wire the sender credential (founder Gmail/Workspace) so first-touches actually send.

**P3 — later:** Clay / SimilarWeb (see §4), the full onboarding co-pilot browser backend.

---

## 4 · CLAY / SIMILARWEB — build in-house, buy nothing (pre-revenue)

- **Clay** (enrichment + outbound): don't pay pre-revenue. Build a **lightweight in-house sourcing** for
  the Sales Desk using free/public data + our own pixel + the Firecrawl-planned competitor watch — we
  already have `/api/enrich`. It won't match Clay's 100-source waterfall, but it's $0 and enough for the
  first pilots. Offer Clay later as a **BYOK adapter** (customer brings their key) via the connector we built.
- **SimilarWeb** (traffic/market data): its data moat can't be cheaply replicated. **Skip it now** — use
  free proxies (public traffic signals) where useful; add as BYOK later. Not worth building or paying for.
- **Verdict: in-house lightweight now → BYOK for both later → pay for neither with your own money.**

---

## 5 · THE FAILSAFE LOGIC (what "backup" honestly means)

- **If deploy stalls:** the local demo + the live `/benchmark` proof still sell; the ViratK runbook is the
  one-session unlock.
- **If hackathons don't win:** the platform still works → the proof for B and C stands regardless.
- **If the university deal is slow:** per-student usage (B) + hackathon winnings (A) bridge the gap — no
  single point of failure.
- **The floor under all of it:** never fake a number, never claim a win or a partnership that isn't
  signed. The honesty is the moat; a fabricated proof would destroy all three paths at once.

---

## 6 · THE ONE DECISION / NEXT MOVE

**Deploy is the gate for all three paths.** Recommendation, in order:
1. Get deployed (Micah) + set a Kimi K2.6 key → the platform is *live and cheap to run*.
2. Run **one hackathon end-to-end** → the first real proof artifact.
3. Take that proof to **NU/Babson** with a one-page partnership offer → the $10K/mo conversation.
Payments (R1) can land in parallel; it's required before any dollar settles, but the proof (step 2) is
what makes the money conversation real.

The rest is already built. The gap between here and $10K/mo is: **deploy, one proof, one meeting.**
