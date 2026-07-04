# Founder Directive — Continuous Open-Source Intelligence

_Permanent product directive (founder, 2026-07-04). Every agent treats GitHub (and the wider OSS
ecosystem) as a **standing intelligence source**, not a search-when-needed tool: continuously find
repos that could improve our operations, founder productivity, customer experience, automation,
performance, dev velocity, security, or product quality — and turn discoveries into structured,
prioritized recommendations. Think like a co-founder, not a search box._

## Honest scope (what "continuous, end-to-end" realistically means)
Literally scanning *all* of GitHub continuously is not feasible or useful — millions of repos, API
rate limits, cost, and noise. The high-value, real version is a **targeted, scheduled scan** over the
domains that actually move our platform, with quality scoring so only signal surfaces:

- **Watchlist domains:** AI agents / orchestration, Next.js + React ecosystem, Supabase/Postgres,
  founder/GTM tooling, dev-productivity + automation, UI component libraries, security/SAST, and our
  own dependencies (for updates + advisories).
- **Cadence (event-driven where it matters):** weekly targeted topic/search sweep; daily for our
  dependency advisories (security); event-driven on a dep's new release. Cheap, bounded, honest.
- **Scoring / prioritization (the directive's criteria):** business value · implementation effort ·
  maintenance burden · **license** (must be usable — MIT/Apache/BSD; copyleft flagged) · security ·
  community adoption (real signal, not vanity stars) · long-term sustainability (active maintenance).

## Recommendation template (every discovery uses this)
```
Repo:            <owner/name> (license, last active, adoption signal)
Why useful:      <the specific capability + the pain it removes>
Where it fits:   <exact surface in our platform>
Complexity:      <low | medium | high> — <what the integration entails>
Customer impact: <low | medium | high> — <what the user notices>
Risks:           <license / security / maintenance / bloat / moat-dilution>
Rollout:         <now | post-launch | backlog | pass> + priority
```

## Implementation status (honest)
- **Adopted as a standing lens NOW:** every recommendation I make weighs OSS leverage first (build vs
  borrow), and I apply the template above. This is live in how the exec team operates.
- **Automated scanner = a build (backlog, post-launch):** a scheduled agent that queries the GitHub
  search API over the watchlist, scores results, and emits template'd recommendations into the founder
  digest. Needs a GitHub token for rate limits + a small `oss_findings` store. Real, bounded, not yet built.
  (Deferred behind launch — it's internal tooling, valuable but downstream of getting customers.)

---

## Worked example #1 — `msitarzewski/agency-agents`
_(Reviewed 2026-07-04 per the founder's request; also the first application of this directive.)_

**Repo:** `msitarzewski/agency-agents` — "The Agency," MIT-licensed (VERIFY the LICENSE file before
copying any text). A library of ~200+ specialized AI-agent **persona definitions** as markdown, grouped
into functional divisions (engineering, marketing, design, security, finance, …), tool-agnostic
(Claude Code / Copilot / Cursor / etc.), with a consistent per-agent template and multi-agent
orchestration examples. _(Note: the star/fork counts a scrape returned looked inflated/blended with a
more famous roster — judging on concept, not metrics.)_

**Why useful:** three transferable ideas, not the roster itself —
1. **Agent-definition template** — identity → critical rules → concrete deliverables → workflow steps →
   **success metrics**. Richer than our current `AGENTS` spec (which has playbook + responsibilities but
   no explicit success metrics or step workflow).
2. **Division taxonomy** — a ready-made library of role archetypes that could seed more benchmark-org
   crews in our dynamic-crew generator (we generate crews from org structures; this is reference material).
3. **Sequential-handoff orchestration examples** — validate + could sharpen our sub-agent handoff flow.

**Where it fits:** enrich `lib/engine/types.ts` AGENTS specs (add `successMetrics` + a short `workflow`)
and the `lib/engine/dynamic-crew.ts` role library. NOT a wholesale import of 200 personas.

**Complexity:** low to borrow the template concept (a few fields on AgentSpec); medium+ for any import
pipeline (and not worth it).

**Customer impact:** medium — more credible, measurable agent behavior + more benchmark orgs for crews.

**Risks:** (1) **bloat / moat-dilution** — importing 200 generic personas would dilute our focused,
governed, proof-first crew; their personas are prompt-personalities, ours are policy-gated with
verify-before-done — don't blur that. (2) License — MIT is fine to borrow concepts/text *with
attribution*, but VERIFY the LICENSE file first. (3) Don't cite their metrics (unreliable scrape).

**Rollout:** **post-launch, low-medium priority.** Borrow the *template concept* (success metrics +
workflow on our specs) when we next touch the agent layer; mine the division taxonomy as reference for
future benchmark-org crews. Do **not** import the roster. No action pre-launch.
