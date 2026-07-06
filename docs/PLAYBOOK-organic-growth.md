# Organic Growth Engine — the playbook

_A reusable framework for growing a brand with organic content — no paid ads — by connecting
**content → traffic → revenue** and optimizing the binding constraint each cycle. Generalized for any
brand (born from a beauty-brand-in-India case, but the logic is niche-agnostic). Built:
[`lib/engine/organic-growth.ts`](../lib/engine/organic-growth.ts) + `/api/engine kind:"organic"`.
Playbooks it stands on: **Bullseye/Traction** (Weinberg & Mares — one channel, test, scale), the
**Revenue Loop** (measure → diagnose constraint → propose next), first-party **attribution**, and
[`PLAYBOOK-freemium-tiers`] (the operate layer). Honesty invariant: reasons over REAL captured data;
says "needs data" rather than inventing numbers._

## What "done" looks like
Given a brand's real funnel + channel attribution, the system returns, every cycle:
1. **The binding constraint** — traffic, conversion, or monetization (or "unknown → instrument first").
2. **A content plan** matched to that constraint — themes × formats × organic channels + an honest cadence.
3. **A winners/losers channel readout** — double-down / keep / cut / needs-data, from real conversion.
4. **The next organic experiments** — biased to the constraint + the winning channels.
That's the loop: plan content → measure what converts → double down → re-plan. Consistently, not once.

## The core idea (why this is the right move)
Most organic-growth advice optimizes **vanity engagement** (likes, follows). This framework optimizes the
**one thing that compounds into a business**: which content actually drives *traffic that converts to
revenue*, and where the funnel leaks. It reframes "what should I post?" from a guess into a function of
the current bottleneck:
- **Traffic-bound** (thin reach) → awareness content (education, trend-jacks, POV) to get discovered.
- **Conversion-bound** (reach, weak signups) → trust/proof content (UGC, before/after, how-it-works, objection-busting).
- **Monetization-bound** (interest, little revenue) → offer content (bundles, launches, post-purchase/referral).

The content *themes* adapt to the bottleneck, which is why it generalizes across niches — beauty, SaaS,
a course, a local service. The bottleneck logic is universal; only the surface examples change.

## When it OUTPERFORMS alternatives
- **vs. social-analytics suites (Metricool/Later/native Insights):** those tell you *engagement*; they do
  NOT tell you which content converts to *revenue* or where your funnel leaks. This does. Use them together
  — native tools for engagement/scheduling, this for the money loop.
- **vs. "post consistently and hope":** replaces vibes with a constraint-driven plan + a real winners/losers
  readout, so effort concentrates where it converts.
- **vs. paid ads:** for early brands with no budget (or ad-hostile products), organic + this loop compounds
  without cash — the whole premise.

## When it does NOT (honest tradeoffs)
- **It needs data to sharpen.** With no pixel/attribution yet, it returns "unknown → instrument first" and a
  safe starter plan. It is only as smart as the captured funnel — garbage/absent data → generic guidance.
- **It does not pull per-post social engagement** (IG/TikTok/YouTube). That stays in the native tools; this
  is deliberately the *conversion/revenue* brain, not a social dashboard. (See the honest fit note in the
  freemium/positioning docs.)
- **It informs, it doesn't post for you** on the big platforms — the crew *drafts*; the human posts +
  approves. That's the governance line, not a gap.
- **Attribution is last-click-ish** (first-party UTM/ref). Good enough to concentrate effort; not a
  multi-touch econometric model.

## How the crew operationalizes it (repeatable, not ad hoc)
Each cycle the growth crew runs `organicGrowthPlan(funnel, channels)`: the marketing/growth agents draft
the content plan + next experiments → they land on the founder's desk → the founder approves → posts →
the pixel measures → next cycle the readout updates and the plan re-aims. Apex (strategy) independently
checks that the proposed work targets the *diagnosed* constraint, not activity for its own sake. Nothing
outbound fires without a human yes.

## Results to realistically expect (weeks → months)
- **Weeks 1–2:** instrument + first content; mostly "needs data" verdicts — that's honest, not a failure.
- **Weeks 3–6:** the first channel winners/losers emerge; the plan concentrates on what converts.
- **Months 2–3:** a clear, compounding picture — which content *themes* drive traffic + sales, where the
  funnel leaks, and a ranked next experiment each week. The loop learns; effort stops being a guess.

## Set-up (any brand)
1. Validate the positioning (honest verdict — free).
2. Build/host the site or install the first-party pixel on the existing one.
3. Tag every content link with `utm_source=<platform>` (+ optional `/c:<campaign>`) so traffic classifies
   as `organic-social` / `community` / `referral`.
4. Run the loop each cycle; pair with native social analytics for engagement + scheduling.
