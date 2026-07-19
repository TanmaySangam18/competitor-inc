# ADR-0014: The Hackathon Radar — founder as customer #1, bootstrap by winning

## Context
No API budget; Anthropic startup credits rejected ([[hackathon-bootstrap]]). Founder direction: an
option INSIDE competitor — "find ongoing hackathons and make me win them" — with the founder as the
platform's first genuine customer. Prizes fund compute; wins are validation; winning projects become
companies on the platform.

## Decision
lib/loop/hackathon-radar.ts + /api/hackathons: $0 discovery via Devpost's public listing endpoint
(plain fetch, unofficial — parser defensive, upstream failures return honest ok:false, never 5xx),
online-only + prize-ranked. winPlan(hit) = the org-run goal that opens with the COMPLIANCE GATE:
AI-policy check (ABORT events that ban AI tools — skip, never hide), event-window originality rules,
eligibility/disclosure, IP-assignment flags. The founder registers and submits personally; the org
analyzes, ideates, and builds through the standard pipeline; submissions disclose AI authorship and
carry no fabricated metrics.

## Consequences
GET /api/hackathons works keyless today; "make me win this" becomes a loop objective once the DB
migrations + a free-tier model key land (the activation runbook). Radar v2 adds lablab.ai + MLH
sources and Stream/Slack delivery. Prize income note: founder confirms OPT treatment with DSO/attorney
before accepting a payout (standing note in memory).
