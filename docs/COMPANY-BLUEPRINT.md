> ⚠️ **SUPERSEDED (2026-07-03).** Early EOS/Traction blueprint using the internal "Roomie" working name; the canonical living blueprint (positioning, moat, cohort-owner beachhead, PPU north star) is [BLUEPRINT.md](BLUEPRINT.md). Kept as history.

# competitor.inc Inc. — Company Blueprint

> The company designed from the ground up on **EOS ("Traction", Gino Wickman)** — the proven SMB
> operating system — adapted to a **solo founder + autonomous agents**. The twist: **competitor.inc runs
> competitor.inc** (its own agents fill the org seats), so this blueprint *is also* the product's next
> layer ("Operate"). Goals layer = **OKRs**. Build cadence = **Shape Up**.
>
> Honesty up front: a *blueprint* and the *software operating layer* are buildable in our 3+8-day
> window. A literally-running real business is not — it begins at launch (June 28) and compounds.
> §9 draws that line clearly.

---

## 0. Why EOS
EOS gives every company six interlocking components — **Vision, People, Data, Issues, Process,
Traction** — and concrete tools for each (V/TO, Accountability Chart, Scorecard, Issues/IDS,
documented Processes, Rocks + meeting pulse). It's proven across tens of thousands of SMBs, and it's
small enough for one founder to run. We map the "People" seats onto competitor.inc's own agents.

## 1. Vision (the V/TO)
- **Core values:** Honest (tell the truth, even "don't build it") · Validation-first · Human-in-control
  (you stay the founder) · Glass-box transparency · No lock-in. (These already live in `soul.md`.)
- **Core focus (purpose · niche):** *Help people only build what's worth building.* Niche = founders
  who can't afford to build the wrong thing.
- **10-year target:** the default first step for anyone with an idea — "run it through competitor.inc."
- **3-year picture:** thousands of validated companies; the "Roomie-validated" board is a trusted
  signal; an "Operate" layer that runs the survivors.
- **1-year plan:** launch (Jun 28) → first 150 Founding members → **$10K in month 2 (go/no-go)** →
  the Operate layer in market.
- **Quarterly Rocks (this quarter):** (1) ship + launch v0.1.0; (2) 150 Founding members; (3) Operate
  layer v1; (4) prove validation accuracy (publish hit-rate).
- **Marketing strategy:** target = burned indie founders · 3 uniques = *validation-first, glass-box-honest,
  you-own-everything* · proven process = the loop below · guarantee = *"we'll tell you not to build it."*

## 2. People — Accountability Chart (seats → who/what fills them)
A real company is "the right people in the right seats." Here the seats are filled by the **founder**,
**competitor.inc's agents**, and one **contractor**:

| Seat | Filled by | Owns |
|---|---|---|
| **Visionary** | **You (founder)** | Vision, taste (the 20%), approvals, relationships |
| **Integrator / COO** | **Apex** (CEO agent) | Runs the day-to-day loop; nightly audit; "what to cut" |
| **Marketing** | **Pitch** | Content, ad tests, the launch engine |
| **Sales** | the **`/join` funnel** + Founding deal | Convert waitlist → Founding → paid |
| **Product / Eng** | **Forge** + you | Ship the winners, the platform itself |
| **Customer support** | **Guard** | Tier-1 support; refunds (not payments); SLA |
| **Growth** | **Surge** | Trends, referral loop, the `/live` board |
| **Finance** | **Apex** + the ledger | Unit economics (~$0 marginal), Founding revenue |
| **Deploy/Infra** | **techie friend** (contractor) | The runbook deploy; uptime |

→ Honest: it's one human + AI agents + a friend. The chart keeps it honest about *who's accountable
for what* even at n=1.

## 3. Data — the Scorecard (the few weekly numbers)
A handful of leading numbers, reviewed weekly. North-star / go-no-go = **$10K in month 2**.

| Metric | Why | Source |
|---|---|---|
| Waitlist signups | top of funnel | `/join` |
| Validations run | activation | engine |
| Validation→Build rate | does the core work | dashboard |
| Founding sales / MRR | the money | checkout |
| Active companies | retention | store/DB |
| Support first-response | trust | Guard |
| **Net marginal cost** | must stay **~$0** | BYOK + free tiers |

## 4. Process — core processes + how it all connects
The documented, repeatable processes (each becomes a runbook/automation):
1. **Validation** — idea → 4 experiments → evidence verdict (built ✅)
2. **Build-the-winner** — approve → real artifact (built ✅)
3. **Operate** — nightly heartbeat: agents work, you approve consequential moves (built ✅; deepened by §8)
4. **Support** — Guard answers, refunds, escalates with an SLA timer
5. **Marketing/content** — weekly cadence (the X/PH/blog loop from `launch/`)
6. **Sales/Founding** — waitlist → referral → Founding → Operator
7. **Finance** — nightly ledger rollup; keep marginal cost ~$0
8. **Weekly review** — founder + Roomie read the Scorecard, run IDS on Issues

