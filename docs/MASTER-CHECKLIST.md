> ⚠️ **GOAL SUPERSEDED.** The "2,000 waitlist signups" anchor is superseded — north star = **PPU (Proven Paying Users)** per [REVENUE-RUN.md](REVENUE-RUN.md).

# Master checklist — competitor.inc to the vision

> **The vision (your words):** ~**2,000 waitlist signups** + ~**$10K MRR** within a month of launch —
> **driven by the in-house (House) agents.** That's when the idea is *entirely validated.*
> This doc verifies the project inch-by-inch (Checklist Manifesto) and routes every play toward that goal
> (Levels default-alive · Walling revenue · Hacking Growth/AARRR · Bullseye · Ellis 40% PMF · 7 Powers).

---

## 0 · The vision, made precise — and the honesty fix you need first

**The reframe (the question you never asked):** *what does "the agents did it" actually mean?* It **cannot**
mean 100% autonomous — for two reasons you already accepted: (1) the product itself is **human-in-control by
design** (the Approval Inbox is the whole point), and (2) **cold-start trust-work can't be automated** — an
AI mass-DMing communities is spam, gets banned, and destroys the trust we sell. So:

> **Validation = the leverage ratio, not full autonomy.** The agents carry the **scalable ~85%** (build,
> run, content, SEO, ad-execution, support, the waitlist + referral engine, measurement, nurture); **you**
> do the irreducible **~15%** (the trust-spark — HN/Reddit/founder DMs, founder-in-thread — plus judgment +
> approvals). **At 2,000 signups + $10K, measure: what % of the work was *you*? Lower = stronger validation.**
> That is the honest, achievable, on-brand definition of "the agents did it." Instrument it from day one.

