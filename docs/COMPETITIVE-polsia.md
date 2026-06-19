# Competitive Analysis — competitor.inc vs Polsia

> **The playbook:** Hamilton Helmer's **7 Powers → Counter-Positioning** — beat an incumbent not by
> copying it, but by adopting a superior business model the incumbent *can't* copy without damaging its
> existing one. Paired with **April Dunford's "Obviously Awesome"** for the positioning statement.
> Roadmap decisions made through the **Pieter Levels / MAKE** lens (smallest validated wedge, ship real,
> default-alive). Internal — see [README §11](../README.md).

---

## 1 · Who Polsia is

[Polsia](https://polsia.com/about) (Ben Broca, late 2025) builds **and runs** a whole company with ~9
AI agents + a nightly "AI CEO" that wakes up, decides what to do, executes, and emails the founder a
morning summary. End-to-end: idea → live product → ads/support/sales. Real integrations: **GitHub,
email, Meta Ads, X, Stripe.** Reasoning on Claude.

- **Pricing:** $49/mo **+ 20% of revenue + 20% of ad spend.** Free tier exists.
- **Traction:** ~$10M ARR, ~7,600 customers, ~85% M2 retention, $30M raised @ $250M valuation.
- **The crack:** **Trustpilot 2.1/5** — *"tasks marked complete without deploying," "credits burned on
  failed runs."* Autonomy + speed-over-proof + a 20% cut have produced a **trust problem.**

Sources: [Tim Frin](https://timfrin.substack.com/p/how-polsia-builds-and-runs-companies) ·
[Product Hunt](https://www.producthunt.com/products/polsia) ·
[preuve.ai review](https://preuve.ai/blog/polsia-review) ·
[Mixergy interview](https://mixergy.com/interviews/is-polsia-a-250m-scam-i-asked-the-founder-to-his-face/).

---

## 2 · How close are we? (honest gap analysis)

competitor.inc is the **same category** as Polsia (AI agents build + run a company, nightly heartbeat,
live stream). On **concept and craft** we're a peer or better; on **real execution + traction** we're far
behind; on **trust / control / ownership / validate-first** we're philosophically *ahead by design*.

Legend: ✅ have it · 🟡 partial/scaffolded · ⛔ gap.

| Capability | Polsia | competitor.inc | Status |
| --- | --- | --- | --- |
| Named agent crew | ~9 agents | 5 ([`AGENTS`](../lib/roomie/types.ts)) | ✅ concept (fewer) |
| Live activity stream | live stream | Glass Box + `/live` + 3D `/delegation` floor w/ live agent conversation | ✅ (arguably better) |
| Nightly heartbeat | AI CEO + morning email | `/api/cron` nightly ([cron](../app/api/cron/route.ts)) | 🟡 scaffolded; **no morning email** |
| Real reasoning model | Claude | BYOK + `ANTHROPIC_API_KEY` ([server](../lib/roomie/server.ts)) | 🟡 wired, off by default |
| **Build a real MVP** | real code | **simulated** (ships a placeholder URL) | ⛔ **biggest gap** |
| Deploy to live product | real | simulated | ⛔ gap |
| GitHub / email / ads / Stripe | real | none | ⛔ gap |
| Auth + multi-company persistence | real | Supabase scaffolded, not provisioned | 🟡 |
| **Validate demand BEFORE building** | ❌ builds immediately | ✅ Validation Gate (4 experiments + honest verdict) | ✅ **differentiator** |
| **Proof on every action** (URL/build/metric) | ❌ "marked complete w/o deploying" | ✅ Glass Box proof + cost | ✅ **differentiator** |
| **Auto-refund failed tasks** | ❌ "credits burned on failed runs" | ✅ failed-refunded in ledger | ✅ **differentiator** |
| **Human-in-the-loop approval** | mostly autonomous | ✅ Approval Inbox for spend/outreach/deploy/delete | ✅ **differentiator** |
| **Revenue share** | **20% of revenue + 20% of ads** | **0% — own your upside** | ✅ **differentiator** |
| Own-your-data / export | unclear | ✅ one-click JSON export | ✅ likely diff |
| Traction / funding | $10M ARR, $30M raised | pre-launch demo | ⛔ gap (expected) |

**One-line read:** we are ~**1 real integration away from being a credible, trustworthy alternative** —
and we already have the entire *trust layer* Polsia is getting hammered for lacking.

---

## 3 · The counter-position (why we can win, and why Polsia can't just copy us)

Polsia's three growth levers — **(a) full autonomy, (b) a 20% take rate, (c) speed over proof** — are
exactly what produce its 2.1/5 trust score. competitor.inc is the **mirror image, by design:**

> **"The honest AI co-founder. It proves demand before it builds, shows its work with real proof, asks
> before it spends, and never takes a cut. You stay the founder."**

This is **counter-positioning (7 Powers):** Polsia *structurally cannot* adopt our model without
undermining its own pitch —
- It can't drop the 20% cut — that's its revenue engine and its $250M story.
- It can't add hard human-approval gates — that breaks the "runs while you sleep" magic it sells.
- It can't lead with "validate first / we'll tell you *not* to build" — that slows the very sign-ups it's
  optimizing for.

So our wedge isn't "do what Polsia does, cheaper." It's **"do the opposite of what's hurting Polsia,"**
aimed straight at the segment burned by tasks-marked-done-without-deploying and the 20% tax.

**Positioning (Dunford):** for **the skeptical, cost-conscious founder** who tried (or fears) autonomous
builders, competitor.inc is the **proof-first** company-builder that **validates before it builds, logs
every action with verifiable proof, refunds what fails, and takes 0%** — unlike Polsia, which builds
blind, can mark work "done" without deploying, and taxes your revenue.

---

## 4 · What else is to be done (roadmap — Levels lens: smallest validated wedge first)

The **only** thing separating us from "credible Polsia competitor" is **real, verifiable execution.**
Build it proof-first so every step *reinforces* the counter-position. Order by signal-per-effort:

**Phase 1 — Make the brain & the build real (the wedge).**
- [ ] Turn on the real model by default path (already supported) — validate + shift + chat run on Claude.
- [ ] **GitHub integration** (Forge): create a repo, commit real code, open a PR. Proof = a **real commit SHA / PR URL**. This is the cheapest, highest-trust "it actually built something" proof — and it directly answers Polsia's "marked complete without deploying."
- [ ] **Verify-before-claiming:** a task is only `done` if its proof artifact is reachable/valid; otherwise **auto-refund**. This is the moat — codify it.

**Phase 2 — Make it live.**
- [ ] **Vercel deploy** (Forge): real deploy, proof = a live URL that returns 200. "Your product is *actually* live."
- [ ] **Morning email summary** (match Polsia's loved feature) via the nightly cron — through the Approval Inbox for anything consequential.

**Phase 3 — Make it earn (still human-gated).**
- [ ] **Email** (Resend) for outreach/support · **Stripe** for real revenue (you keep 100%) · **Ads** (Meta/Google) for Pitch — each routed through the Approval Inbox.

**Phase 4 — Make it persistent & multi-tenant.**
- [ ] Provision **Supabase** (auth + RLS already written) → real multi-company persistence + the nightly cron live for every operating company.

**Always-on (the trust moat):** every Glass Box action carries a **verifiable** proof; failed
verification **auto-refunds**; consequential actions **wait for your yes**; **0% revenue share**;
one-click export. Build-in-public the whole way (Surge).

**Pricing counter-move:** keep **Validate $0 / Operator $39 / Founding $99 once — no revenue share.**
Make "you keep 100%" a headline next to Polsia's 20%.

---

## 5 · Scorecard

| Dimension | vs Polsia |
| --- | --- |
| Concept & category | **At parity** |
| Craft / UX (3D floor, Glass Box, live conversation) | **Ahead** |
| Trust / control / ownership / validate-first | **Ahead by design** (their weak spot) |
| Real execution & integrations | **Behind — Phase 1–3 closes it** |
| Traction / funding | Behind (pre-launch) |

**Verdict:** we are a **credible counter-positioned competitor one real integration away from proof.**
Ship Phase 1 (real model + GitHub proof + verify-before-done) and we can *honestly* say: "Polsia builds
blind and takes 20%. We prove it, show it, refund what fails, and take nothing."

---

*Analyzed with 7 Powers (counter-positioning) + Dunford positioning; sequenced via the Levels playbook.*
