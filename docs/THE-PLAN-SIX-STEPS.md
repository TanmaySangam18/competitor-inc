# The plan: six steps, worked backwards, using what the 41 taught us

Written 2026-08-17 against the founder's goal, stated verbatim:

> 1. A university buys this license
> 2. Students log in
> 3. Set up everything under 3 minutes
> 4. Give a prompt inside their Slack to the agents
> 5. The agents build, ask to check, human approves, launch AND SELL (all by agents)
> 6. The student makes their first $1,000 in a single month
>
> We get paid from universities buying this license. The agents inside the product also run the product,
> controlled through the founder's Slack, repairing and versioning as needed.

**The ordering problem, first.** Step 1 is first in the chain and last in feasibility. Nobody sells a
campus license for a chain nobody has watched work, and step 1 is also the only step blocked by work
authorisation. So the plan runs **backwards**: make 6 possible, then 5, 4, 3, 2, and sell 1 last.

---

## The scoreboard, today

Every future turn reports against this table. Honest, not flattering.

| Step | State | Distance |
|---|---|---|
| 1 · university buys | **zero campuses.** No SSO, no HECVAT, no DPA, no seat pricing | Blocked on 2 to 6 existing, and on the EAD for the money |
| 2 · students log in | **nobody can sign in.** Production serves no Supabase config to the browser | Env vars, not code |
| 3 · setup under 3 min | one key required (was four). **Never timed** | Needs a real stopwatch and the key-inheritance design |
| 4 · prompt in their Slack | **impossible.** Only `app/api/slack/webhook/route.ts` exists; nothing reaches `dispatchFullstackBuild` | The single biggest gap |
| 5 · build / check / approve / launch | **build proven live twice.** Approval and publish gates real | Selling is the hole |
| 5 · SELL | drafts and gates exist. **No calls. No real LinkedIn or X send. No checkout** | See §Selling |
| 6 · student's first $1,000 | **zero.** Students cannot take money at all | Needs Stripe Connect (task #78) |

---

## Block A · Make step 4 real (the Slack door)

This is first because it is the interface the founder named, and it does not exist.

**Copy from Viktor** ("AI employee in Slack/Teams", funded, 20k+ teams claimed): the whole premise that the
org lives where the team already reads. Our teardown concluded they do tasks and we run companies, but they
validated the surface. **Copy from Houston**: a mission board where each card is a conversation, and
per-agent roles (Owner / Manager / Member) which map cleanly onto university admin / faculty / student.
**Do not copy OpenClaw's 30 channels.** Slack only, until Slack works.

Build: a slash command and an app-mention that reach `dispatchFullstackBuild`, stream progress into the
thread, and post the approval request as a Slack Block Kit card with Approve and Reject. The approval must
still pass the existing server-side keystone, because a Slack button is a client.

**Gate:** a prompt typed in Slack produces a live URL, with the approval answered in Slack.

## Block B · Make step 3 measurable (three minutes, timed)

**The insight that resolves our BYOK tension: the UNIVERSITY holds the key, not the student.** The campus
license includes the university's own model key, and students inherit it. That is not managed credentials
by us (we hold nothing, pay nothing), and it is not friction for the student (they connect nothing). It is
the only version of zero-key onboarding we can actually afford, and it falls out of the business model
rather than being bolted on.

**Copy from Cofounder**: graduation, so a student who wants to own their product can transfer it out.
**Copy from Bolt Cloud**: "no extra accounts" as the student-facing promise. **Copy from Jules**: one
connection as the bar to beat. **Copy from Ploy**: paste a URL, 60 seconds, as the target feel.

Build: campus key inheritance, and a real timer instrumented from first click to first agent output.

**Gate:** the median timed run is under 180 seconds. Published, not estimated.

## Block C · Make step 6 possible (the student can take money)

A student cannot make $1,000 through a product that cannot charge. This is task #78.

**Copy from Naive**: invoicing as a first-class primitive. **Copy from Polar**: merchant-of-record so
nobody deals with global VAT. **Copy from Stripe Connect**: the platform pattern where each student's
product has its own connected account, so their money is theirs and never touches us.

**Gate:** a test student product takes one real payment into an account we do not control.

## Block D · Selling, honestly (the hard one)

See §Selling below for the legal shape. In build terms:

**Copy from Ploy** ($27M, agentic marketing dept): the SEO factory and named playbooks, both already partly
adopted. **Copy from Artisan**: multi-channel sequencing structure, and note carefully that their dialer
queues calls for HUMAN reps rather than speaking itself. **Copy from Clay and Explee**: sourcing, opted-in
only, never a scraped graph. **Copy from Cal.com**: booking, already wired.

