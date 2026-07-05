# Competitive Watchlist (living) — watch the incumbents, don't clone them

_Purpose: turn what big incumbents do (PUBLIC sources only) into (a) **gaps we exploit** and (b) **public
best-practices worth adopting** — never into a copy of their product. Playbooks: 7 Powers
(counter-positioning), Blue Ocean (design from the customer, not the competitor), + our OSS/competitive-
intelligence directive. **Legal line:** we study public materials and emulate *ideas/approaches* only —
NOT their code (copyright), patents, trademarks, trade secrets, or ToS-restricted data (no scraping /
reverse-engineering). Not legal advice; anything near the line → counsel._

## The loop (cheap, legal, repeatable)
1. **Sources (all public):** docs + changelogs/release notes, pricing pages, status pages, job posts
   (signal where they're investing), earnings calls / shareholder letters, and — highest signal — their
   users' **complaints**: subreddits, G2/Capterra reviews, HN/community threads, their own forums.
2. **Extract:** unmet needs / recurring complaints (→ gaps), pricing+packaging moves, and any *published*
   best-practice we can legally adopt.
3. **Convert (template per finding):**
   ```
   Incumbent · signal (source, date)
   Gap it exposes: <the unmet need>
   Our angle: <how our validate-first / governed / agent-run model exploits it>
   Adopt (legal): <public practice worth borrowing>  |  Avoid: <their trap>
   Counter-position: <what they structurally can't/won't copy back>
   ```
4. **Feed the roadmap:** each confirmed gap becomes a candidate build item; each adoptable practice, a task.

## Do NOT
- Don't clone their product or benchmark our roadmap to "what would they do" (Blue Ocean trap → a worse them).
- Don't cite competitor metrics we can't verify. Don't copy IP. Don't scrape.

---

## Initial entries (hypotheses to validate — NOT verified claims)
_Positioning below is common public knowledge; "gaps" are hypotheses to test against real user complaints._

### Atlassian (Jira / Confluence / Trello)
- **Model:** per-seat SaaS + a large Marketplace ecosystem; strong in mid/large orgs.
- **Gap hypothesis:** long-standing user grievance that Jira is heavy/complex for small teams & solo founders.
- **Our angle:** our ICP (first-time/student/solo founders) is exactly who finds Jira overkill — a
  validate-first, simplified, agent-run tool serves the under-served small end.
- **Counter-position:** they won't strip Jira down (it would cannibalize enterprise seats).

### AWS
- **Model:** usage-based IaaS; moat = data centers, breadth, enterprise trust. **Not a moat we attack head-on.**
- **Adopt (legal):** their *pricing philosophy* (pay-for-what-you-use) and reliability discipline.
- **Our angle:** we don't out-infra AWS — we ride free tiers + BYOK + customer-owned rails (our COGS lever).
- **Counter-position:** "lean, no-infra-to-own, agent-run" is orthogonal to selling raw compute.

### PTC (CAD / PLM — Creo, Windchill)
- **Model:** enterprise CAD/PLM, **patent-heavy**. IP fortress → do NOT go near their protected implementations.
- **Gap hypothesis:** enterprise-grade, high-friction onboarding; SMB/individual makers underserved.
- **Our angle:** validate-before-build fits hardware/physical ideas too (our Manufacturing crew role).
- **Avoid:** anything that touches their patents/CAD IP.

### Microsoft
- **Model:** bundling + distribution moat (Office/Teams/Azure); wins by attaching, not by being best-of-breed.
- **Adopt (legal):** their bundling logic (attach value to an existing wedge).
- **Our angle / counter-position:** they cannot become "a one-human, agent-run company" — their business IS
  headcount + enterprise contracts. That structural position is ours to take, not theirs to copy.

---
_Update cadence: append findings as they surface; promote confirmed gaps into roadmap candidates. This doc
is the legal, public version of "look closely at what they do."_
