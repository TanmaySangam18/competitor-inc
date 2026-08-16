# competitor.inc: the architecture, and why each piece is where it is

Written for a technical person reading this codebase for the first time, and for the founder who has to
answer their questions. Every claim here was verified by reading the repo on 2026-08-16, not recalled.

If you read one section, read **§2 The one idea**. Everything else follows from it.

---

## 1. What this is, in one paragraph

An AI company that builds and runs software, where a human is the legal principal and the machine does
the work. It is a Next.js 16 App Router application in TypeScript strict mode: 28 pages, 62 API routes,
224 source modules, 187 test files, 1,595 tests. Postgres via Supabase, row-level security keyed to
`auth.uid()`. No microservices, no queues, no Kubernetes. One deployable.

**Current honest state:** zero external users, checkout not live. The engineering is real; the company is
not yet. Nothing in this document should be read as traction.

---

## 2. The one idea: an agent may act, but it may never be the last word on anything that matters

Every competitor in this category governs **spend** and **permissions**. None of them governs **truth**.
That is the design centre here, and it explains most of the structure. An agent can draft, plan, build,
test and deploy. It cannot decide that a claim is accurate, that a term is accepted, or that money moves.

This produces three things a normal SaaS codebase does not have:

1. **A policy floor** that runs before any executor, deterministically.
2. **An append-only, hash-chained audit ledger**, so the record cannot be quietly edited.
3. **Six hard-stops that no configuration can switch off.**

If a technical reviewer only checks one thing, point them at `lib/core/hard-stops.ts` and ask them to
find the parameter that disables a floor stop. There isn't one. That is deliberate and it is tested.

---

## 3. Layout, and the honest boundary between the layers

```
lib/core/     52  governance and company primitives   the rules
lib/engine/  114  runtime machinery                   the work
lib/org/      32  the org model: 56 roles, SOPs       who does it
lib/loop/     12  the autonomous loop                 when it happens
lib/sim/       9  the proving ground                  how we know it works
app/          28 pages + 62 API routes                the surface
```

**`lib/core` is policy. `lib/engine` is mechanism.** Core answers "may this happen, and is it true?"
Engine answers "how does it happen?" Kill switch, audit ledger, hard-stops, the connection map,
capabilities, treasury rules, the licence shield, verification separation and the precedent store are all
core. Builds, deploys, database access, crews, funnels, growth, billing and the model transport are all
engine.

**`lib/org` is the company as data.** 56 named roles with mandates, KPIs, escalation conditions and
per-role SOPs. This is why the product can say "the AE prepared the contract and escalated the signature"
rather than "an agent did something."

**`lib/sim` is why any of the above can be believed.** 50,000 synthetic members, a power-law connection
graph, a second-price ads auction whose ledger closes to zero micros, and a shard planner that measures
fan-out. Every row is marked `simulated: true` and a test forbids any field name that could be misread as
revenue. It proves the machine works. It never proves that people showed up.

### The layering rule, and how it is enforced

**Policy must not depend on mechanism.** A rule you cannot reason about without loading the machinery is
not a rule you can trust, so `lib/core` decides and `lib/engine` does, in that direction only.

This was not true until 2026-08-16. `lib/core` imported `lib/engine` **ten times** while engine imported
core twice, so the names implied the opposite of the real graph. The cause was exactly two misplaced
files: `engine/types.ts` held org vocabulary (`AgentRole`, `AGENTS`) and `engine/policy.ts` was the
governance decision engine. Both are core concerns and both moved, which took core → engine from **ten
edges to one** across a 109-file import rewrite.

The remaining edge is deliberate. `lib/core/index.ts` is a **facade** over the whole company OS, and a
facade composing mechanism is its job. Three helpers sit with it: `plan.ts` (turns a goal into an ordered
task plan), `coordinate.ts` (closes the loop), `health.ts` (reads across both layers).

