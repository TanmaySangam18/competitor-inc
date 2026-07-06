# Primary Benchmark — Time-to-First-Proven-Outcome (TTFPO)

_Adopted 2026-07-06. Supersedes "autonomy %" as the **primary** success metric now that a real user is
waiting. Autonomy % (`docs/AUTONOMY-SCORECARD.md`) stays as an internal build-health metric; **PPU**
(Proven Paying Users) remains the north star for when we can legally charge. This is the near-term KPI._

## Why this metric (and why now)
Autonomy % answered a *build* question: "how much of the work can the machine do?" It served its purpose —
the engine is built. The question that matters now is an *outcome* question: **"did the product actually get
a real person a real result?"** That is the only thing that converts a waiting user into a proof story, and
the only thing that beats a well-funded rival whose weakness is credibility (decaying revenue, "fake-stat"
criticism). We win by being the one that can *show* a real outcome for a real user — honestly measured.

## What exactly is measured
**TTFPO = calendar days from a real user's first company created → their first _proven outcome_.**

A "proven outcome" is the first funnel milestone that is *real* (basis `real` in `readFunnel`, never
invented), in escalating order — we track the first one reached and the date:

| Milestone | Definition (all from the first-party pixel / attribution) | Basis required |
|---|---|---|
| **M1 — Real reach** | ≥100 real `view` events on the user's slug | `views: real` |
| **M2 — Real signup** | ≥1 real `signup` event (demand test or beacon) | `signups: real` |
| **M3 — Proven outcome** | ≥1 `revenue_event` **or** a user-confirmed real-world result (e.g. a sale, a booked call) tied to the slug | `paying/revenue: real` |

TTFPO's headline number is **days to M3** (the real result). M1/M2 are leading indicators we report alongside
it so progress is visible before M3 lands. All three are already captured by `lib/engine/funnel.ts` +
`lib/engine/attribution.ts` and snapshotted nightly to the Scorecard (`app/api/cron/route.ts`).

## Current numbers (2026-07-06)
- **First real user:** design partner onboarding in progress (friend's beauty brand, India — organic).
- **M1 / M2 / M3:** not started — clock has not begun (no company created by the real user yet).
- **TTFPO:** N/A until the user creates their company and the pixel is live on their site/links.
- Honest note: **0 real, 0 fabricated.** We never invent a milestone; a missing signal reads "connect it,"
  never "zero achieved."

## How it compares (industry / competitor)
- No competitor publishes an honest time-to-real-outcome figure. Polsia reports ~$10M "ARR" that is largely
  non-recurring and declining, with ~4% of companies active — i.e. a headline number, not a proven per-user
  outcome. Our bet is the inverse: one *real, verifiable* outcome beats a big unverifiable aggregate.
- Realistic internal target (from `docs/PLAYBOOK-organic-growth.md`): M1 in ~1–2 weeks, M2 in ~3–6 weeks,
  M3 in ~2–3 months for an organic brand with consistent posting. TTFPO ≈ **60–90 days** is a healthy first result.

## Should it evolve?
Yes — this is deliberately the *right* metric for the current stage (pre-revenue, first real user, F1/OPT
gate on charging). The moment charging unlocks, **PPU** (paid ∩ verified receipted outcome) becomes primary
and TTFPO becomes the leading indicator that predicts it. Sequence: **TTFPO now → PPU at charge-unlock →
retention/defensibility after.** Autonomy % never returns to primary; it's a build-health gauge.

## How the crew works toward it (operationalized)
Each nightly cycle the growth crew runs the **Organic Growth Engine** (`lib/engine/organic-shift.ts`, wired
into `app/api/cron/route.ts`): it diagnoses the binding constraint from the real funnel, posts the
constraint-matched content plan to the Glass Box, and drops ready-to-post drafts on the founder's desk
(draft → approve → post). That loop is literally aimed at moving M1 → M2 → M3 for the first real user. TTFPO
is the score of that loop.
