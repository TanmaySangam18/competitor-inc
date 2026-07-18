# ADR-0010: The OAuth "2 minutes" connect — convenience with BYOK custody

## Context
Viktor onboards via OAuth in "2 minutes"; our /connect asked users to paste env vars. Founder directive
(2026-07-18): adopt the OAuth flow, "everything else should just be done for them." The differentiator we
keep: custody. Viktor holds your tokens on their side with no BYOK; with us the token lands encrypted
(AES-256-GCM under CONNECTIONS_SECRET) on the USER's own row, readable-status/revocable by them, never
displayed, never owned by us.

## Decision
- lib/core/oauth.ts: provider registry (GitHub + Slack first — core rails, standard OAuth2; registry is
  the extension point), HMAC-signed time-boxed user-bound state (CSRF), injectable token exchange.
- Routes: /api/oauth/[provider]/start (auth required; provider must be ARMED = founder registered the
  OAuth app + set client env vars; vault must be ready) · /callback (verify state → exchange → encrypt →
  upsert → honest banner) · /disconnect (owner deletes the row; provider-side deauth is stated as theirs).
- Migration 0033 user_connections: RLS owner-read-status/delete; service-role writes; enc column is
  ciphertext (iv|tag|ct, fresh IV per write).
- /connect renders a CONNECT button ONLY for armed providers; env vars remain the always-works path.

## Consequences
Customers connect GitHub/Slack in one click once the founder arms the apps (register + 5 env vars +
migration 0033). Next providers ride the registry (Google, Stripe Connect). "Everything done for them"
continues next: post-connect auto-provisioning (Slack channel setup, repo bootstrap) consuming the vault
via a governed reader — tokens decrypt ONLY inside governed executor paths, never in UI code.
