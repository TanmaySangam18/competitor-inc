# Roadmap v2 — post-launch architecture (from the Product Direction Review)

These are **post-launch / post-first-PPU**. They are strong, but building them now breaks the feature
freeze and delays the launch. Captured here so they're not lost. Everything gated by the operating
policy (`lib/engine/policy.ts`), everything optimizing **Proven Paying Users**.

## The two primitives (build these first in v2 — features become thin layers on top)

1. **Rationale Stream** *(highest leverage)* — every agent action emits a structured record:
   `{ what, why, principle, alternatives_considered, what_if_ignored, confidence, receipt, learn_more }`.
   Today activities carry `{action, meta, cost, proof}` — this *extends* that. The unlock: the two
   "new agents" (Customer Education, Internal Founder) and the public proof board are all just **views**
   over this one stream — so they can never contradict each other. That coherence *is* the trust wedge.

2. **Business Knowledge Graph (BKG)** — one living model per company (entities: product, features,
   customers, channels, metrics, competitors, goals + relationships + history). A new idea AND an
   imported company become the *same* object. This is the "understands every company" half of the vision.

## The six asks — status

| Review § | Idea | Status |
|---|---|---|
| §1 | Customer Education + Internal Founder agents | **v2** — build as views over the Rationale Stream, not siloed agents. Founder agent must be grounded in live numbers (not generic coaching). |
| §2 | Soft-wall auth (value before gate) | ✅ **Already done** — `goBuild` gates auth+checkout at the BUILD step, not before validation. Funnel is correct. |
| §3 | Validate-free → pay → execute | ✅ **Already done** — paywall sits at execution (the cost center + peak intent), credit-back on failed work. |
| §4 | Enrich-the-user-about-themselves at signup | **v2** — consent-first footprint (PDL + Gravatar/GitHub/WHOIS waterfall); show→confirm→correct→delete as a trust moment. Safest enrichment case (subject *is* the user). NO LinkedIn scraping, no sensitive data. |
| §5 | **Import existing companies** | **v2 — possibly the BETTER wedge.** Dead AI-built projects (Lovable/Bolt/Replit/Cursor) = warm, motivated, perfectly-targeted audience. Real data → real verifiable improvement → real receipts → PPU + proof board. **#1 non-negotiable: ownership verification** (DNS TXT / OAuth to their Stripe/analytics) before operating anyone's business. Needs a *revive* mode, not just *grow*. |
| §6 | Long-term vision | Decomposes cleanly into BKG + ops agents + Rationale Stream + views + receipts + (later) cross-company learning. The explain-itself-and-prove-it system IS the trustworthy autonomous operator. |

## Build order (when v2 starts, after first PPU)
1. Rationale Stream (unblocks education agents + deepens the proof board).
2. Import on-ramp + ownership verification (bigger TAM + best proof use case) — **evaluate as a wedge pivot first.**
3. Consent-first self-enrichment at signup.
4. The two views (founder + customer) over the stream.
5. BKG as the shared substrate underneath all of it.

## The one strategic decision to make AFTER first PPU
Is "**import & revive a dead project**" a stronger wedge than "**validate a new idea**"? The review argues
yes (real data, warmer audience, easier sell, direct PPU/proof feed). Don't pivot pre-launch — but run the
test once there's a first paying, proven user on the current path.
