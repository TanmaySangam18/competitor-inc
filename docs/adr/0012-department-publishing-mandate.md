# ADR-0012: The Department Publishing Mandate — leads approve routine outbound

## Context
Founder (2026-07-18): approvals for posts/scripts/videos should not reach the founder — "agents approve
whatever falls under their department and restriction; only founder-related should be for me." This
amends REQUIREMENTS §1's "any public statement is T3" — an amendment only the accountable human can
make, and they did, explicitly.

## Decision
lib/org/publishing-mandate.ts: publish kinds (social posts, HN/PH listings, scripts, video, blog) are
approved by the OWNING DEPARTMENT'S LEAD when five rails hold — separation (author ≠ approver = lead) ·
honesty (receipt-backed or simulation-labeled; the floor outranks the mandate) · named-AI disclosure ·
channel daily cap (6/day) · own/opted-in audience only (scraped = forbidden, unchanged). bluesky/mastodon
removed from policy.ts alwaysT3; publish_public + legal_statement remain founder-only, as do money over
caps, contracts, deletion, pricing, security controls, paying-customer prod deploys. Kill switch and the
forbidden floor sit above the mandate. A post failing ANY rail queues for the founder exactly as before.

## Consequences
The founder's queue shrinks to the irreducible floor. Executors must pass truthful rail flags — a caller
lying about honestyVerified is an audit-ledger offense surfaced by drills. NEXT: wire post executors
(bluesky/mastodon exist; HN/PH/Instagram/video when built) through deptSelfApprove, and the GTM
automation map (channel × role × loop) formalizes which department owns each channel.
