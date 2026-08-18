# What competitor.inc does, from a student's chair

Written in the founder's own six steps. Each one says what a student actually experiences, and then what is
**REAL TODAY**, what is **PARTLY REAL**, and what is **NOT BUILT**. Nothing here is aspirational unless it
says so, because the whole product is the claim that we tell you which is which.

Status is derived from `lib/org/coverage.ts`, which is tested against real files on disk.

---

## Step 0 · You sign in (before your idea, and it is the part nobody else gets right)

You click "Sign in with your university account." That is it. **You connect nothing, you paste no keys, you
create no accounts.**

Your university's IT admin authorised GitHub, hosting, the database and the model key **once**, for the
whole campus, and you inherit all of it. On your first prompt the machine creates your repository inside
the university's GitHub org, your hosting project in their team, and your own isolated database schema.
Nobody sends you a service-role key to copy.

> **REAL TODAY** in code (`lib/core/campus.ts`, `lib/engine/provision.ts`, migration 0036) and tested: a
> student's required setup actions compute to **zero**. **NOT YET PROVEN** with a live campus, because no
> university has bought a licence.
>
> For comparison: doing this alone, without a campus, is **4 vendor accounts and 22 human actions**,
> including pasting a service-role key. That number is in the code too.

---

## Step 1 · You give it an idea

You type it in Slack, in your own words, in your own workspace. Not a form, not a spec document.

> *"A tool that tells Northeastern students which co-op postings are actually real."*

The agents read it, ask you the questions a good product manager would ask, and turn it into a plan with
named owners: who builds, who reviews, who signs off, and what has to come back to you.

> **PARTLY REAL.** The planning is real (`lib/core/plan.ts`, `lib/engine/org-plan.ts`, 10 tasks, real
> IC to lead to sign-off chain). **Slack cannot start a build yet**: only the webhook route exists and
> nothing reaches the build pipeline. That is the single biggest gap against this whole journey and it is
> the next thing being built.

---

## Step 2 · It builds

A real GitHub repository. Real code, written by the model, not a template. A design lead reviews the
interface against a craft rubric and commits fixes. A scaffold gate refuses to ship the blank Next.js
starter, so you never get an empty page with your idea's name on it. Then it deploys, and **verifies the
page actually loads before it shows you a link.**

You get a URL you can open and send to a friend.

> **REAL TODAY**, and proven live twice on real builds with real review commits. Roughly $0.13 of model
> spend per build.
>
> **The honest ceiling:** about ten files per run. That is a good weekend project, not a platform. Bigger
> products need many runs, and the machinery for that exists but has never been driven far.

---

## Step 3 · It runs

It keeps working while you are in class.

Every night the loop wakes up, picks up where it left off, and does the unglamorous work: writes tests,
reviews its own changes, keeps the docs true, records why each decision was made so the next session does
not undo it, and writes a postmortem when something breaks.

Anything consequential waits for you. You get one message with a clear question, not forty notifications.

> **REAL TODAY**: the loop, the rituals, product memory, postmortems, the audit ledger, the approval queue.
>
> **NOT BUILT**: nobody gets woken at 3am. There is no paging, no live production monitor. If your product
> falls over at midnight it stays down until someone looks. Say this out loud to a dean; it is the honest
> version of "runs itself."

---

## Step 4 · It scales

When you get users, the questions change from "does it work" to "does it work at a thousand".

The machine measures rather than guesses: it knows what a page request costs, where the data lives, and
which design decisions break first under load. It can tell you, with a number, when the shape you have will
stop working and what to change.

> **REAL TODAY** as measurement, and unusually good: a 50,000-member synthetic corpus, a real second-price
> ads auction whose ledger closes to zero, and a shard planner that found the median feed read already
> touches half the cluster. Nobody else in this category publishes numbers like these.
>
> **NOT BUILT**: changing a live database's schema without losing data. Migrations are written and applied
> by hand today. This is the gap that matters most as a product grows.

---

## Step 5 · It sells

The agents draft the outbound: the posts, the emails, the landing page, the search content. Every single
piece passes a gate before it can leave the building, and the gate checks things no competitor checks:

- Does the post carry the **named-AI disclosure**? Checked in the text, not taken on trust.
- Is the factual claim **backed by something we actually observed**, with a source? A confident guess is
  refused by grade, not by confidence.
- Is the audience **yours or opted-in**? A scraped list is refused and no approval can clear it.
- Is it **inside the daily cap**, so nothing runs away?
- Would a person be uncomfortable receiving it? Hostility, tragedy adjacency, politics and bait all route
  to a human.

A publisher physically cannot send a post the gate did not clear. It is a compile error, not a policy.

> **REAL TODAY** for the gate and for Bluesky, Mastodon and Reddit. **WRITTEN BUT UNPROVEN** for LinkedIn
> and X: the code is there, no real send has ever succeeded, because the tokens need an OAuth consent screen
> only a human can complete.
>
> **NOT BUILT**: phoning anyone. There is no voice capability at all, and outbound calling is legally gated
> behind carrier registration, a consent ledger and a lawyer. Also not built: running paid ads.

---

## Step 6 · You make money

Your product takes a payment. Into an account **you** own, never ours. The finance agents then do what a
finance team does: invoice, chase, close the books each month, forecast cash, and tell you plainly when the
forecast has nothing real underneath it.

> **NOT BUILT.** This is the honest bottom of the journey. **A student cannot take money today.** Stripe
> Connect is hooked up but unfinished, so step 6 is currently a plan, not a product.
>
> And a note that matters more than it looks: **"a student makes their first $1,000" is an earnings claim**
> under US consumer law, and earnings claims on business opportunities are the most-enforced category in the
> FTC's entire AI record. It gets substantiation and disclosure, reviewed by an attorney, before it is ever
> put in front of a student. Not because it is untrue. Because saying it carries duties.

---

## The number, and how it gets to 97%

Of the 45 functions a software company performs, **7 must stay human by design** (signing, paying,
answering a regulator, hiring). Those are not gaps. Automating them would make the company unaccountable,
and it is the reason a university can buy this at all.

Of the **38 that are automatable**, the machine currently covers **31**, which is **81.6%**.

**97% is 37 of 38.** That is exactly six of the seven gaps closed:

| Gap | Cost to close | Notes |
|---|---|---|
| Accessibility audit | Days | Add an automated a11y pass to the QA gate. A university will ask for this anyway |
| Paging at 3am | Days | Wire a real uptime monitor to the existing Slack and SMS channels |
| **Invoicing** | Weeks | Stripe Connect. **Unblocks step 6, so do this one first** |
| Live DB migrations | Weeks | A migration runner that tests against a database fork before applying |
| Paid acquisition | Weeks, plus a budget | Needs a real ad account and real money |
| Outbound calls | Months, plus a lawyer | Carrier registration, a consent ledger, disclosure in the transcript, recording rules |
| ~~Talk to users~~ | **Cannot be closed by code** | This needs real users. Leave it uncovered and say so |

So **97.4% is reachable, and it is six pieces of engineering, not a rewrite.** What it is not is a number
that can be edited. The number is the product.

For scale: **Salesforce, the best-resourced agent deployment in the world, runs at 50% agents and 50%
humans.** We are at 81.6% of automatable work on a narrower surface, and we are the only ones publishing a
figure at all.
