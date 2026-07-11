# NOTICE — vendored code attribution

This directory contains code derived from **Rowboat** by Rowboat Labs
(https://github.com/rowboatlabs/rowboat), licensed under the Apache License 2.0
(see ./LICENSE). Vendored from upstream commit
`2e45bc02139b24a212fb7df11a4cb93d2ff6bebf` (2026-07-11), specifically the
`apps/x` desktop coworker application (demo media excluded).

Changes from upstream (each modified file carries a `MODIFIED by Competitor.Inc`
header; full detail in this repository's git history):

1. **Telemetry hard-disabled** — `packages/core/src/analytics/posthog.ts`
   short-circuits to null so no build of this fork can send analytics to
   upstream's PostHog project, even if a POSTHOG_KEY is present in the env.
2. **Product identity** — `apps/main/package.json` name/productName are now
   `competitor-coworker` / `Competitor Coworker`.
3. **Display-string rebrand** — product-name prose in user-facing copy
   (notification default title, onboarding/tour, video call, billing copy,
   integration labels) now reads "Competitor Coworker" / "your Coworker".
4. **Upstream-cloud paths REMOVED (not relabeled)** — the hosted-account
   sign-in row (connectors popover), the hosted-models activation check
   (settings dialog: the connected state is pinned false, so the BYO-keys /
   local-runtimes branch is the only models path), and upstream's feedback
   channels (their GitHub issue tracker + Discord links). Sending our users
   or their bug reports to upstream's services would be wrong for both sides.

"Rowboat" is a name/mark of Rowboat Labs and is NOT licensed to us — this fork
ships under Competitor.Inc's own name. Attribution here is gratitude, not
endorsement: Rowboat Labs does not endorse this product.
