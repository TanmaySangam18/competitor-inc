# competitor.inc — Positioning & Differentiation

**Tagline:** *The AI companion that runs your company — with complete autonomy, and complete honesty.*

**One-liner vs Polsia:** Polsia proved the category ("AI that runs your company while you
sleep") and then earned a **2.1/5 Trustpilot**. competitor.inc is the *trustworthy* version — we win
exactly where they break. We don't replicate Polsia; we ship the capabilities it's missing.

---

## Part A — Polsia's documented gaps → competitor.inc's answer

Every row below is a *real, sourced* Polsia failure (see `FOUNDER-JOURNEY.md §9`) turned into a
launch feature.

| # | Polsia gap (documented) | competitor.inc capability | Why it wins |
|---|---|---|---|
| 1 | **No validation** — builds before checking demand (user: weeks of work → 7 signups, $0) | **Validation Gate** — every company *starts* with a demand test (landing page + waitlist + small ad smoke-test). The agent won't build the product until a signal threshold is met. | Saves users from paying to build things nobody wants — Polsia's single biggest, most-quoted flaw. |
| 2 | **Fake "complete"** — tasks marked done that never deploy | **Proof-of-Work completion** — a task is "done" only with a *verifiable artifact*: live URL, passing build, screenshot, real metric. No proof, no "done." | Directly attacks "the AI lies about finishing." Trust through evidence. |
| 3 | **Hallucinated outputs** — "claims it's pulling info but isn't" | **Verify-pass + citations** — dual-model (creative generates → reasoning verifies); outputs carry sources and a confidence flag. | Borrows Polsia's own best idea and aims it at honesty. |
| 4 | **Credit waste + bad refunds** — failed tasks billed, partial refunds | **Transparent ledger + auto-refund** — every credit shows exactly what it bought; failed/duplicate tasks refund automatically. | Removes the #2 complaint cluster. |
| 5 | **20% blanket rake** — punishes unvalidated ideas; users balked | **Fair pricing** — flat subscription, **no revenue rake**. (Optional success-based fee only *after* validated traction, capped.) | Aligns price with value delivered, not value extracted. |
| 6 | **Lock-in** — work hard to recover when you stop paying | **Own-your-stack** — one-click full code + data export; deploy to *your* infra; eject anytime. | Turns "trapped" into "portable." A trust magnet. |
| 7 | **Support black holes** — escalations unanswered for weeks | **Visible support SLA** — agent handles tier-1; human-escalation SLA shown in-product with a live timer. | Fixes the thing Polsia visibly fails at. |
| 8 | **Unsafe autonomy** — AI emailed journalists *without approval* | **Approval Inbox (human-in-the-loop)** — consequential actions (spend, outbound comms, deploys, data deletion) queue for your yes/no. | This is *also* the correct fix for prompt injection (OWASP LLM01). Safety + product in one. |

---

## Part B — Net-new capabilities Polsia doesn't have (our offense)

These establish a stronger position from day one — not catch-up, but leapfrog.

1. **"Roomie" — a real companion, not "AI slop."** A *named* AI co-founder with persistent
   memory, a warm personality, and a daily standup ("here's what I did overnight, here's what I
   need from you"). Polsia's name literally means "AI slop"; ours is the partner you *want* in
   the room. Emotional moat.
2. **Validation-first methodology, built into the OS.** Not a feature toggle — the whole flow is
   *test demand → then build → then scale*. Polsia explicitly treats validation as the user's
   problem. We make it the product's spine.
3. **The Glass Box (Trust Dashboard).** A complete, human-readable audit log of every agent
   action, every dollar, every decision — with **one-click undo**. Radical transparency as a
   *product surface*, not just a marketing tweet.
4. **Reality-check audits.** The CEO agent runs honest "should we kill this?" reviews on unit
   economics and traction — a counter-cheerleader. Polsia optimizes for growth theater; we
   optimize for *your* outcome.
5. **Bring-your-own-model / Private Mode.** Swap the engine to a self-hosted open-weight model
   (Mistral/DeepSeek) so sensitive business data never leaves your box. A direct weapon against a
   cloud-only $49/mo competitor (see `LLM-ENGINE-COMPARISON.md`).
6. **Scoped-authority agents by default.** "Trust comes from constraints" — each agent gets
   least-privilege scopes (support can refund, can't touch payments, etc.), enforced, not vibes.

---

## Part C — Launch focus (what we build first)

We don't try to do everything Polsia does. We launch on the **four gaps that hurt Polsia most**,
because they're the most-quoted in negative reviews and the cheapest to be obviously-better at:

1. **Validation Gate** (gap #1) — the headline differentiator.
2. **Proof-of-Work + Glass Box** (gaps #2, #3 + offense #3) — visible honesty.
3. **Approval Inbox** (gap #8) — safe autonomy.
4. **Fair pricing + own-your-stack** (gaps #5, #6) — no rake, no lock-in.

**Positioning sentence for the landing page:**
> *"Polsia builds whatever you type. competitor.inc makes sure it's worth building first — then builds
> it in the open, shows its work, and never spends a dollar or sends a message without your say-so."*

---

## Engine decision (locked)
Frontier-model-first, behind a **swappable provider interface**. Ship reliability now (Polsia's
weakest point); offer self-hosted open-weight **Private Mode** as a privacy/enterprise upsell.
Details in `LLM-ENGINE-COMPARISON.md`.
