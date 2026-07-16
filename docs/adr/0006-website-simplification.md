# ADR-0006 · Website simplification (Block E of the Connect-First reset)

Date: 2026-07-16 · Status: accepted

## Context

The founder's verdict on the old landing: "doesn't communicate the vision, weak first impression."
The old `/` was a one-screen "describe it → build it" prompt — the retired story (idea-in-a-sentence)
rather than the current one (connect once, the org runs, one human governs). The Connect-First reset
(docs/CONNECT-FIRST-RESET.md §2.3) specifies the website's whole job: **explain, simply — what happens
after you connect, in plain terms, plus the live /benchmark proof; no feature tour of pages that no
longer exist.** The Debt-Zero plan's OmniRoute study (docs/DEBT-ZERO-PLAN.md Phase 5) adds two
adoptions that bind here: every public claim quantified WITH a methodology link, and an explicit
competitor comparison (positioning beats vacuum).

## Decision

Rebuild `app/page.tsx` as a short monochrome-brutalist story — a CONTENT + STRUCTURE rewrite on the
existing design language (white / #0a0a0a ink / hairline borders / mono labels / heavy display), no new
theme. Five sections, nothing else:

1. **Hero** — the vision in one breath ("An AI software company that runs itself. Governed by one
   human: you."), ONE CTA (`/dashboard` demo) + one quiet proof link (`/benchmark`).
2. **How it works** — exactly three steps in plain words: Connect (BYOK, your ownership) · The org
   runs (56 roles, continuous loops, human tagged only for consequential decisions) · Verify
   everything (tamper-evident ledger, receipts).
3. **Proof — real numbers only** — the live `/benchmark` labeled "proven in simulation" (the linked
   page IS the methodology: numbers computed on load), the radical-honesty figure **$0 settled
   revenue** with its inline methodology (settled = cash received and not refunded, from real payment
   receipts only), and the ProductMarquee (real routes only, per lib/core/showcase.ts). No invented
   users, logos, or testimonials — the honesty floor is the brand.
4. **The honest comparison** — category framing, no named bashing: agent platforms govern spend +
   process (we do too); we additionally govern truth + outcome (validate-first, receipts after ship).
5. **Footer** — the "Built with competitor.inc" badge (the growth lever, lib/core/badge.ts) +
   /connect · /services · /benchmark · /org · /notices.

Supporting changes:
- **`/notices` (new)** — serves THIRD-PARTY-NOTICES.md statically; our own license shield requires
  keeping attribution, and publishing it is the honest end of that rule. Added to the smoke sweep.
- **`components/LandingInput.tsx` deleted** — only consumer was the old landing (Debt-Zero: nothing
  dead stays).
- **`app/layout.tsx` metadata** — site-default title/description/OG updated off the retired
  "AI co-founder / prove it before you build it" positioning to the current one.
- **`/how-it-works` honesty fixes only** (not a rebuild): the "public live board shows real
  companies" claim removed (`/live` renders the visitor's own local demo data — that claim was not
  honest) and the "own AI key is optional" line reconciled with the standing BYOK model.

Every landing claim is backed by code: 56 roles = lib/org/organization.ts (canonical ORG_56_ROLES);
tamper-evident ledger = lib/core/audit.ts (sha256 hash chain + integrity verifier); receipts =
lib/core/receipt-sign.ts; simulation labeling = /benchmark + lib/sim/*.

## Consequences

- The landing now scrolls (five short sections). The no-scroll principle remains the rule for
  operating surfaces (cockpit/panels); a narrative front door reads top-to-bottom by design — the old
  one-screen landing couldn't hold the vision AND the proof AND the comparison honestly.
- The "$0 settled revenue" figure is hardcoded with an honesty-floor comment; it must only ever be
  updated from real settled receipts (never seeded, never rounded, never mixed with simulation).
  When receipts exist, wire it to the revenue_events source instead.
- The "describe your software" input is gone from `/`; the `/build` demo still accepts `?idea=` and
  is reachable via the dashboard demo CTA.
- When the Connect-First Stream ships (Block A–D), the hero CTA should move from `/dashboard` to the
  new surface — one-line change, flagged here so it isn't forgotten.
