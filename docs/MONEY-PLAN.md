> ⚠️ **SUPERSEDED.** Built on the abandoned build-in-public premise (see BUILD-IN-PUBLIC.md) and old economics. Canonical: [PATH-TO-10K.md](PATH-TO-10K.md).

# The Money Plan — <$100 to run, $10K in Month 2 (or kill it)

> Playbook: **Pieter Levels' indie-hacker model** (charge day one, keep fixed cost ~$0, pass-through
> the expensive parts, build in public) + **value-based pricing**. Goal: hit **~$10K in month 2**
> as the explicit go/no-go. Honest throughout — the $10K is a stretch and distribution, not product,
> is the bottleneck.

---

## 1. How does Polsia bear the AI/API cost? (decode)

From the sourced economics: Polsia's $49/mo is set to **roughly break even** on the nightly loop
(~$30/night AI + ~$5–10 infra). They cover the rest with:
1. **VC subsidy** — $30M raised. They burn investor money to buy growth now, fix unit economics later.
2. **Margin elsewhere** — **task packages** (~$2M) + **advertising** (~$2M, and stated as the
   *future* driver): they take margin on the **ad spend they manage on your behalf**.
3. **Partnership-discounted compute** — deals with AI-infra companies for claimed ~100× cost cuts
   (compute/engineers in exchange for traffic).

**Translation:** Polsia bears the cost by being **well-funded** and by **making AI spend the
customer's problem indirectly** (they profit on your ad budget). That model *requires* VC and a
willingness to lose money on inference. **We have neither, and don't want it.**

---

## 2. How WE run it for under $100 (the key move: don't own the AI bill)

The bootstrapper inversion: **never pay for inference. Pass it through.**

- **BYOK (Bring Your Own Key) for power use.** Paid users connect *their own* model key
  (Anthropic / OpenAI / OpenRouter). Their tokens, their bill. Our marginal AI cost ≈ **$0**. This
  is the single most important decision — it's why Polsia needs VC and we don't.
- **Free tier on genuinely-free models.** Free users get a rate-limited allowance routed through
  **free model tiers** (e.g., Gemini / Groq / OpenRouter free models — *verify current limits*),
  capped hard. Cost to us ≈ **$0**; upgrade or BYOK for real volume.
- **Validation never spends our money.** Organic experiments (landing page + waitlist + community
  posting) are $0. Paid ad smoke-tests run on **the user's own ad account/card** — we orchestrate,
  they fund. (Also keeps us honest: no ad rake.)
- **Free infra.** Vercel Hobby ($0) + Supabase free tier ($0) + Resend free email tier ($0).

### The actual budget (fixed, one-time/annual)
| Item | Cost |
|---|---|
| Domain (Porkbun/Namecheap) | ~$12/yr |
| Hosting (Vercel Hobby) | $0 |
| Database/auth (Supabase free) | $0 |
| Payments (LemonSqueezy — Merchant of Record) | $0 fixed (≈5%+30¢ per sale) |
| Email (Resend free tier) | $0 |
| Our own AI for demos/marketing | ~$20 (free tiers + a little) |
| Buffer (logo, a tiny launch ad test) | ~$30 |
| **Total** | **~$32–62 — under $100 ✅** |

Marginal cost per user ≈ **$0** (they bring the tokens; infra is free-tier). That's a structurally
**profitable-from-customer-#1** business — the opposite of Polsia.

---

## 3. Business structure (keep it dead simple)

- **You, solo.** No LLC needed to start. Incorporate *after* you've validated revenue (apply our own
  validation-first rule to ourselves).
- **Payments via a Merchant of Record (LemonSqueezy / Paddle / Gumroad).** They handle global
  sales-tax/VAT and pay out to an individual — no company required, ~$0 fixed. (Stripe later when incorporated.)
- **Pricing aligned with the thesis:** flat subscription, **no ad rake**, BYOK. *We make money when
  you succeed, never when you spend.*

---

## 4. Pricing & the path to $10K in month 2

**Value anchor (value-based pricing):** competitor.inc saves a founder *months and hundreds of dollars
of building the wrong thing.* Price against that pain, not against tokens (tokens are ~free to us).

### Tiers
- **Free — "Validate"** (BYOK or capped free-model allowance): run validations, see verdicts. Top of funnel.
- **Pro — ~$39/mo** (or $290/yr): unlimited validations, build-the-winner, the Glass Box, the board.
- **Founding Member — one-time $99 (launch only, capped at ~150 seats):** lifetime Pro + "Founding"
  badge. *This is the $10K lever* — it front-loads cash during the build-in-public launch.

### The $10K math (it's a distribution problem, not a pricing one)
| Path | Mix | ≈ Month-2 cash |
|---|---|---|
| **Founding-led (most realistic)** | 100 Founding × $99 | **$9,900** |
| Blended | 50 Founding ($4,950) + 70 Pro × $39 ($2,730 MRR) + 40 validation packs × $29 ($1,160) | **~$8,840 → push to $10K** |
| Pure subscription (hard) | ~$10K MRR = 256 × $39, or 101 × $99 | $10K MRR |

**The honest part:** ~100 paying customers in 8 weeks, solo, from zero, is **hard — most launches
miss it.** The product isn't the bottleneck; **distribution is.** What determines $10K:
- **Do you have/are you building an audience?** A waitlist + build-in-public following *before*
  launch is the #1 predictor. If you have ~0 audience today, the highest-ROI thing in the 14-day
  sprint is to **start the waitlist and build-in-public NOW**, not polish features.
- **Beachhead targeting:** indie hackers who got burned (post in their watering holes — IH, relevant
  subreddits, X build-in-public, relevant Discords). Ride the existing "is AI-company-builder slop?" skepticism.
- **A launch moment:** Show HN + Product Hunt + a build-in-public thread on launch day.

---

## 5. The go/no-go is itself validation-first (the meta-point)

"$10K in month 2 or kill it" is **competitor.inc's own thesis applied to competitor.inc.** You're not betting
years on a hunch — you're running a 2-month demand test on yourself with <$100 at risk. That's
exactly the discipline the product sells. Clean bet:
- **Hit ~$10K → real demand → take it ahead** (incorporate, scale, maybe the studio layer).
- **Miss badly → kill it** with ~$50 and 6 weeks lost, not 2 years and savings. *That's a win too.*

**Bottom line:** Polsia bears its AI cost with VC + ad-margin; we refuse to bear it at all (BYOK +
free tiers + free infra) → **~$50 total, ~$0 marginal cost, profitable at customer #1.** The $10K is
reachable mainly via a **Founding-Member launch deal + build-in-public to a beachhead** — and the one
thing to start *today* is the audience, because that, not the code, is what makes or breaks the number.
