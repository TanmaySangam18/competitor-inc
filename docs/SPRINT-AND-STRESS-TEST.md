> ⚠️ **SUPERSEDED (2026-07-03).** Part 1's 14-day Shape Up sprint targeted June 28 — passed. Canonical roadmap: [NEXT-BLOCKS.md](NEXT-BLOCKS.md). Part 2 (7 Powers defensibility) is still useful reading.

# The 14-Day Sprint + Defensibility Stress-Test

> Two playbooks: **Shape Up** (Basecamp) for the fixed June-28 deadline, and **Hamilton Helmer's
> *7 Powers* — Counter-Positioning** for "why won't Polsia just copy validate-first?" Today is
> **June 14, 2026** → **14 days** to ship. Grounded in the real online "AI wrapper has no moat"
> critique; honest about where we're vulnerable.

---

## PART 1 — The Sprint (Shape Up)

**Shape Up logic:** fix the *time* (June 28 is immovable), make the *scope* variable. When something
runs long, **cut scope, never the date** (circuit breaker). De-risk the scary unknowns *first*
(downhill before uphill). Ship a deployable increment every day.

### The bet (what we're shipping by June 28)
> A **deployed, public, repositioned** product — *"Prove it before you build it"* — where a user
> enters an idea, competitor.inc runs **real validation experiments**, returns an **evidence-backed
> verdict** (incl. honest "kill"), and only then offers to **build the winner**; wrapped in the
> Glass Box trust layer, with a public **"Roomie-validated" board**, launched build-in-public to
> indie hackers.

### Appetite & scopes (sequenced; cut from the bottom up if time runs short)

| Days | Scope (vertical slice) | De-risks |
|---|---|---|
| **1–2** | Reposition (landing + `soul.md` → "Prove it before you build it"); **wire the real model** (Anthropic key); **deploy to Vercel** day 1. | Narrative + the two scariest unknowns (real model, deploy) — done first. |
| **3–5** | **Real Validation Gate**: generate a real landing page per idea + waitlist capture; 2–3 experiment types (smoke-test, fake-door, outreach); **evidence-backed verdict** screen w/ confidence + signals + honest kill. | The core product value. |
| **6–7** | **Trust + persistence**: Supabase live (auth + multi-company); Glass Box polish; repurpose `/live` → **"Roomie-validated" board**. | "Demo → platform." |
| **8–9** | **Build-the-winner path**: post-validation flow that ships a real artifact (deploy a real landing/MVP) = proof-of-work made tangible. | The payoff loop. |
| **10–11** | **Beachhead polish**: indie-hacker onboarding, templates/examples, free-to-validate pricing, mobile/a11y/perf, tests. | Conversion + quality. |
| **12–13** | **Launch prep**: demo video/GIF, Show HN + Product Hunt drafts, the narrative, final QA + Lighthouse. | Distribution. |
| **14 (Jun 28)** | **Launch** — build-in-public, ship the board, open the doors. | — |

### No-gos for this sprint (explicitly OUT — build to the seam, don't fake)
Real ad **spend**, real payments/billing, at-scale cold email, enterprise/SSO, the fund/backing
layer, real infra provisioning. (These are post-launch; the validation loop + trust + deploy is the launch.)

### Operating rhythm (the "24/7" version, made real)
- **Daily:** one shippable increment + an end-of-day gate (`build` + `test` + preview verify). If a
  scope misses its day, **cut it, hold June 28.**
- **Build-in-public from day 1** (the distribution compounds while you build).
- **Honest note:** literal 24/7 isn't sustainable for 14 days; the plan survives 10–12 focused
  hrs/day. Protect sleep on launch-minus-1. Scope is the pressure valve, not your health.

---

## PART 2 — "What guarantees Polsia won't add validate-first?" (7 Powers)

**The honest truth first:** *There is no guarantee, and there shouldn't need to be.* A single feature
is **never** a moat — the entire online consensus is right that "the incumbent copies your feature
in a sprint." If our whole edge were a *validate* button, we'd lose. So the real question isn't
*"can they copy it?"* (they can) — it's *"will they, and would it even matter?"*

### Why they **won't** genuinely adopt it — **Counter-Positioning** (Helmer's strongest Power)
Counter-Positioning = a newcomer adopts a superior business model that the incumbent **rationally
declines to copy because it would damage their existing business.** Polsia is textbook-trapped:

1. **It kills their revenue model.** Polsia's *stated future* is **ad-spend margin** (~$2M today, "the
   future driver") + task packages. Validation-first explicitly tells users **not to build/spend
   yet** → it *suppresses the exact spend they monetize.* Genuinely adopting it cannibalizes them.