**The funnel math (so 2,000 isn't a vanity number):** 2,000 signups × ~10% signup→paid ≈ **~200 paying** ×
~$39 ≈ **~$7.8K MRR.** So 2,000 is *roughly* the right top-of-funnel for $10K — but only if conversion holds.
Levers to clear $10K: tighten signup→paid, add the **Studio $99 / annual** tier, or push toward ~2,500
signups. **Waitlist signups are the leading metric; activated-and-paying is the real one.**

---

## 1 · Questions you never asked (answer these *before* launch)

- [ ] **The leverage bar:** what % of the work must the agents do for *you* to call it validated? Pick the
      number now (e.g. ≥80%) and instrument it — otherwise "agents did it" is unfalsifiable.
- [ ] **Cold-start:** agents can't authentically get the first ~100 users. **What is *your* irreducible
      role** in launch week, and are you physically available to do it (you're graduating / possibly leaving the US)?
- [ ] **Is the viral waitlist even built?** 2,000 signups needs a **referral / "skip-the-line" loop** — do we
      have it, or is `/join` just a form? (Likely a build item.)
- [ ] **Do the marketing agents actually produce output yet,** or is that aspirational until the real engine
      is live? Verify each can generate its artifact before you depend on it.
- [ ] **Conversion reality:** what if 2,000 sign up and nobody *pays* (or <40% are "very disappointed" at the
      PMF gate)? What's the plan when the waitlist is big but dead?
- [ ] **Legal/ownership:** Are you incorporated? Is the friend a **co-founder (equity)** or a contractor?
      **Who is liable** when an agent spends or posts on a *user's* behalf? ToS + an approval audit trail?
- [ ] **Compute at scale:** at 2,000 users hitting the free tier, do the free-tier API rate limits hold, or do
      you hit a wall (and a bill)? Who pays when it scales past free?
- [ ] **Brand-safety:** an agent posting/spending publicly *is* a risk to the trust we sell — is every
      consequential agent action provably **approval-gated**? (Verify, don't assume.)
- [ ] **Support at scale:** when 2,000 users arrive with problems, can Guard actually handle it, or do you drown?
- [ ] **Retention:** $10K MRR means *keeping* them — what's the churn-save plan, not just acquisition?
- [ ] **The friend dependency:** the whole live system needs his deploy + the real agent live. **Contingency
      if he's slow/unavailable?**
- [ ] **Kill criteria:** if it's *not* working by end of month 2 — what's the honest go/no-go (see §4)?

---

## 2 · The inch-by-inch checklist (by phase)

### Phase A — Pre-launch readiness (Checklist Manifesto · Levels default-alive · QA/Security)
- [ ] Friend: **merge fork → main**, **repoint Vercel → main**, redeploy, **House security live**, **Supabase
      auth + founder allow-list**, **real agent live**, **free-tier AI provider** (NVIDIA NIM/Groq) wired.
- [ ] `npm run qa` green on the merged main; security pass (`/cso`-style) on real-execution paths.
- [ ] **Build the viral waitlist** (signup + referral loop + Founding seats) **+ instrument the funnel** (so
      the leverage ratio is measurable).
- [ ] Incorporate · ToS/privacy (esp. agents-acting-for-users) · co-founder equity locked.
- [ ] Launch assets ready: the **trailer**, the **10 reels** (content-plan.md), the demo.

### Phase B — Launch (Surprise-launch · Bullseye)
- [ ] Big-bang launch (HN / Product Hunt / X / waitlist) — **you** front the trust-spark; **agents** produce
      + scale the content.
- [ ] Agents run the **Bullseye 5-channel test**; you do HN/Reddit/DMs.
- [ ] Per-channel signup rate measured; **agent-vs-human split logged.**

### Phase C — The 2,000 waitlist + the funnel (Hacking Growth / AARRR)
- [ ] **Acquisition:** double down on the 1–2 channels that convert (kill the rest).
- [ ] **Activation:** signup → first validation run (the "aha"). Guard owns it.
- [ ] **Referral:** the skip-the-line loop runs (agents) → compounding signups toward 2,000.
- [ ] **Revenue:** waitlist → paying (Ledger + you). Track signup→paid %.

### Phase D — Retention & ops (so $10K *holds*) (Walling)
- [ ] Guard handles tier-1 support at scale + churn-save; the morning report runs.
- [ ] Net MRR (not just gross) climbing; churn < ~6%/mo.

---

## 3 · The House crew → the job (who does what)

| Agent | Owns toward the goal | Human (you) provides |
|---|---|---|
| **Apex** (CEO) | North Star, weekly review, kill/scale calls | the final go/no-go |
| **Pitch** (marketing) | launch assets, gated ad tests, the reels | the founder-voice + approval to spend |
| **Surge** (growth) | Bullseye tests, the referral/waitlist loop | the trust-spark (HN/Reddit/DMs) |
| **Quill** (content/SEO) | comparison content, the compounding channel | quality gate |
| **Echo** (community) | drafts outreach, monitors communities | *you* send the cold trust DMs |
| **Ledger** (revenue) | trial→paid nudges, pricing | pricing approval |
| **Guard** (support) | onboarding, support, churn-save | escalations |
| **Quant** (analytics) | the funnel + **the leverage ratio** | reads the scoreboard |

**The point:** agents do everything *scalable*; you do the irreducible trust + judgment. The validation is
that **your 15% was enough** because the agents carried the 85%.

---

## 4 · The gates (go/no-go)
- **PMF gate (end of ~week 4):** Ellis 40% test ("how would you feel if you couldn't use it?"). ≥40% "very
  disappointed" → pour fuel. <40% → fix before spending.
- **Leverage gate:** at 2,000 + $10K, human-effort share ≤ ~20% → *validated.* If you did the majority → the
  autonomy thesis isn't proven yet (still a business, but not the vision).
- **Win:** ≥2,000 signups **and** ≥$10K MRR by end of month 2 → ship the **success-story post** (the meta-proof).
- **Keep-going:** 1,000+ signups + $3–5K MRR + healthy retention → continue, don't kill a near-miss.
- **Kill/pivot:** <~$1.5K MRR, flat week-over-week, no working channel → stop and reassess.

> **The honest north star:** the prize isn't 2,000 or $10K — it's proving **one human + an agent crew = the
> output of a team**, on a product people trust. Hit the numbers with the agents carrying the load, and the
> entire thesis is validated — by the product, on itself.
