# Governing-Spec Plan — the 6 founder docs → business-ranked build candidates

**Created 2026-07-13.** Source: the six governing PDFs the founder sent — CLAUDE, MASTER_DIRECTIVE,
REQUIREMENTS, ORG_56_ROLES, INFRASTRUCTURE_AND_CREDENTIALS, HUMAN_TODO. This is the **decision sheet**: I
ranked every gap by *business value*, not by doc order. The founder picks what to greenlight; I build the
greenlit items **end to end** and **delete anything they supersede — forever** (no parking, no quarantine).

**Disposition rule (founder, 2026-07-13):** there is no "quarantine." Maintenance mode ≠ parking — it just
means *not live yet*. It lifts only when the safety spine + the simulation failure-drills pass (REQUIREMENTS
Definition of Done). Everything we build is meant to ship; everything superseded gets removed.

**Status legend:** ✅ built · ◐ seed/partial · ⬜ missing (code I can build keyless) · 🔒 human + money
(founder's 2%). **Verified against code 2026-07-13** (grep/read of lib, app, scripts).

---

## The headline (why these are the valuable ones)
The founder is **100% legally accountable** for everything the agents do. So the highest-value work is the
stuff that is *simultaneously* (a) the thing that makes it safe to charge a real customer and (b) the
sellable moat. That's the **safety spine**. It is not overhead — REQUIREMENTS §10 names it the product:
"compliance scaffolding AS the product… the sellable layer foundation labs won't build." Everything in
Tier A below pulls double duty as protection *and* differentiation.

---

## TIER A — the sellable safety spine (protects you + IS the moat) · **recommended greenlight**

| # | Item (plain English) | Business value | Now | Effort | Owner |
|---|---|---|---|---|---|
| A1 | **Black-box recorder + real stop button.** Append-only, tamper-proof log of *every* agent action (input, output, cost, tier, why) + an out-of-band kill switch that stops everything even if agents are compromised. | Without it you can't prove what happened in a dispute (you're liable) and can't truly stop a runaway. DoD #1 & #2. This is the #1 thing a serious buyer's lawyer asks for. | ⬜ (kill-switch *flag* exists; no immutable log, no out-of-band stop) | M | me |
| A2 | **The risk gate (T0–T3).** Evolve our current AUTO/QUEUE/BLOCK engine into the 4-tier scorer the spec wants: score every action on cost × reversibility × legal-exposure × blast-radius; auto only the cheap+reversible, hard-stop the irreversible for your signature. Default-deny anything novel. | This is the literal mechanism that keeps you at ~10 min/day *and* uninjured. DoD #3–#5. | ◐ (policy.ts is a strong seed) | M | me |
| A3 | **Dress rehearsal before any customer.** Add the mandated failure drills to our simulation harness: model outage, prompt-injection on a working agent, runaway spend, hostile customer, poisoned "facts," bad plan. Must pass before customer #1. | REQUIREMENTS §15 + MASTER_DIRECTIVE Phase 3 make this a **hard gate** — we literally cannot honestly go live without it. We already have the proving-ground base. | ◐ (proving ground exists; drills missing) | M | me |
| A4 | **Customer-abuse containment.** Screen customer intake against a prohibited-use list; classifiers watch each customer-company for spam/fraud/scaled-deception → auto-freeze that one customer's namespace without touching anyone else. | Their misuse is *your* legal exposure (REQUIREMENTS §14). One bad customer shouldn't be able to sink the platform. | ⬜ | M | me + 🔒 (lawyer signs the use-policy) |

---

## TIER B — the money you can prove (unlocks charging + pricing customer #1)

| # | Item | Business value | Now | Effort | Owner |
|---|---|---|---|---|---|
| B1 | **Per-customer unit economics + live spend telemetry.** Cost per task / per agent / per customer, read from the providers directly (not agent self-report); caps enforced at the payment/API source, not in a prompt. | The North Star *requires* "per-customer unit economics visible" before scale. You can't price or prove margin-positive customer #1 without this. | ⬜ (caps in code logic only) | M | me + 🔒 (provider keys) |
| B2 | **Stripe Connect per customer.** A customer's revenue lands in *their own* connected account; money never pools through us (money-transmission risk + clean books). | Lets a real stranger pay → the $10k path. Already queued as task #78. | ◐ (direction set) | M | me + 🔒 (Stripe verify) |

---

## TIER C — cheap, high-leverage hygiene (fast wins; unblock the "map before build" rule)

| # | Item | Business value | Now | Effort | Owner |
|---|---|---|---|---|---|
| C1 | **Reconcile 67 roles → the canonical 56 + AGENT_ROLE_MAP.** Fold/rename our model to the spec's 56 JDs, trim each to least-privilege, write the map. | MASTER_DIRECTIVE Phase 0 + prime rule "map before you build." Enables the whole least-privilege story. Low effort, high unlock. | ⬜ (we have ~67 differently-named roles) | S–M | me |
| C2 | **REGISTRY.md — the living inventory.** Every account, domain, key: what it is, who holds root, which agent has scoped access, renewal date, kill procedure. | Single source of truth for the audit + the human. Cheap. | ⬜ | S | me + 🔒 (founder fills real accounts) |
| C3 | **Verification separation, enforced.** An agent can never sign off its own lineage; regression suite re-runs on every prompt/model change. | Trust: we never ship broken work to a paying customer's users. DoD #6. | ◐ (QA + CI + ownership seeds) | M | me |
| C4 | **Precedent store.** Every human ruling becomes machine-readable policy so the same question never reaches you twice. | This is what makes "~10 min/day" real and compounds into a switching-cost moat. | ⬜ | M | me |

---

## TIER D — later / your 2% / matters more at scale

- **Vault / secrets manager** (Doppler/Infisical have free tiers) — I build the *client*; standing it up is 🔒.
- **Multi-provider model abstraction** (resilience vs. one provider's price/ToS/rate-limit = existential). ⬜
- **Prompts-as-code** — versioned system prompts, staged rollout, instant rollback. ⬜
- **Anti-Goodhart** — KPIs computed *outside* agent prompts, paired counter-metrics, Auditor gaming-hunt. ⬜
- **Ground-truth enforcement** — Librarian gatekeeper; "an agent's output is never a fact." ◐
- **GDPR/CCPA export + delete** per customer. ⬜
- **Human daily-review UI** — the batched 5–15 item digest + random audit sampler for a ~10-min session. ◐
- **Crown-jewel accounts** — entity/EIN, bank, insurance, domain registry-lock, 2× hardware keys, backup human. 🔒 (all HUMAN_TODO).

---

## My recommendation (one line)
Greenlight **Tier A (A1–A4)** first — it's the safety spine that is also the moat and the ship-gate — then
**C1/C2** as cheap parallel hygiene, then **Tier B** as we approach a real customer. Tier D waits.

## Honest reconciliation notes (things the docs assume that aren't true for us)
1. We don't have "56 agents already built to map." We have a ~67-role *model* + a 9-function execution
   engine + a build pipeline. Phase 0 for us = **reconcile**, not map-existing.
2. We've been building capability/UX (landing, dashboard, services, team room). Under the no-quarantine
   rule these either become part of the shipped product or get deleted — they are **not** parked. They stay
   dark behind maintenance only until the Tier-A spine passes.
3. A real chunk of this is the founder's money + legally human-only (Tier D 🔒). I build hooks; the accounts
   are yours.