2. **It contradicts their brand/narrative.** Their identity is autonomy + spectacle ("AI runs your
   company while you sleep," AI gets equity, the Foundation). *"We'll tell you NOT to build this"* is
   off-brand and kills the viral story that drives their growth and fundraising.
3. **It tanks their vanity metric.** They optimize "companies/projects created" (120k generated) and
   WoW growth. Validation-first *reduces* things-built on purpose. A growth-narrative co. won't trade that.
4. **Founder sunk-identity.** Cera has publicly bet on maximal autonomy + "AI controls capital."
   Reversing to "human-in-control, validate-first" is a public thesis reversal.

→ So they might bolt on a **token** "validate" checkbox for PR — but they won't *re-center the
business* on it, because the model punishes them for it. **That gap is the counter-position.**

### And even a copy doesn't get them our actual moats (the other Powers we must *build*)
A feature is copyable; these compound and aren't:
- **Cornered Resource (data):** every validation run → a proprietary **"what signals predict real
  demand"** dataset. Calibrates over time; a late copier starts from zero.
- **Network / Scale Economies:** the **validated-founder community + "Roomie-validated" board** →
  more founders → more signal → better verdicts → more trust. Flywheel.
- **Branding:** in a space whose own discourse is *"is it slop / is it a scam,"* owning **"the honest
  one"** is durable and can't be bolted on.
- **Switching costs:** your validated history, assets, and audience live with us (and we *let* you
  export — trust as a feature, not a cage).

**Bottom line:** the defense is *not* the feature. It's **counter-positioning** (they won't, because
it breaks their model) **+ a data/community moat** (even if they do, they can't catch the flywheel).

---

## PART 3 — Stress-test: the hard questions (incl. real online ones), answered honestly

1. **"Polsia adds a validate step — you're dead." (the wrapper/no-moat critique)** → A feature ≠ our
   business model. They won't re-center (counter-positioning), and the moat is the data/community/brand
   flywheel, not the button. *Vulnerable if* we never build the flywheel — so the studio/board ships in the sprint.

2. **"How is *your* validation not slop too?"** (turning the trust critique on us) → Fair and sharp.
   Validation must be **real and auditable** — real landing pages, real traffic/signups, transparent
   methodology, raw data shown, confidence ranges (not false certainty). *If we fake validation we
   become Polsia.* This is our #1 execution risk; it's why "real experiments" is a day-3–5 priority.

3. **"Is 'AI runs your company' a hype bubble that pops?"** → Maybe the *autonomy* promise is
   over-sold (2.1★). But the underlying **job — "should I build this, and will it work?" — is
   evergreen**, independent of the hype. We bet on the durable job, not the buzzword. *Vulnerable if*
   we lean on the hype instead of the job.

4. **"Idea-validation tools already exist — why hasn't this been built?"** → Point tools exist
   (landing testers, survey tools). Nobody fuses **AI-orchestrated multi-experiment validation +
   build-the-winner + a studio/community** in one loop for non-technical founders. Thiel: own the
   small market first.

5. **"They outspend/outmarket you — how do you win distribution?"** → We can't out-spend $30M. We win
   the **counter-narrative** ("the honest, anti-slop one"), a **beachhead** (burned indie founders),
   and honest **build-in-public** — riding the existing "is it a scam?" skepticism *toward* us.

6. **"Models get so good validation is trivial / built into ChatGPT."** → Validation isn't a model
   capability — it's running **real-world experiments** (traffic, signups, spend) + judgment +
   accumulated calibration data. Better models *help* us; they don't replace the real-world proof loop.

7. **"People emotionally want to BUILD, not be told to kill it."** → Real. Tire-kickers want dopamine;
   Polsia sells it. We deliberately serve the **serious, willing-to-pay** segment who got burned and
   value truth > dopamine. *Honest tradeoff:* smaller TAM, far higher retention/WTP. We pick love over volume.

8. **"If your 'go' verdict fails, you've sold false trust — you become what you criticize."** → Yes.
   We must be **calibrated and humble** ("strong signal," not "guaranteed"), publish our hit-rate over
   time, and never overclaim. Trust is earned by being *right and honest about uncertainty*, not loud.

### The one-line verdict
The risk isn't that Polsia *can* copy a validate button — they can. The bet is that they **won't
re-center on it** (it breaks their ad-spend, autonomy-spectacle model) and **can't catch the data +
community + brand flywheel** if we start building it now. **Our job in 14 days is to make that
flywheel real — not just the feature.**
