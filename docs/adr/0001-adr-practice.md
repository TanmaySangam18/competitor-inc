# ADR-0001: Architectural decisions are recorded as ADRs in docs/adr/

## Context
The repo accumulated debt through direction changes with no decision trail (founder, 2026-07-15).
We already enforce this discipline for CUSTOMER products (product-memory: architecture doc + ADRs
feeding every future change). We did not apply it to ourselves.

## Decision
Every architectural decision — new subsystem, consolidation, kill, pattern change — gets one
docs/adr/NNNN-title.md (Context/Decision/Consequences), written in the same session that makes the
decision. The Debt-Zero program (docs/DEBT-ZERO-PLAN.md) governs the cleanup; this ADR governs the
habit that keeps it clean.

## Consequences
Future agents inherit the "why," not just the "what"; kills are traceable; the loop engine's
learnings can cite ADR numbers; docs debt stops compounding.