**Copy from Bland Guard Rails and Vapi's Recording Consent Plan.** These two are genuinely ahead of us and
they are the reason calling can be done legally at all: Bland monitors every AI response mid-call for TCPA
and recording violations and ends or transfers the call; Vapi writes an auditable `recordingConsent` and
`grantedAt` field, which is a signed consent receipt. That is our audit ledger applied to voice, and we
should build exactly that shape.

**Gate:** one real outbound message per channel, sent through the publish gate, with a receipt.

## Block E · Sell the license (step 1, last)

**Copy from Houston: seat pricing.** $12 to $15 per seat reads to a procurement office; credits do not.
Naive's $0.05-per-credit and Wix's credit tiers are consumer pricing, and a university buys seats.

Universities need artefacts before they need a demo: **HECVAT** (the higher-ed security questionnaire),
a **DPA**, **SSO** via SAML or Shibboleth, and an accessibility statement. None exist yet. The door is
already identified: SGA resolution RG-SP-26-102 (Feb 2026) created a Co-op Working Group and an AI Advisory
Board, and said students "never had a formalized avenue." Integrate with NUworks (which is Symplicity),
never replace it.

**Gate:** one signed pilot agreement, paid or unpaid. Unpaid is legitimate progress and needs no EAD.

---

## Selling means calling. Here is the honest shape.

The founder's words: "I need agents to call real humans and talk, that's what selling is for me."

**This collides with a standing rule the founder set:** no cold AI robocalls, on TCPA grounds. That rule is
correct and it should stay. What follows is what can be built without breaking it.

**What the law actually says** (not legal advice; a lawyer must sign this before a single call):
- The FCC ruled in February 2024 that **AI-generated voices are "artificial" under the TCPA.** That puts an
  AI voice in the same category as a prerecorded robocall.
- Artificial-voice calls to a **mobile number require prior express written consent.** Most people's
  numbers are mobile.
- The **national Do Not Call registry** applies.
- **California SB 1001** requires disclosing that the caller is a bot. No competitor names it.
- The founder is in **Massachusetts, a two-party consent state** (M.G.L. ch. 272 § 99). Recording a call
  without both parties' consent is a crime there, not a compliance ticket.
- Outbound SMS needs **A2P 10DLC** carrier registration. Our own `lib/org/twilio-notify.ts` already says
  so in its header.

**So three call shapes are buildable and one is not:**

| Shape | Legal | Build it? |
|---|---|---|
| **Inbound**: the agent answers a call, discloses it is AI | Yes, with disclosure | **Yes, first.** Cheapest and safest |
| **Consented outbound**: the prospect asked in writing to be called, and we hold the receipt | Yes | **Yes.** This is how Bland and Vapi customers operate |
| **Human-dialed, AI-assisted**: the human dials, the agent listens and drafts live | Yes | **Yes.** This is Artisan's actual model |
| **Cold outbound to a bought list, AI speaking** | **No** | **Never.** This is the founder's own hard NO |

**And a strategic point separate from the law.** The buyer in step 1 is a university procurement office. An
AI cold-call to a dean is likely to lose that sale even where it is legal. Calling is the right tool for
step 5, where an agent sells a *student's* product to that product's own consented leads. It is the wrong
tool for selling the license.

**What to build, in order:** a consent ledger (the Vapi shape, an auditable `consentGrantedAt` with a
source), disclosure as the first sentence of every call and verified in the transcript the way we verify it
in post text, a mid-call guard that ends or transfers on any opt-out (the Bland shape), and recording that
is off by default and requires two-party consent in Massachusetts. All of it behind the publish gate, all
of it in the audit ledger, and the whole capability dark until a lawyer signs the script.

---

## Would we be first?

**Not at AI agents calling people.** That is already shipped at scale: Genspark's "Call for Me" runs real
autonomous outbound calls through Twilio, claiming 180,000 users and up to 800 calls a day. Naive ships AI
phone agents built on Vapi and Retell. Bland and Vapi are the infrastructure. Anyone claiming novelty here
is wrong.

**Plausibly first at the loop.** Our four-sweep survey of 25+ products found build, operate and sell are
three separate purchases from three separate vendors, and that remained true after Naive shipped, because
Naive sells primitives rather than an org that builds a product, launches it, sells it, and is accountable
for what it said while selling. Closest is Genspark Claw, and it has no case study of building AND running
AND selling one product.

**Certainly first at one thing, and it is the smaller, truer claim:** doing it with the compliance rails
named. California SB 1001, AB 2905, the Utah AI Policy Act, CAN-SPAM and TCPA appear on **zero** competitor
pages across everything surveyed. Genspark's entire published policy for autonomous calling is one
sentence, and their own launch post demonstrates calling a patient about an appointment.

So the honest claim is not "first to sell with agents." It is **"the only one that will tell you which law
applies before it dials."** That is a smaller headline and a much better one for selling to a university.
