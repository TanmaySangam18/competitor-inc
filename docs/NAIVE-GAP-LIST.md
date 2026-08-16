# What is left, measured against Naive

Audit date 2026-08-16. Naive's primitive list taken from their own site and docs; ours verified by
reading this repo, not from memory. See [[naive-competitor]] in the operator's memory for the funding and
positioning facts.

The purpose of this document is to stop "catch up to Naive" being a feeling and make it a list with an
order. Three buckets: what is genuinely missing and worth building, what is blocked on money or law, and
what we should deliberately refuse to build.

---

## The honest headline

**Naive's bundle is wider than ours. Their governance is thinner than ours. Neither fact matters yet,
because we have zero external users and no working checkout.**

We hold 18 registered connections, a governed policy engine, an append-only audit ledger, six human
hard-stops, real semantic memory, browser hands with a stop floor, and a 50,000-member proving corpus.
What we do not hold is one paying customer, and the reason is not a missing primitive. It is that a
stranger cannot sign in, cannot pay, and must connect four services before anything runs.

Building the rest of Naive's bundle before fixing those two things would be building a wider front door
onto a house nobody can enter.

---

## Bucket A — real gaps, worth closing, in order

| # | Gap | State today | Why it matters | Size |
|---|---|---|---|---|
| A1 | **T0 onboarding: 4 keys → 1** | model + GitHub + hosting + database all required before anything runs | Our worst measured number in the category. Naive and Wix are at zero keys; Jules is at one. Nothing else on this list moves activation as much. | Large |
| A2 | **Checkout live (R1)** | Polar wired, `TIERS` is the source of truth, but products are not created and `NEXT_PUBLIC_CHECKOUT_URL*` is unset | There is no cash register. Everything downstream of revenue is theatre until this is done. Mostly founder actions, not code. | Small (founder-gated) |
| A3 | **Social publishing that actually publishes** | Drafts and the approval mandate exist; **zero real API calls to any platform** (verified: no `api.linkedin.com`, `api.x.com`, `graph.facebook.com` anywhere) | We claim an outbound loop and cannot complete it. Naive posts to 11 platforms. Ours should post to two or three, each behind the publishing mandate. | Medium |
| A4 | **Object storage** | Not present (no `storage.from`, no uploads) | Every built product that touches a file needs it. Naive ships it as a primitive. | Small |
| A5 | **Model routing breadth** | 6 providers (Anthropic, OpenAI, Gemini, Mistral, xAI, local Ollama) | Naive claims 300+ via a router. One OpenRouter adapter closes most of this gap in a day. | Small |
| A6 | **Outbound phone/SMS** | Twilio exists but is **founder-notification only**; reaching anyone else needs A2P 10DLC registration | Half-built is worse than absent: it reads as a capability and is not one. Either finish it behind the AI-disclosure rail or say plainly it is internal-only. | Medium + registration |
| A7 | **Invoicing for the customer's own customers** | Stripe Connect hooks exist (task #78), not finished | This is the money layer that makes a built product a business. Genuinely differentiating. | Large |
| A8 | **Integration count 18 → ~40** | 18 registered in `lib/core/connections.ts` | Lowest priority on this list. Breadth is table stakes and nobody buys on it. Do it last, if at all. | Ongoing |

---

## Bucket B — blocked on money or law, not on engineering

These are not tasks. Writing code against them now produces nothing shippable.

- **Entity + bank + KYC.** No C-corp, no filed capital. Naive's virtual cards and formation product rest
  on an entity and banking partners we do not have.
- **Work authorisation.** The EAD is not approved. It gates whether anything here can be sold at all,
  which makes it upstream of every item in Bucket A.
- **A2P 10DLC / carrier registration** for any outbound SMS beyond verified numbers.
- **Lawyer-signed ToS, AUP and insurance** before an agent speaks to a stranger on our behalf.

---

## Bucket C — deliberately NOT building, and why

Matching Naive item for item would mean copying the parts of their product that are liabilities.

- **LLC and EIN formation as a service.** Regulated activity, adjacent to unauthorised practice of law,
  and requiring registered-agent infrastructure. Also indefensible to sell company formation while unable
  to form our own.
- **Virtual cards and money movement.** Money transmission. Needs a BaaS partner and a compliance
  programme, and it contradicts the standing rule that funds-out is always human-only.
- **"No human in the loop."** This is Naive's headline claim and it is the exact thing we refuse. Our six
  hard-stops (account creation, accepting terms, authenticating, CAPTCHA, granting consent, paying) are
  the product, not friction to be removed. Their own docs concede the default tenant user is ungated and
  **222 of 271 tools assert no gate at all.** We should quote that, not copy it.
- **Fully managed credentials.** Tempting, because it is how they win onboarding. But it means holding
  customer keys and paying vendor bills on a zero budget. The right shape is Cofounder's graduation
  model: managed where we can afford it, ownership transferable on request. That is an A1 design
  question, not a separate build.

---

## What we have that they do not

Worth writing down, because the gap list above reads one-directional and the ledger is not.

- **Governed truth.** Nobody in the category governs whether the agent's claims are accurate. Not Naive,
  not Wix, not Paperclip, not OpenClaw. Our honesty gates, receipt signing and `/verify` do.
- **Named statutes.** California SB 1001, AB 2905, the Utah AI Policy Act, CAN-SPAM, TCPA appear on zero
  competitor pages surveyed. Unclaimed ground.
- **An append-only hash-chained audit ledger** and an out-of-band kill switch.
- **A proving ground.** 50,000 synthetic members, an ads auction that closes its books to zero micros,
  and a shard planner that measures fan-out. No competitor publishes anything comparable.
- **BYOK**, which sidesteps the resale-margin problem their $0.05-per-credit pricing carries.

---

## The order I would actually work in

1. **A1** — four keys to one. Nothing else changes activation.
2. **A2** — checkout live. Mostly your fifteen minutes, not mine.
3. **A3** — publishing that publishes, behind the mandate.
4. **A4, A5** — storage and the OpenRouter adapter. Both small, both remove an obvious "they have it, we
   do not."
5. **A6 or A7** — phone honestly finished, or the money layer. A7 is more defensible; A6 is cheaper.
6. **A8** — breadth, last, and only if a real customer asks for a specific integration.
