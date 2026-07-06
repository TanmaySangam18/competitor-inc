# Free-to-Paid Strategy — the CPO call (2026-07-06)

_Playbooks: **Product-Led Growth** (Wes Bush) · **Reverse Trial** (Elena Verna / Kyle Poyar) · **Hooked**
(Nir Eyal — habit before the wall) · **Aha / Time-to-Value** (Sean Ellis) · **Value-Metric Pricing**
(ProfitWell) · house: [`PLAYBOOK-conversion-gating.md`](PLAYBOOK-conversion-gating.md) (value before
capture; never wall the aha) + [`pay-to-reveal-funnel`]. Ties to [[freemium-flow-and-model-decision]],
[[path-to-paid-f1]] (F1/OPT: waitlist now, flip paid later)._

## The core principle (the founder's, and it's right)
**Never wall the aha.** The whole positioning is "prove it before you build" — the *validation verdict*
and *watching agents build a real thing* ARE the wow. Gating those kills acquisition and contradicts the
brand. The paywall lives DOWNSTREAM of value: after they've felt it, at the moment they want to *keep
going* (endowment effect — "it's already mine, I don't want to lose momentum").

## The two ahas (protect these — free forever)
1. **Verdict aha** — paste an idea → an honest demand verdict (including "don't build this"). ~60s.
2. **Build aha** — agents ship a *real, openable* site/app for the idea. "It actually built something."

Time-to-first-aha target: **under 2 minutes, before any signup.** (Signup comes AFTER the verdict, per
conversion-gating — capture once they're impressed, not at the door.)

## Recommended model: Freemium aha + **Reverse-Trial on the Operate layer**
Three models compared:
| Model | What it does | Verdict |
|---|---|---|
| Pure freemium | free tier forever, paid unlocks features | Widest funnel, but users *never taste* the compounding layer (autopilot/real ops) → under-monetizes |
| Pure free trial | full product free for N days, then pay-or-lose | Highest urgency, but it walls the aha behind signup + a clock → kills top-of-funnel acquisition |
| **Freemium aha + reverse trial on Operate** ✅ | aha is free forever; the *high-value operate layer* (autopilot, real-world actions) gets a time-boxed full-access taste after the first build, then converts | **Best of both** — widest funnel AND monetizes the habit-forming layer after the user has felt its magic |

**Why this wins CLV:** everyone gets the aha (acquisition), the reverse trial makes them *experience*
autopilot + real deploys (the dream) so the wall lands on desire not restriction, and the value metric
(below) scales revenue with the value they actually get.

**Value metric = the running company.** Price scales on: (a) active companies, (b) autopilot (runs while
you sleep), (c) real-world actions. These are what a founder would pay for; they scale with realized value,
not arbitrary seats.

## The tiering — every feature

### 1) FREE FOREVER (acquisition · trust · habit)
| Feature | Why free | Conversion effect | Risk |
|---|---|---|---|
| Idea validation / demand verdict | The aha + the whole positioning | Top-of-funnel; walling it would tank signups | Cost — mitigated by per-user caps + free-tier model routing |
| Build + preview **one** product | The second aha ("it built something real") | Endowment: it's "theirs" → strong pull to continue | Compute — mitigated by the $0 Aider/GitHub-Pages path |
| Watch the org run (simulated) | The magic show — sells autopilot | Creates *desire* for the paid real version | ~$0 (deterministic sim) |
| Glass Box, pixel crew, Company Brain | Transparency = trust (the "Governed" brand) | Differentiator vs Polsia; builds confidence to pay | None — these SELL the product |
| Playbooks tab | Free user resource; SEO + goodwill | Acquisition + authority | None |

> Moving any of these to paid = **lower** conversion (kills the aha). Keep free.

### 2) FREE WITH LIMITS (taste → natural upgrade point)
| Feature | Limit | Why | Conversion effect |
|---|---|---|---|
| Validations / shifts / goal-runs | per-day caps (15 / 30 / 20 — **already shipped**, migration 0022) | Cost control + a soft "you're clearly getting value" nudge | Converts the *engaged* at their peak-value moment |
| Active companies | **1** free; 2nd+ = premium | The value metric — a portfolio is a paid behavior | Clean, non-frustrating upgrade trigger |
| Real GitHub builds | a few free (then premium), or unlimited on the $0 Aider path but rate-limited | Let them ship for real once; scale = paid | Ties "make more real things" to upgrade |
| Keep-preview-live | free preview stays live N days | Loss aversion — pay to keep their live URL | Gentle, endowment-driven |

> Caps too tight = frustration (churn). Too loose = no reason to pay. Tune with data; start generous.

### 3) PREMIUM (scale · real · compounding — the upgrade magnets)
| Feature | Why premium | Upgrade desire |
|---|---|---|
| **Nightly Autopilot** ("runs while you sleep") | The dream; the compounding, habit-forming value | ⭐ Strongest magnet |
| **Real-world actions** — live deploy, real outreach/email, ad launch, payments | "Make it real"; touches money/customers | ⭐ Very strong |
| **Real backend apps** (DB/auth/multi-user SaaS) | Toy → real product | Strong |
| Multiple companies / portfolio | The value metric | Strong for power users |
| Operate layer + history/scorecard trends + Revenue Loop analytics | Long-term operating value | Retention driver |
| Higher wallet caps + premium models | Scale | Moderate |
| Verifiable proof board / receipts | The "Verifiable. Governed." enterprise trust layer | Moderate → high for serious users |
| Collaboration / teams | Multi-human (net-new) | Later |

> Making autopilot/real-actions free = **much lower** revenue (you'd give away the compounding value with
> nothing left to sell). Keep premium. Making them *trialable* (reverse trial) = **higher** conversion than
> hard-locking, because desire forms before the wall.

## Paywall triggers (ranked by conversion, least→most friction)
1. **Post-preview "keep building"** — after validate→build→preview (endowment). ← primary; already built as `NEXT_PUBLIC_WAITLIST_GATE` ([[freemium-flow-and-model-decision]]).
2. **"Turn on Autopilot"** — the dream moment.
3. **"Go live / deploy for real"** — real-world action.
4. **"Start a 2nd company."**
5. **Daily cap hit** — softest; a nudge, not a wall.

Rule: the wall should always appear *right after* a value moment, never before one.

## Onboarding → aha (fastest path)
1. Land → hero demo: type an idea, get the verdict live (no signup). **Aha #1.**
2. "Build it" → watch agents ship a real preview. **Aha #2.**
3. Signup captured here (they're impressed).
4. Offer the **reverse trial**: "Run it for real for 14 days — autopilot + live deploy on us."
5. Habit loop (Hooked): nightly digest ping → open → approve/watch → invest (configure crew/goal) → repeat.
6. Trial end / cap / 2nd company → the upgrade, framed as "keep the momentum," not "you're blocked."

## The generosity balance
Give away the **experience** (both ahas, the watch, the transparency) freely and unashamedly — that's
acquisition + brand. Charge for **continuation at scale and contact with the real world** (autopilot,
real actions, portfolios). The free tier should make them think *"this is incredible"*; the paid tier
should be *"I can't stop now."*

## F1/OPT reality (sequencing)
Can't charge yet → the "purchase" step is a **waitlist** now (capture intent, purchase-ready-but-off),
flipped to real Polar checkout when work-auth lands (one env var). The tiering above is designed so that
flip is a config change, not a redesign. See [[path-to-paid-f1]].