**The rule is enforced by a test, not by discipline** (`lib/core/architecture.test.ts`). Eleven named
policy modules may not import `lib/engine` at all. Any other core file that does must appear in the
facade list with a written reason, so the exception set cannot grow silently. A new core module that
reaches into engine fails CI until someone either removes the dependency or justifies it in writing.

That is the honest answer to "how do you stop this drifting again": it drifted once precisely because
nothing was checking.

---

## 4. What happens when an agent tries to do something real

This is the path a reviewer should trace. It is `app/api/execute/route.ts`.

```
request
  │
  ├─ 1. POLICY FLOOR  (always, deterministic, lib/core/policy.ts)
  │      kill switch → forbidden actions → per-agent AUTO/APPROVE/NEVER matrix → spend ceiling
  │      "Is this risky?" is a rule, not a judgement call by the model.
  │
  ├─ 2. APPROVAL KEYSTONE  (whenever Supabase is configured)
  │      the caller must be authenticated AND own the target company;
  │      approval-driven actions must map to an owned, approved inbox item.
  │      Enforced server-side by RLS on companies/approvals keyed to auth.uid().
  │
  ├─ 3. TREASURY ENVELOPE  (for anything that spends)
  │      per-department budget envelope; over-cap escalates to a human, never auto-approves.
  │
  ├─ 4. EXECUTOR  — off unless its key is set. Absent a key it returns { disabled: true }
  │      rather than pretending. Never throws a 5xx at the client.
  │
  └─ 5. AUDIT  — appended to a hash-chained ledger (lib/core/audit.ts), integrity checkable.
```

Two properties worth naming because they are unusual:

- **Fail-closed, not fail-open.** An unconfigured executor reports itself disabled. It does not silently
  simulate and let the caller believe work happened.
- **The gates are server-side.** A client cannot skip them by calling the API directly, which is the
  failure mode in competitors whose approval layer lives in the UI.

---

## 5. The six hard-stops

`lib/core/hard-stops.ts`. These are the actions the machine will never take on a human's behalf:

**account creation · accepting terms · authenticating · CAPTCHA · granting consent · paying**

A customer may **add** stops and choose how a stop is handed off (pause, take over, queue, skip). There
is no parameter that removes one. The list is `Object.freeze`d and an anti-drift test asserts it.

This is the deliberate opposite of the category leader's position. Naive's headline is "no human in the
loop," and their own documentation concedes that the default tenant user is ungated and that **222 of
their 271 tools assert no gate at all**. We should quote that, never copy it.

---

## 6. Connections and capabilities: why onboarding needs one key, not four

Until 2026-08-16 the product required four connections before anything ran: a model key, GitHub, hosting
and a database. That was our worst measured number in the category (Naive and Wix require zero; Jules
requires one).

The diagnosis was not "we need to hold customer credentials." It was a **category error in the connection
map**: T0 conflated *what competitor.inc needs in order to run* with *what a shipped product needs in
order to exist.*

- The org needs exactly one thing: something to think with. Inference is a real per-token cost, so the
  model key is genuinely unsubstitutable and stays BYOK.
- GitHub, hosting and a database are not needed to think, plan, research, deliberate, decide or produce a
  reviewable artifact. They are needed to **commit**, to **deploy** and to **persist**.

So `lib/core/capabilities.ts` declares capabilities, each naming the connections it needs. One key gets a
working org. Each further key lights a specific named ability, and every dark capability states the
reason it is dark. `MINIMUM_TO_START` is `["ai-model"]` and a test asserts it, so the number cannot drift
back to four by accident.

**Why not managed credentials, which is how competitors win onboarding?** Because it means holding
customer keys and paying their vendor bills, and the API budget here is zero. The graduation path stays
open: a capability whose connections we supply has the same shape as one the customer supplies.

Model transport lives in `lib/engine/model-providers.ts`: eight providers, two wire formats (OpenAI-
compatible covers seven; Anthropic has its own). OpenRouter is one of them, which is the honest answer to
a competitor claiming "300+ models" — they are mostly reachable through one router, and counting each as
a separate integration counts the same thing many times.

