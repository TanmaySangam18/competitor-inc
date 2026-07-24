# ADR-0025 — Content gate v2 (the judgment screen) + /verify (public receipt checking)

**Date:** 2026-07-24 · **Status:** accepted · **Origin:** PR pre-mortem S3/S4 + the market deep-dive (98-plan, P1/P2)

## Context

Two findings drove this. The pre-mortem's S3: our honesty gate checks FACTS (receipts, simulation
labels) but nothing checks JUDGMENT — an agent post can be receipt-clean and still be cruel,
tragedy-adjacent, political, or bait, and the architecture's silence becomes the indictment ("they
built a gate for lies but not for cruelty"). And S4 plus the 11x scandal: when someone claims our
receipts are fake, a stranger must be able to verify one in under five minutes without trusting us.

## Decision

**Content gate v2** — `lib/core/content-gate.ts`, `screenContent(text)`:
- Deterministic rules (hostile language, tragedy adjacency, politics/medical/legal territory,
  engagement bait, shouting, profanity), each flag carrying the rule name and the offending snippet.
- A flag NEVER silently blocks — it routes to a human. The vocabulary is `pass | flag`, nothing else.
- Wired as **rail 6 of the publishing mandate** (`PublishRequest.contentFlags`): the mandate cannot
  clear flagged content regardless of who approved it. Deterministic floor; model-based nuance may
  layer above inside org-runs but cannot replace this.

**/verify** — `app/verify/page.tsx` + `app/api/verify/route.ts`:
- Builds on the existing HMAC receipt-signing (`lib/engine/receipt-sign.ts`): paste a receipt-card URL
  (or the title/value/sig triplet) and this server checks its own signature in public.
- Zero client JS (a plain GET form): verification that works with JavaScript disabled looks like what
  it is. The page states exactly what VERIFIED means: minted by this server, unaltered — nothing more.
- Fail-closed honesty: no signing secret ⇒ "verification unavailable here", never a fake pass; a bad
  signature says NOT VERIFIED with the reason; the URL is parsed, never fetched (no SSRF surface).

## Consequences

- The publishing pipeline now has both halves: truth (rail 2) and taste (rail 6).
- The anti-fabrication accusation has a one-link answer, which is also a sales asset for the campus
  trust packet (HECVAT's transparency questions point straight at it).
- Gate rules are conservative by design: a false positive costs one human review, a false negative
  costs the brand. Extend the patterns before loosening them; loosening is a founder-level decision.
