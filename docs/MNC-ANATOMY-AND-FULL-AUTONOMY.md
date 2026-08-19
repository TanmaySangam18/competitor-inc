# The anatomy of a real MNC, and what a whole autonomous company would actually need

Written 2026-08-19 to answer three questions: how is a large company actually structured, why is nobody
running a whole one on AI, and what would it genuinely take. No aspiration here that is not labelled.

---

## Part 1 · The correction that matters most: agent count is not the bottleneck

The instinct is "56 agents is not enough, let us build 500 and run them all at once." That instinct is
wrong in a specific and checkable way, and acting on it would waste weeks.

**What actually limits the machine today, measured:**

| Limit | Size | Would more agents fix it? |
|---|---|---|
| Files a build can change in one run | about 10 | **No.** One agent or a thousand, the run still edits ~10 files |
| External users | 0 | **No.** Nobody is waiting for a bigger org chart |
| Capability gaps (paging, migrations, invoicing, calls, ads, a11y, discovery) | 7 | **No.** Each is a missing integration, not missing labour |
| Automated share of company functions | 46.7% | **No.** The uncovered 7 stay uncovered |

Adding agents adds **coordination cost**, not capacity. This is the oldest result in software management:
Brooks's law, that adding people to a late project makes it later, because communication paths grow as
n(n-1)/2. Ten agents have 45 possible conflicts. Five hundred have 124,750.

**The codebase already proves the point.** `lib/org/parallel.ts` runs a merge queue, and when two agents
touch the same file the second one does not merge, it **escalates to a human lead**. So parallelism today
is bounded by *file ownership*, not by how many workers exist. Spawn 500 agents on one product and you do
not get 50x the output, you get one merge queue and 499 escalations.

Worth noting: Pancake's own published list of unproven areas includes **"agent conflict and duplication
handling."** The twin ran into exactly this.

**"Each agent sees what is happening and immediately updates itself"** describes a real architecture (a
shared blackboard with an event bus). It is also the classic failure mode: every agent reading every event
means context grows with the square of activity, cost follows, and agents begin duplicating and undoing one
another. The fix is the opposite of what it sounds like: **fewer agents, sharper ownership boundaries,
explicit handoffs.** Which is what the org DAG already does.

**So the honest answer: 56 is not too few. It may be too many.** A build run activates about ten. The right
question is not "how many agents" but "how many files can one run change, and how many runs can chain
before quality degrades." That is the ceiling worth attacking.

---

## Part 2 · The raw structure of an MNC

Every large company, whatever the industry, is six layers. The names change; the layers do not.

```
  1  GOVERNANCE      board, officers, audit committee       owns LIABILITY
  2  DIRECTION       strategy, product, portfolio           owns WHAT and WHY
  3  VALUE CREATION  the thing you actually sell            owns HOW
  4  GO TO MARKET    marketing, sales, partners, support    owns WHO PAYS
  5  ENABLING        finance, legal, HR, IT, procurement    owns CAN WE
  6  ASSURANCE       risk, compliance, quality, security    owns SHOULD WE
```

### Three real companies, same six layers, different shapes

**TCS, a services MNC (roughly 600,000 people).** Organised as a **matrix**: industry verticals (banking,
retail, healthcare, manufacturing) crossed with service horizontals (consulting, cloud, AI, security). An
account team sits at each intersection. Delivery happens in delivery centres.

The structural fact that matters most to you is the **pyramid**. Roughly 70% of headcount is junior, doing
work that is repeatable and specified by someone above them. Perhaps 20% is mid-level review and
coordination. The top 5 to 10% is judgment, client relationships and signature authority.

**Apple, a functional MNC (roughly 160,000 people).** Famously *not* divisional. There is no "iPhone CEO."
Design, Engineering, Operations, Marketing, Retail, Services, Legal and Finance each run company-wide,
led by experts in that function rather than general managers. Decisions escalate to a small number of
people who are accountable for taste.

**SpaceX, a vertically integrated engineering company (roughly 13,000 people).** Programme-based (Falcon,
Starship, Starlink) crossed with functional (propulsion, avionics, structures, manufacturing). It builds
almost everything in-house rather than buying, which is why its headcount per dollar of output looks
unusual.

### The insight this hands you

**Automation eats the pyramid from the bottom.** The 70% doing specified, repeatable work is exactly what
an agent org replaces. The 5 to 10% at the top is relationships, judgment and liability, which is exactly
the human-only work in `lib/org/coverage.ts`.