---

## 7. How the machine runs itself

`lib/loop/`. A cron tick drives `tickLoop`, which walks tenants and runs the org DAG (`buildOrgPlan`:
plan → spec → build[IC, review, sign-off] → quality → launch, care, monetise, comply). `rituals.ts` fires
the calendar work a real company does: a Monday forecast, a month-end close, renewal checkpoints at
90/60/30/14 days, quarterly agent review, failure drills.

The rituals refuse to lie when they lack data. The forecast will not print a runway without
`TREASURY_CASH_ON_HAND_USD`. The monthly close names each leg it cannot reconcile. The retention desk
stays silent at zero customers rather than reporting a healthy zero.

**One engine, two tenants.** competitor.inc is company #0, running on the same code sold to customers.
When something is broken for customers, it is broken for us first.

---

## 8. Testing, and what the QA gate actually means

`npm run qa` = env-guard → `tsc` → vitest → `next build` → smoke. It is the definition of done; no code
task is complete without it green.

184 test files against 223 source modules. The tests worth showing a reviewer are not the coverage ones,
they are the **invariant** ones: the honesty wall on synthetic data, the hard-stop anti-drift test, the
"one key to start" assertion, the ads ledger reconciling to zero micros, and the sharding residency test
that asserts no member is ever stored outside its legal jurisdiction.

Two known gotchas: `node_modules` corrupts periodically and `npm ci` repairs it; running bare `tsc`
instead of the gate throws phantom errors.

---

## 9. The deliberate refusals

A reviewer will ask why obvious things are missing. They are missing on purpose.

| Not built | Why |
|---|---|
| LLC / EIN formation as a service | Regulated, adjacent to unauthorised practice of law, needs registered-agent infrastructure. Also indefensible to sell company formation while unable to form our own. |
| Virtual cards, money movement | Money transmission. Needs a BaaS partner and a compliance programme. Contradicts the standing rule that funds-out is always human-only. |
| "No human in the loop" | This is the competitor's headline claim and the exact thing we refuse. The six hard-stops are the product, not friction. |
| Fully managed credentials | Wins onboarding, acquires a cost base we cannot carry at a zero API budget. See §6. |
| Scraped-list outbound | Standing rule. No scraping a social graph and spamming it. |
| Copyleft / AGPL / unknown-licence dependencies | Blocked by the licence shield in CI, not by good intentions. |

---

## 10. Questions a technical reviewer will actually ask

**"Why one repo and not services?"** One deployable, one QA gate, one person. Splitting this into
services buys independent scaling that nothing here needs, and costs a distributed-systems problem that
one founder cannot operate.

**"114 files in `lib/engine` is a lot."** Agreed, and it is surface area rather than tangling: files
average small, each has a top-of-file comment saying why it exists, and the layering rule in §3 is
enforced by a test. Splitting it further buys tidier directory listings and costs churn.

**"How do you know the synthetic data is not being used as traction?"** A test asserts no field on a
simulated object can be named anything a dashboard would render as revenue, every network is literally
`simulated: true`, and every generated invoice carries a notice saying so.

**"What breaks first at scale?"** Feed fan-out. Measured, not guessed: at 40 shards the median read
already touches 20 of them and the p99 touches 38. Fan-out-on-read is not viable at the top of a
power-law graph, and the hubs need materialised timelines. See `sim-out/tier3/TIER3-REPORT.md`.

**"What is the weakest part?"** Distribution, not code. There are no users, and no amount of
engineering fixes that.

---

## 11. Where to start reading

1. `lib/core/hard-stops.ts` — the thesis in 100 lines.
2. `app/api/execute/route.ts` — the gate order.
3. `lib/core/capabilities.ts` — why onboarding is one key.
4. `lib/core/audit.ts` — the ledger.
5. `lib/sim/social-network.ts` — how correctness gets proven at scale.

Related: [NAIVE-GAP-LIST.md](NAIVE-GAP-LIST.md) for what is still missing and in what order.