**How it connects (the value loop):** `Attract (Pitch/Surge) → Validate (engine) → Build (Forge) →
Operate (Apex + agents) → Retain/Advocate (Guard + the /live board) → referrals feed Attract`. The
**Glass Box** is the spine — every step writes to it; the **Scorecard** reads from it; **you**
approve the consequential edges. (Diagram in chat.)

## 5. Issues — the IDS list
One running Issues list (product, ops, growth). Weekly: **Identify → Discuss → Solve** the top 3.
Anomalies in the Glass Box (failed tasks, churn, cost spikes) auto-surface as Issues.

## 6. Traction — Rocks + meeting pulse
- **Quarterly Rocks** (§1) → broken into weekly priorities.
- **Daily pulse:** the **nightly heartbeat** (the company literally runs itself overnight; you review in the morning).
- **Weekly pulse:** a 30-min "founder + Roomie" review — Scorecard, Rock progress, top-3 Issues (an L10 for n=1).

## 7. Dogfooding — competitor.inc runs competitor.inc
competitor.inc Inc. is itself a "company" inside the platform: Roomie's agents fill the seats (§2), the
nightly heartbeat is our daily ops, the Scorecard is our Data component. **Eating our own dog food
is the proof and the demo** — and the operating layer we build for ourselves becomes the product's
**"Operate"** tier (validation → build → *operate*), the natural step beyond launch.

## 8. The 8-day implementation plan (the "Operate" layer — Shape Up blocks)
Each block extends the existing platform and ends green on `npm run qa`.

| # | Block | Builds |
|---|---|---|
| O1 | Company-OS shell | An "Operate" view per company: Scorecard · Rocks · Issues · Cadence tabs |
| O2 | Scorecard | The weekly numbers, auto-computed from ledger/activities/validation |
| O3 | Rocks / OKRs | Quarterly goals + weekly progress, per company |
| O4 | Issues + IDS | Issues list; auto-surface Glass-Box anomalies; resolve workflow |
| O5 | Weekly review | A generated "founder + Roomie" weekly summary (model or simulated) |
| O6 | Dogfood seed | competitor.inc Inc. seeded as a company; agents wired to its seats |
| O7 | Function runbooks | Support macros, content cadence, finance rollup — to the seam |
| O8 | Harden + dry-run | a11y/perf, tests, runbook dry-run, tag v0.2.0 |

## 9. Feasibility — the honest verdict
**Yes, with scoping:**
- ✅ **Design the whole company (these 3 days):** done — this blueprint.
- ✅ **Build the software operating layer (8 blocks):** feasible — the foundation (companies, agents,
  ledger, Glass Box) exists; O1–O8 are additive. Same block-by-block discipline, each `qa`-green.
- ⚠️ **The real risk:** these 8 days (Jun 20–28) were the **pre-launch hardening window.** Building a
  big new Operate layer right before launch *adds surface to harden.* Disciplined options:
  - **(Recommended) Launch v0.1.0 on Jun 28 as planned; build the Operate layer as the immediate
    post-launch sprint.** Don't expand scope the week of launch.
  - **Or** fold a **lean Operate v1** (O1+O2+O6 only — Scorecard + dogfood) into launch as the
    differentiator, and cut the hardening of everything else. Higher risk.
- ❌ **What 11 days cannot do (founder's real-world work, ongoing, launch-dependent):** incorporate
  the entity, real accounting/taxes, real customers, real support volume, real ad spend, real
  content distribution. The blueprint gives the *process* for each; *running* them starts at launch
  and compounds. I build the systems; you (and Roomie) run the company.

## 10. Decision (playbook: one-way vs two-way doors + Shape Up)
Run the three paths through the deciding frameworks:
- **Bezos doors:** Launching v0.1.0 on Jun 28 is a **two-way door** — reversible, you keep shipping
  daily after. Two-way doors should be made *fast, with a bias to action* — don't wrap them in
  heavyweight, scope-adding process. Slipping the launch to cram in a big Operate layer behaves like
  a costly near-one-way door: you spend the launch window/momentum (Founding scarcity timing, the
  build-in-public moment) and **delay the $10K learning signal** — and lost time/momentum is hard to recover.
- **Shape Up:** the date (Jun 28) is fixed → **cut scope, never add it** before the deadline.
- **Lean Startup / cost of delay:** ship the smallest *validated* thing to start learning; gold-plating pre-launch is waste.

→ **DECISION: Path 1 (refined) — "Launch first, build Operate additively."**
1. **Jun 20–28:** keep the hardening window; **freeze the launch surface**. Use surplus time to build
   the Operate layer **additively + behind a flag / on a separate route** so it *cannot* destabilize
   the launch path.
2. **Jun 28:** launch v0.1.0 (the validated, hardened product) — bias to action.
3. **Post-launch:** flip the Operate layer on as **v0.2.0**; start running competitor.inc on this blueprint.

You still get the whole company built — just sequenced so a reversible launch is never put at risk
by a big new layer. The frameworks are unanimous: protect the launch, fast-follow the company OS.
