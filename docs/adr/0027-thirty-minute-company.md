# ADR-0027 — The 30-Minute Company: the whole connect stack, guided and in-place

**Date:** 2026-08-02 · **Status:** accepted (rail model shipped; UI + flows = staged slices) · **Origin:** founder directive after experiencing the go-live tab-hop himself

## Context

Going live today means visiting Vercel, Supabase, provider consoles, and api.slack.com by hand. The
founder's directive: every connection happens inside /connect as one guided, timed flow — the whole
company set up in ~30 minutes, one time, with a strong security posture stated in place.

## Decision

Three in-place patterns, one rail (`lib/core/connect-rail.ts`):
- **paste-in-place** — key created at the provider, pasted into the /connect modal, straight into the
  encrypted vault. Inline guide is complete enough that no docs hunt is ever needed.
- **manifest-link** — one-click pre-configured app creation (Slack v1: manifest URL bakes scopes,
  events, and interactivity routes; user clicks Create → Install → pastes the two issued values).
- **oauth-popup** — provider consent in a popup opened from /connect, token returned via redirect.
  Consent screens stay on the provider's domain BY DESIGN: that is OAuth's security model and one of
  the six human hard-stops. Internalizing it would be a phishing pattern and a HECVAT failure.
- **human-legal** stays tracked but off the 30-minute clock (entity, insurance).

Honesty rails: the rail's time estimates must sum ≤ 30 minutes (tested); the UI times the REAL run
and the public claim uses measured numbers, never the estimate. Every step states what we store, how
it is encrypted, and how to revoke — the security posture is part of the modal, not a docs page.

## Staged slices (order of build)

1. **Rail model** (this commit): steps, methods, guides, security notes, Slack manifest builder, plan
   with live status + minutes-remaining.
2. **Slack manifest flow live**: /connect modal + /api/slack/events + /api/slack/interact handlers
   verified against a real workspace.
3. **Vault-key ignition**: company #0 model calls fall back to the founder's vault-stored key —
   removes the Vercel-env step for keys entirely.
4. **Migration runner**: pending schema applies on deploy (admin-guarded) — removes the Supabase SQL
   editor step entirely.
5. **The rail UI**: /connect renders the checklist with live status, per-step modals, and the setup
   timer that produces the receipted "median setup time" number.
6. **oauth-popup upgrades** where providers support app-level OAuth (GitHub App, Google), replacing
   paste-in-place one service at a time.

## Consequences

- Customer onboarding and founder go-live converge on the same rail; the founder is user #1 of it.
- The "30 minutes" becomes a measured, receipt-backed activation metric (98-plan P3), not a slogan.
- Until slices 3-4 land, company-#0 keys still ride Vercel env and migrations remain manual — stated
  plainly here so no surface claims otherwise.
