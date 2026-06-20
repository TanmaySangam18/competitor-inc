# competitor.inc — Design System (the "Paper & Ink" theme)

> The founder's chosen direction (2026-06-19): a **warm cream paper + heavy black ink, bold-grid utility**
> aesthetic — inspired by the Glyphy-style system catalogued on getdesign.md. We adopt the *visual
> language* only; our name, logo, wordmark, and copy stay ours. This file is the **single source of truth**
> for "every inch." Pairs with the [conviction voice](PLAYBOOK-conviction-voice.md).

---

## The feel
High-contrast, confident, a little retro-utility. Warm paper, heavy black display type, crisp hairline
grids, black "inverted" cards as the emphasis. Premium through **contrast + restraint + bold type**, not
color. A common person should feel the energy of building something huge.

## Tokens
**Surfaces**
- `--paper` #F7F0DA — page background (warm cream)
- `--paper-2` #EFE7CD — secondary surface / wells
- `--card` #141310 — black "inverted" cards + primary buttons
- `--card-ink` #F2ECD8 — cream text on black cards

**Ink**
- `--ink` #14130E — primary text + borders
- `--ink-soft` #5B5644 — muted text
- `--ink-faint` #8A846E — hints
- `--line` rgba(20,19,14,0.16) — hairline borders / the grid

**Accent (single — pick one, used sparingly on the ONE thing that matters):**
- Option A `--accent` #FF5A36 (warm coral — energetic, on-brand) ← default
- Option B #00C2D6 (the electric cyan you liked) · Option C pure mono (black emphasis only)

**Type**
- `--font-display` — heavy grotesk, **UPPERCASE**, tight tracking, weight 800 (e.g. Archivo Black /
  Space Grotesk 800). Big headlines only.
- `--font-mono` — JetBrains Mono — wordmark, @handles, symbols, tiny labels.
- `--font-body` — Inter — body + UI, 400/500.

**Shape & motion**
- Radii: `--r-md` 10px · `--r-lg` 16px (cards) · pill 999px (buttons, handles)
- Borders: 1px solid `--line` (hairline grid); black cards have no border.
- Motion: minimal, snappy; honor `prefers-reduced-motion`.

## Components
- **Headline:** uppercase heavy display, often with a tiny mono/eyebrow label above it ("/ the honest ai
  co-founder").
- **Primary button:** black pill, cream text, trailing `→`. **Secondary:** cream, 1px ink hairline.
- **Cards:** two kinds — (a) **inverted** black card (cream text) for emphasis/featured; (b) **paper card**
  (cream, hairline border) for lists/rows (the Glass Box).
- **Grid motif:** thin hairline grid of cells for catalogs/feeds (echoes the symbol grid).
- **Labels:** tiny mono uppercase, `--ink-soft`, letter-spacing.

## Accessibility
Black on cream is ~AA+ contrast. Keep body ≥ 14px, labels ≥ 11px. Visible focus rings (ink). Honor
reduced-motion + reduced-transparency. The accent is never the only signal (pair with text/shape).

## Where it applies ("every inch")
Token swap in `app/globals.css` (the `@theme` variables) propagates most of it; then per-surface pass:
landing · dashboard + Glass Box · `/delegation` (Office) + `/house` (cream floor, ink/colored figures) ·
`/live` · `/join` · `/login` · `/how-it-works` · settings · `opengraph-image` · `LogoMark`.

*Locks on the founder's confirm; then built across the app in one pass (tokens → verify → propagate).*
