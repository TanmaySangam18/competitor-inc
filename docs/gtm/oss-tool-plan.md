# OSS lite tool — $0-CAC distribution (prep; publishing is a founder decision)

**Idea (from the Paperclip lesson):** ship ONE sharp, standalone, MIT-licensed tool that's useful on
its own, with a quiet "powered by competitor.inc" funnel. Paperclip proved a free OSS tool pulls tens
of thousands of the exact people we want, at $0 ad spend. *Playbook: dev-tool/OSS-led growth.*

## What to ship: **the Mom-Test Kit generator**

We already have the engine — [`lib/engine/momtest.ts`](../../lib/engine/momtest.ts) is pure,
dependency-free, and tested. That's the whole product; a standalone is a thin wrapper around it.

**Two viable forms (pick one when you're ready to publish):**
1. **`npx momtest "<your idea>"`** — a tiny CLI that prints the interview kit + costly-ask ladder to
   the terminal. Cheapest to ship, loved by the technical-founder crowd (HN/IH). ~1 file + the copied
   `momtest.ts`.
2. **A single-file static web tool** (`momtest.html`) — type an idea → get the kit, "copy all,"
   footer link to competitor.inc. Broader reach (non-technical founders), hostable free on GH Pages.

Both end with: *"This kit is the free first step. competitor.inc runs the whole loop — validate →
build the winner → prove what it earned. → competitor-inc-zeta.vercel.app"*

## Why this specific tool
- It's the honest, useful sliver of our moat (validation) — gives value before any signup.
- Zero backend, zero cost, zero F1/spend exposure.
- Natural funnel: someone who runs the kit is a founder mid-validation — our exact ICP at the exact moment.
- Reinforces positioning (we're the "prove it first" people) instead of the commodity orchestration layer.

## What's needed to publish (FOUNDER — I can't do these)
1. A public GitHub repo under your account (`TanmaySangam18/momtest` or similar) + MIT license.
2. For the CLI: an npm publish (your npm account) — or skip npm and just `npx github:...`.
3. The launch post (Show HN / r/startups / Indie Hackers) — draft below; you post it.

## What I can do now (say "go")
- Generate the standalone (CLI or HTML) in a `tools/momtest/` folder in this repo, ready to extract
  to its own repo — copying `momtest.ts` verbatim so there's no divergence.
- Write the repo README + the launch post.
Kept as prep, not built, to avoid shipping an unused folder before you've picked the form.

## Launch post draft (Show HN)
> Show HN: Mom Test Kit — interview questions that don't lie, generated for your startup idea
>
> I kept watching first-time founders (myself included) ask "would you use this?" and collect polite
> yeses, then build the wrong thing. This is a tiny free tool: type your idea, get a Mom-Test
> interview kit — past-behavior questions only, plus a costly-ask ladder (time → intro → written yes →
> deposit) and how to score commitments vs compliments. No signup, MIT. It's the free first step of a
> bigger thing I'm building (competitor.inc), but this stands alone. Brutal feedback welcome.
