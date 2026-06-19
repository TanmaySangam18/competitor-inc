# Revenue Playbook — the path to $10K/month

> **The founder lens:** **Rob Walling** — bootstrapped Drip to a 2016 exit, founded MicroConf + the
> TinySeed fund; his *Start Small, Stay Small* and *The SaaS Playbook* are the canonical bootstrapped-
> SaaS-to-$10K-MRR rules. We pair them with **Pieter Levels** (ship small, charge from day one,
> default-alive) for product, and a **big-bang surprise launch** (NOT build-in-public) for GTM.
> Complements the historical [`MONEY-PLAN.md`](MONEY-PLAN.md); this is the current, authoritative target.

---

## 0 · The goal, stated as math

**$10,000 in Monthly Recurring Revenue (MRR).** One-time Founding seats are *cash for runway*, not MRR —
they fund the launch; subscriptions are what we measure to $10K. Three honest ways to get there from the
current pricing (**Validate $0 · Operator $39/mo · Founding $99 once**):

| Path | Mix | Customers needed | Read |
| --- | --- | --- | --- |
| A — Volume | 257 × $39 Operator | **~257** | hard to reach cold; high churn risk at $39 B2C-ish |
| B — Blended *(recommended)* | ~120 × $39 + ~30 × **$99 Studio** + annual prepays | **~150** | fewer, higher-value accounts |
| C — Higher ACV niche | ~45 × **$199 Operator-for-multi-company** | **~45** | fewest, stickiest, easiest to support |

**Walling's verdict applies:** the fewer/higher-value the customers, the more reachable $10K is. So the
single highest-leverage move is **add a higher tier and price up** (see §2), not chase 257 low-ACV users.

---

## 1 · Niche down to a buyer with money (Walling rule #1)

"Indie founder with an idea" is a huge, cheap, churny market. Pick the segment that **already pays for
shipping companies** and is **reachable as a list**:

- 🎯 **Primary beachhead — operators who run *multiple* bets:** indie studios, agencies, consultants,
  micro-PE / holdco / "house of brands" solo-operators. They feel the validate-first + Glass-Box-proof
  value most (they kill bad bets fast) and they'll pay $99–$199 because one avoided dud pays for a year.
- This is also our **counter-position to Polsia** (proof-first, 0% revenue share — see
  [`COMPETITIVE-polsia.md`](COMPETITIVE-polsia.md)): the multi-bet operator is *exactly* who got burned by
  "marked complete without deploying" and the 20% tax.

## 2 · Charge more, tier on value (Walling rule #2 + Levels "charge from day one")

Add a third paid tier so the $10K math needs ~45–150 customers, not 257:

| Tier | Price | For | Lever |
| --- | --- | --- | --- |
| **Validate** | $0 | first-timers | top-of-funnel; the honest "we'll tell you not to build" hook |
| **Operator** | **$39/mo** | one company | current default |
| **Studio** *(new)* | **$99/mo** | up to 5 companies, priority shifts | the $10K workhorse |
| **Founding** | **$99 once** (launch-only, capped) | scarcity at launch | runway cash, not MRR |
| *(optional)* **Agency** | **$199–299/mo** | unlimited companies, BYO team seats | Path C accelerator |

- **Annual plans, 2 months free** → cash up front + lower churn (Walling's #1 churn lever).
- **No revenue share, ever** — make "you keep 100%" a headline next to Polsia's 20%.

*(Implementation note: the new Studio/Agency tiers need to be added to the `/join` pricing UI — small,
self-contained change; flagged for the build queue.)*

## 3 · Kill churn (Walling: retention > acquisition at this stage)

$10K MRR leaks away if churn is high. Levers, in order:
1. **Activation = first honest verdict + first shift with real proof** within 10 minutes of signup.
2. **The nightly morning-email summary** (Polsia's most-loved feature — on our Phase-2 roadmap) is a
   *retention* feature: it pulls people back daily.
3. **Annual billing** for the multi-bet segment.
4. **Auto-refund on failed tasks** already removes the #1 trust-churn reason Polsia suffers from.

## 4 · Own one channel (Walling: don't depend on virality)

The launch is a spike; **one repeatable owned channel** sustains $10K. Pick ONE to start (stair-step):
- **SEO/comparison content** — "Polsia alternative," "honest AI company builder," "validate before you
  build" — high-intent, compounding, and on-brand (proof-first).
- **Integration/partnership** distribution (founder communities, no-code/indie tool bundles).
- Paid only after a channel's CAC < ⅓ of annual LTV.

## 5 · The launch motion — big-bang surprise, then take over (NOT build-in-public)

Per the founder decision, **we do not build in public.** See [`LAUNCH-PLAYBOOK.md`](LAUNCH-PLAYBOOK.md).
- **Before:** silent build + a **waitlist** (a waitlist is not building in public) + a capped **Founding
  $99** offer teased for scarcity.
- **Drop day:** coordinated Show HN + Product Hunt + X, a polished demo (the 3D floor + Glass Box proof),
  Founding seats live. The *surprise* is the advantage — borrow the audiences you didn't build in public.
- **After:** Surge runs **demand capture** (drafts posts to the Approval Inbox, never auto-public) + the
  owned channel from §4. "Take over" = out-trust the incumbent, publicly, on proof.

---

## 6 · The 8-week scoreboard (the only metrics that matter)

| Metric | Target by month 2 |
| --- | --- |
| **MRR** | **$10,000** (go/no-go) |
| Paying customers | ~45 (Path C) → ~150 (Path B) |
| Trial→paid activation | ≥ 25% |
| Logo churn | < 5%/mo |
| Founding cash (one-time) | ~$10–15K runway (≈150 × $99) |
| CAC : annual LTV | < 1 : 3 before scaling spend |

**Go/no-go (Levels "default-alive"):** ~**$10K MRR in month 2, or kill it.** Honest by design — same
standard we hold the user's ideas to at the Validation Gate.

---

*Revenue decisions made through Rob Walling (niche, price up, kill churn, own a channel); launch via the
big-bang surprise playbook; the whole thing kept default-alive.*
