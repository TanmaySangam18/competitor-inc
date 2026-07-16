# ADR-0002: Debt-Zero Phase 0 — inventory method, first kills, shelf-capability register

## Context
docs/DEBT-ZERO-PLAN.md Phase 0 demanded evidence before deletion. scripts/audit-inventory.mjs now
builds the import graph and BFS-es from real entry points (App Router files incl. metadata conventions,
proxy, bin/, scripts/). Two scanner bugs were found and fixed during validation — SKIP_DIRS swallowed
the real route app/build/ (nearly killed the LIVE SecretHouseDoor), and Next metadata files
(robots/sitemap/opengraph-image) were misread as dead. Lesson recorded in the script itself:
verify the scanner against a known-live file before trusting any kill list.

## Decision
1. KILLED (unreachable or caller-retired; comment-only mentions elsewhere):
   components/RoomConversation.tsx (the retired /room UI) · lib/engine/delegation.ts (retired
   /delegation) · lib/engine/banter.ts + banter.test.ts (scripted banter — superseded by the
   deliberation-engine decision, task #72) · ~4.4KB of orphaned CSS (dg-*, bubble-pop, bob,
   RoomConversation's fade-up utility).
2. coworker/ (545 files) is a VENDORED companion app — excluded from per-file audit, audited as one
   unit. Open question for the founder: move it out of this repo (like ~/tools/open-design) or keep
   as a workspace. Not deleted — "Rowboat integral, never modified" is a standing decision.
3. SHELF-CAPABILITY REGISTER (test-only, KEPT deliberately — wire or kill at the Stream build):
   design-studio/mcp-connect/house-trial (fresh seams, shipped 2026-07-16, wiring queued) ·
   backend/backend-provider/model-providers/grounding (backend-reset lane #80) ·
   executive-desks/ops-desk/parallel/substrate (P2/P4 capability awaiting the loops) ·
   compounding (S3 drill — sim harnesses legitimately live through their tests) ·
   outreach (DORMANT BY DECISION 2026-07-02, banner in file) · analyst (OLDEST, 6/30 — decide at
   Stream build: fold Gauge's constraint-brief into the growth loop or delete).

## Consequences
The repo is at 0 unreachable files and the inventory regenerates in one command. Every remaining
test-only file has an owner-decision recorded here instead of ambient rot. The Stream build starts
on this cleaned foundation; anything on the shelf register it doesn't wire, it kills.