So "why is nobody running a whole MNC on AI" has a structural answer rather than a technological one:
**the top of the pyramid is not a task queue.** A client relationship, a board seat, a regulator's
question and a signature are not work items that can be assigned. They are positions of accountability
held by a named person. You cannot automate the apex, and the apex is what makes it a company rather than
a workshop.

Which means our 46.7% automated and 81.6% of automatable is not a shortfall against 100%. **It is
approximately the shape of the pyramid, correctly identified.** Salesforce, with unlimited money, landed
at 50% agents and 50% humans. That is not a coincidence, it is the same structure.

---

## Part 3 · What a WHOLE autonomous company would actually need

Grouped by the six layers. Marked by whether we have it, and what is genuinely missing. This is the list,
and it is longer than a feature backlog because most of it is not software.

### Layer 1 · Governance (own the liability)

| Needed | State |
|---|---|
| A legal entity that can hold contracts and liability | **MISSING.** No C-corp |
| A named accountable human with authority to sign | Have (the founder) |
| Board or advisory oversight with real review | **MISSING** |
| D&O and E&O insurance | **MISSING** |
| Kill switch, out of band | **HAVE**, tested |
| Append-only audit trail of every decision | **HAVE**, hash-chained |

### Layer 2 · Direction (decide what and why)

| Needed | State |
|---|---|
| Turn a goal into an ordered plan with owners | **HAVE** (`plan.ts`, `org-plan.ts`) |
| Institutional memory so decisions are not re-litigated | **HAVE** (`beliefs.ts`, provenance-graded) |
| Real customer discovery | **MISSING.** Needs users, not code |
| Portfolio choice: kill a product, not just build one | Partial (validation says do not build; nothing retires a live product) |

### Layer 3 · Value creation (make the thing)

| Needed | State |
|---|---|
| Write, review, test and ship software | **HAVE**, proven live |
| Provision infrastructure | **HAVE** (`provision.ts`) |
| **Raise the per-run ceiling above ~10 files** | **THE REAL GAP.** This is what limits product size |
| **Chain many runs without quality decay** | **MISSING.** Never driven past a few runs |
| Live database migrations without data loss | **MISSING** |
| Be paged and fix production at 3am | **MISSING.** No paging wired |
| Accessibility and security audit | **MISSING** |

### Layer 4 · Go to market (find who pays)

| Needed | State |
|---|---|
| Content, SEO, landing pages | **HAVE** |
| Outbound drafting behind a publish gate | **HAVE** |
| Real sends on the major platforms | Partial (3 real, LinkedIn and X written but unproven) |
| Phone conversations with prospects | **MISSING.** No voice, and legally gated |
| Paid acquisition | **MISSING** |
| Pipeline and CRM operation | Integrate only |
| Close a deal | **HUMAN BY DESIGN.** The signature never automates |

### Layer 5 · Enabling (keep it running)

| Needed | State |
|---|---|
| Spend control with escalation | **HAVE** (treasury envelopes) |
| Monthly close and cash forecast | **HAVE**, and it refuses to invent numbers |
| **Invoice and collect money** | **MISSING.** Blocks the whole revenue chain |
| Payroll and tax filing | **HUMAN BY DESIGN** |
| Hiring and firing | **HUMAN BY DESIGN** |
| Vendor and procurement management | Partial (drafts, human commits) |
| Secrets custody and rotation | Partial (env vault; no per-customer HSM) |

### Layer 6 · Assurance (make sure we should)

| Needed | State |
|---|---|
| Deterministic policy floor before any action | **HAVE** |
| Six hard-stops no config can disable | **HAVE**, frozen and tested |
| Truth governance on outbound claims | **HAVE**, and almost nobody else has it |
| Failure drills | **HAVE** |
| **SOC 2 / HECVAT / DPA** | **MISSING.** Blocks the university sale |
| Named-statute compliance (CAN-SPAM, TCPA, AI disclosure) | Partial (rails exist; a lawyer has signed nothing) |

### The honest count

Of roughly 34 requirements: **14 held, 6 partial, 9 missing-and-buildable, 5 human by design.**

**The five that unblock the most, in order:**

1. **Invoicing.** Nothing downstream of revenue exists without it.
2. **Raise the per-run file ceiling.** This is what caps how large a product can be, and it is the true
   limit on "build a real company's software."
3. **A legal entity.** Gates governance, insurance, banking and the university contract.
4. **SOC 2 / HECVAT.** Gates the campus sale specifically.
5. **Paging.** Turns "it runs" from a claim into something a buyer can rely on.

Note that only two of the five are code. That is the real reason nobody has built a whole autonomous
company: **most of what a company is, is not software.**
