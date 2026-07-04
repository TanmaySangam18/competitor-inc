# Playbook: Attention-First Landing — Prove, Don't Explain

**Trigger for this playbook:** first outside feedback on the site — "too childish, too much to read, too many pages; I'd lose interest before understanding it."

**Status:** ADOPTED 2026-07-03. Governs the public site (landing, how-it-works, compare) from here on.

---

## The diagnosis

The site currently asks the visitor to do the work: read the hero, scroll the film, click through how-it-works, playbooks, compare — and *then* form a belief. That's an **explanation funnel**. Modern attention doesn't survive it. The visitor's real question is never "how does this work?" — it's **"will this work for ME, and can I see it right now?"**

The reviewer's instinct ("they'd want something to work for them entirely rather than trying to understand it first") is exactly right, and it's already our own thesis: the product does the work so the founder doesn't have to. The website should behave the same way.

## The wrong fix (explicitly rejected)

**"Turn everything into smaller boxes on one page"** — rejected. A wall of boxes is still a wall of reading, just denser. Compression doesn't fix an explanation funnel; **substitution** does: replace reading with *watching*, and watching with *doing*.

## The rule

> **One sentence, one input, one live demo — above the fold. Everything else is optional depth.**

The 5-second test: a stranger landing on the page must know within 5 seconds (a) what this does, (b) for whom, and (c) what to do next — without scrolling.

## The unfair advantage we're sitting on

The engine's `SimulatedProvider` is deterministic and runs with **zero API keys, zero cost, fully client-safe**. That means the landing page can run a *real validation live in the hero*:

- Visitor types their idea (or taps a sample chip: "AI resume coach", "campus meal-prep service", …)
- The crew visibly goes to work — validation steps stream in a compact glass-box strip, then a verdict lands (strong / weak / mixed) with the experiments behind it
- **The aha happens on the landing page, before any signup** — consistent with the standing conversion-gating rule: never wall the validation; capture comes *after* the verdict ("Sign up to keep this crew and run the real thing overnight")

No competitor shows their actual engine on the landing page. Polsia tells; we show.

## Page structure (target)

1. **Hero:** "Type your idea. Watch an AI crew validate it — live." + one input + sample chips. Demo streams inline.
2. **Verdict → soft capture:** when the verdict lands, one CTA: "Keep this crew — save your run." (Value delivered first; ask second.)
3. **Proof strip:** 3 receipts, real numbers only (honesty invariant — if we don't have a number, we don't show a number).
4. **Footer nav:** how-it-works, playbooks, compare, blog demoted to depth-on-demand. The homepage must carry the whole pitch alone.

## Tone ("childish") fix

Trust is the brand (Verifiable. Governed.). Serious ≠ boring:
- Cut exclamation marks, mascot-y copy, and adjectives; keep verbs and numbers
- Receipts and monospaced figures over emoji and superlatives
- Every claim either has a receipt or gets deleted

## Measurable triggers (how we know it worked)

- % of visitors who start the hero demo (target: >30%)
- Time-to-first-interaction < 10 seconds
- Demo-completed → signup conversion (this becomes the funnel's new top)
- Bounce rate on `/` down vs. baseline

## Named sources

- **Don't Make Me Think** (Steve Krug) — self-evident beats self-explanatory; users scan, they don't read
- **Obviously Awesome** (April Dunford) — ONE buyer, ONE job in the hero; vague positioning is why interest dies
- **Product-Led Growth** (Wes Bush) — the product is the pitch; let them experience value before you ask for anything
- **PLAYBOOK-conversion-gating.md** (ours, standing) — value before capture; never wall the aha; signup after verdict

## Rollout note

Add this playbook to the public `/playbooks` tab in neutral user voice ("How to build a landing page people actually try") — per the standing rule, never framed as "how we built competitor.inc."
