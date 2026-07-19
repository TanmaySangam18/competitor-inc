# ADR-0016 · The dark canvas reskin (ChatGPT-canvas aesthetic) + the flow diagram

Date: 2026-07-19 · Status: accepted

## Context

Founder direction: restyle the site to the ChatGPT-canvas aesthetic — dark charcoal, document-first,
monochrome — and add the one thing the founder said was missing: a sequence diagram of the real
end-to-end flow, drawn in exactly that document style. **This reverses ADR-0006's white-brutalist
choice BY FOUNDER DIRECTION.** Structure and content stay exactly as they are: this is a reskin plus
one new component, not a rewrite. The standing rules hold unchanged: pure monochrome (no hues, no
accents), no emojis, no invented claims.

The reskin seam built by the earlier passes (MACHINA → teal → portfolio-monochrome, all in
`app/globals.css` `@theme`) did its job: token names never change, only values. Most of the site
flipped by editing one block. The exceptions were the pages still carrying hardcoded light-theme hex
(`/connect`, `/decisions`, `/cli/pair` and a handful of `text-white`-on-`bg-coral` chips) — those were
swept onto token classes as part of this pass, so the NEXT reskin is one file again.

## Decision — the palette, recorded as tokens

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#212121` | page canvas (charcoal) |
| `--color-surface` / `--color-cream-2` | `#2a2a2a` | raised surfaces, cards |
| `--color-surface-2` / `--color-cream` | `#1a1a1a` | deeper wells, chips |
| `--color-text` / `--color-ink` / `--color-coral` / `--color-mint` / `--color-pine` | `#ececec` | primary ink; primary action + verified read as light ink |
| `--color-muted` / `--color-ink-muted` / `--color-amber` / `--color-sienna` | `#b4b4b4` | secondary text (body-size secondary stays ≥ AA) |
| `--color-muted-2` / `--color-ink-faint` / `--color-violet` | `#8e8e8e` | muted micro-labels |
| `--color-border` / `--color-rule` | `rgba(255,255,255,0.12)` | hairlines |
| strong borders (non-token, e.g. diagram lifelines) | `rgba(255,255,255,0.25)` | emphasis edges |
| inverted elements | `#ececec` bg + `#212121` text | primary buttons, solid chips (`bg-coral`/`bg-text` pair with `text-bg`) |
| `--ripple-ink` | `rgba(236,236,236,0.10)` | the ONE ripple reskin knob (ADR-0009) |

Contrast: `#ececec` on `#212121` ≈ 13.7:1; `#b4b4b4` ≈ 7.9:1; `#8e8e8e` ≈ 4.9:1 (used only for
micro-labels; body-size secondary text uses `#b4b4b4`). WCAG AA holds.

Non-token raw values in `globals.css` (scrollbars, glass-nav frost, clay/delegation surfaces, mesh,
grid, shadows, selection, focus ring) were converted to dark equivalents in the same pass; light-mode
drop shadows became subtle black ones.

## Decision — the hex sweep (the part that makes the NEXT reskin one file)

Every hardcoded light-theme value in `app/` and `components/` was mapped semantically onto token
classes: ink → `text-text`, hairline → `border-border`, paper → `bg-bg`/`bg-surface`, wells →
`bg-surface-2`, inversion buttons → `bg-text text-bg`. Swept: `/connect` (INK/HAIR constants + ~30
usages), `/decisions` (Ledger-era whites), `/cli/pair`, dashboard verdict rings (`border-black/*` →
`border-text/*`), and the five `text-white`-on-`bg-coral` chips (SiteFooter badge, AuthPanel,
DashSidebar, /services CTA). The two logo marks and both OG images were aligned to the exact palette;
the site-preview iframe fallback message went charcoal. Found in passing and fixed: `Scorecard`'s
"strong" ring referenced a nonexistent `--mint` variable, so its GREEN fallback (`#34d399`) was
actually rendering — against the standing no-color rule; it now uses `var(--color-mint)`.

Deliberately NOT flipped: `app/api/receipt-card/route.tsx` (the receipt-card share image keeps its
paper-receipt identity — it is an artifact, not a site surface) and email HTML in
`app/api/feedback/route.ts` (emails render on the recipient's background).

## Decision — the flow diagram (`components/FlowDiagram.tsx`)

A monochrome sequence diagram in the ChatGPT-document style: bordered rectangular lifeline boxes top
and bottom, thin vertical lifelines, horizontal labeled arrows, self-loop arrows for internal steps.
Pure SVG, zero dependencies, no client JS; colors only via theme tokens (in `style` props — SVG
presentation ATTRIBUTES do not resolve `var()`; labels get a `paint-order: stroke` halo in the page
background so they stay legible crossing lifelines). Responsive: scrolls horizontally inside its
container on mobile (`overflow-x-auto` + min-width), no page overflow.

Honesty: every arrow is verified against the codebase — the role count is COMPUTED from
`lib/org/organization.ts`; "loop engine" = `lib/loop/loop-engine.ts`; "regression wall" =
`lib/core/separation.ts`; "5 rails" = `lib/org/publishing-mandate.ts` (ADR-0012); the founder floor =
the Tier-3 policy floor (ADR-0013); "hash-chained ledger" = `lib/core/audit.ts`; "cited" support =
`lib/core/operate.ts` (cite-or-abstain). Caption: "The real flow — every arrow is a governed action on
the audit ledger."

Placement: the landing (`/`), its own section directly after "How it works" (header "The flow,
drawn"), and `/live` below the Slack demo (the thread shows one moment; the diagram shows the circuit).

## Consequences

- ONE-file reskins are true again: the pages that had drifted onto raw hex are back on tokens.
- The token names still carry their light-era meanings (`coral`, `cream`, `ink`) with inverted values;
  renaming them would touch every call site — consciously deferred.
- `text-white` paired with `bg-coral`/`bg-text` is now a bug by convention: inverted elements must use
  `text-bg`.
- Diagrams added later must follow the FlowDiagram rules: tokens only, verified labels, no library.
- QA green (`npm run qa`), inventory 0 unreachable, every keeper page browser-verified in dark, zero
  console errors.
