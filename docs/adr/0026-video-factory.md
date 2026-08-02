# ADR-0026 — The Video Factory: governed marketing video at zero marginal cost

**Date:** 2026-08-02 · **Status:** accepted (core shipped; render runner = next slice) · **Origin:** founder greenlight after the trailer build proved the pipeline

## Context

We produced a launch trailer with a fully deterministic, $0 pipeline: public-domain archival footage
(Prelinger/archive.org), ffmpeg assembly, headless-Chrome text frames, synthesized audio. The founder
asked for the same capability inside the platform, as something the marketing/sales agents can produce
for customers. The field context makes this valuable: video is the highest-converting launch asset,
and every competitor's AI video story rests on paid generation APIs with unclear footage licensing.

## Decision

`lib/core/video-factory.ts` — the pure brain (no model, no network, fully tested):
- **Templates, not freeform** (v1): `eras-trailer`, `teletype-story`, `receipt-reveal`. Taste lives in
  the template; variables fill it. Freeform direction is refused by design until a craft bar exists.
- **Footage allowlist + provenance receipts**: PD/CC0 collections only; every clip records
  identifier · collection · license · URL, refused if incomplete. Adding a collection is ADR-level.
- **Card gates**: every title card passes the honesty floor (no metric/money/traction claim without a
  `[receipt: …]` marker) AND the judgment gate (ADR-0025 screenContent). One dishonest input poisons
  the whole storyboard.
- **AI disclosure baked into every end card**; 60-second cap; "video" already rides the publishing
  mandate (ADR-0012), so a department lead signs every finished asset.

## Render runner (next slice, decided here)

ffmpeg cannot run in Vercel functions. Rendering runs on the existing GitHub Actions farm (same
pattern as customer builds): workflow downloads allowlisted clips, renders per the storyboard,
uploads the artifact, returns URL + provenance record for the ledger. Async, minutes, free tier.

## Consequences

- Marketing dept gains a sellable capability at $0 marginal cost; playbooks (launch-week,
  receipts-campaign) can request video assets through the same governance as posts.
- The provenance receipt extends the license shield to media — a claim no competitor's video stack
  can make.
- Until the runner ships, the factory plans and gates but does not render; no surface may claim
  "video generation" as live before the first rendered artifact + receipt exists.
