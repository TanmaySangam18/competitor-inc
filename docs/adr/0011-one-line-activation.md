# ADR-0011: One-line terminal activation

## Context
Founder (2026-07-18): "the user should activate everything with one simple line in their terminal."
No npm publish exists yet, so the line must work from what we control: our own domain.

## Decision
`curl -fsSL <site>/api/cli | node` — /api/cli GENERATES a zero-dependency Node script (lib/core/
cli-script.ts) embedding the requesting origin. Flow: (1) pair the terminal via /cli/pair — a signed-in
server page mints a 10-minute HMAC pairing code (the OAuth-state primitive, provider "cli", user-bound);
copy-paste by design — no localhost listener, no mixed-content risk. (2) The script walks /api/cli/map
(public, secret-free): OAuth-armed providers open in the browser; key entries are prompted with echo OFF
and POSTed to /api/cli/store, which validates the env name against the registry and saves ENCRYPTED into
the ADR-0010 vault (provider "key:<id>"). (3) /api/cli/status verifies pairing + lists the caller's own
vault entries (names/meta only). Transparency is the security posture: curl it without piping and read it.

## Consequences
One line activates everything a user can self-serve; /connect stays the visual twin (status, buttons,
revocation). Founder 2% unchanged from ADR-0010 (CONNECTIONS_SECRET + OAuth apps + migration 0033) —
the same switches arm both surfaces. Next: `npx competitor-inc` as a published alias, and the governed
executor paths reading per-user vault keys so stored keys actually drive that user's builds.
