# Build it all in house: the product development plan

Written for a reader who is not an engineer. No jargon that is not explained in the same sentence. Every
phase has a **student story** so you can picture what changes for a real person.

The instruction behind this document: **anything virtual that can be built, we build.** That is taken
seriously here. The plan below moves us from renting nine things to renting three.

---

## Part 0 · The one distinction that decides everything

There are two kinds of thing we currently rent, and they are not the same kind of thing at all.

**A SURFACE is a screen and some rules.** A chat workspace is a list of messages, a list of channels, and
a rule about who can read what. Slack is a very good version of that, but there is no magic in it. This is
a few weeks of work and then it is ours forever.

**INFRASTRUCTURE is either physical, or it is a decade of accumulated trust.** A content delivery network
is roughly a hundred real buildings full of real machines in real countries. You cannot type that into
existence. Email deliverability is not code at all; it is years of history convincing Gmail you are not a
spammer.

**So: we build every surface. We rent the three things that are physical or historical.** That is not a
retreat from the instruction, it is the instruction applied honestly.

---

## Part 1 · The three things that stay rented, and exactly why

Only three. Everything else in this document gets built.

### 1. The thinking (the AI model itself)

**Why not:** Training a model that can write working software costs hundreds of millions of dollars in
computers and needs a team of specialists. There are perhaps five organisations on Earth doing it.

**What we do instead:** we already speak to **seven** different model providers through one adapter, so no
single one can hold us hostage. If one raises prices or disappears, we change a line of configuration.
That is the real protection, and we already have it.

**Student story.** Priya types her idea. Behind the scenes it might be answered by Anthropic today and by
a cheaper provider next month. Priya never knows or cares. Nothing about her experience is rented.

### 2. Where the website lives (hosting and the delivery network)

**Why not:** When Priya's classmate in Singapore opens the thing she built, the page has to come from a
machine near Singapore or it feels slow. That means owning or renting space in datacentres on several
continents. It is a building problem, not a coding problem.

**What we do instead:** the plan is already written so hosting is swappable. Our own connection map
literally says *"Vercel (or Cloudflare Pages)"*. We are a customer, not a hostage.

### 3. Getting email into an inbox

**Why not, and this is the surprising one:** you can write software that sends an email in an afternoon.
You cannot make Gmail **trust** it. Deliverability is built from years of sending history attached to
specific internet addresses. Build your own and Priya's launch email lands in spam, silently, forever.

**What we do instead:** rent the delivery pipe, own everything else. We write the email, we decide who
gets it, we keep the record. Someone else carries the envelope.

---

## Part 2 · What gets built, in order, with student stories

Nine phases. Ordered so that each one is useful on its own, and so the earliest ones unblock the goal.

---

### PHASE 1 · Our own workspace, so nobody needs Slack

**Effort: about 3 weeks. This is the most important phase in the document.**

**What it is.** A place inside competitor.inc where a student talks to their AI company, in channels and
threads, exactly the way people use Slack. Messages, mentions, replies, and the approval buttons appearing
right inside the conversation.

**Why it matters more than it sounds.** Today the product needs the university to already have Slack, and
needs a university IT administrator to approve installing our app. **That is a procurement meeting before
the product does anything at all.** It also means the university pays Slack per student on top of paying
us, and on the free plan their history disappears after 90 days, which quietly destroys the audit trail
that is the whole point of this company.

Removing Slack is not building a wall around our garden. It is removing a gate at the entrance.

**What we already have.** More than expected: a Stream interface, a room endpoint, a conversation module,
and a messages table. But that table is currently a **mirror of Slack** rather than a home of our own, and
nothing updates live yet.

**What is genuinely new:** channels, threads, live updates so a second person sees a message appear, and
agent identity so a post says *"Marcus, Chief Executive"* rather than *"the system"*.

> **Student story.** Priya opens competitor.inc and lands in a workspace that already has channels:
> `#build`, `#launch`, `#money`. She types in `#build`: *"a tool that tells students which co-op postings
> are real."* Within seconds, replies appear from named agents: the product manager asking two clarifying
> questions, the engineer saying it has started. She did not install anything. She did not ask her
> university's IT department for permission. She has not left the page she signed in on.

---

### PHASE 2 · A prompt in the workspace starts a real build

**Effort: about 1 week, because Phase 1 does the hard part.**

**What it is.** When Priya types her idea, the machine actually starts building. Right now this is
impossible: the only door into the build pipeline is Slack's webhook, and nothing behind it connects.

**Why it matters.** This is the single biggest hole in the entire product. **Step 4 of the goal, "give a
prompt to the agents", currently cannot happen.** Once the workspace is ours, this stops being an
integration with another company and becomes an ordinary function call.

> **Student story.** Priya's message in `#build` becomes a plan with named owners. A card appears in the
> thread: *"Here is what we propose to build. Approve?"* She taps approve. The engineer starts. Twenty
> minutes later a link appears in the channel and she opens her own website on her phone.

---

### PHASE 3 · Files of our own

**Effort: about 1 week.**

**What it is.** Somewhere for uploads and generated documents to live: an image, a PDF, a spreadsheet the
agents produced. Today the product cannot accept a file at all.

**Why it matters.** Almost any real product needs it. A tutoring marketplace needs tutor photos. An
invoice needs a PDF. This is a small, well-understood piece of work and its absence blocks a lot.

> **Student story.** Priya's tutors upload profile photos. Her marketplace shows them. When she invoices
> her first customer, a real PDF is produced and stored, and she can find it again in six months.

---

### PHASE 4 · The workspace tells you when something breaks

**Effort: about 1 week.**

**What it is.** A watcher that checks Priya's live website every minute and posts into her channel when it
stops answering. Today nothing does. If her site dies at midnight it stays dead until someone happens to
look.

**Why it matters.** "It runs itself" is not true if nobody notices it stopped. This is the difference
between a demo and something a person can rely on.

> **Student story.** At 2am Priya's site returns an error. A message appears in `#build`: *"Your site
> stopped answering three minutes ago. The engineer is looking at it."* By breakfast there is a second
> message explaining what broke and what was changed. Priya slept through the whole thing.

---

### PHASE 5 · Getting paid, ours end to end

**Effort: about 3 weeks. Card processing is the fourth thing we rent, and only that part.**

**What it is.** Invoices, a record of who owes what, reminders, and the money landing in **Priya's own**
account rather than ours. We own the invoice, the ledger, the chasing and the reporting. A card processor
moves the money, because touching card numbers directly means a compliance regime nobody should take on
voluntarily.

**Why it matters.** **Step 6 of the goal is a student making their first $1,000, and today a student
cannot take a single payment.** Nothing downstream of revenue exists without this.

> **Student story.** A parent books a tutoring session. Priya's site takes the card. The money goes to
> Priya's account. An invoice is generated, filed, and shown in `#money`. At the end of the month a
> summary appears: what came in, what it cost, what is left. When she reaches $1,000, that number is real
> and provable.

---

### PHASE 6 · Our own analytics

**Effort: about 2 weeks.**

**What it is.** Counting visitors, sign-ups and returning users on the things students build, without
sending their data to an advertising company.

**Why it matters.** Two reasons. A university will ask where student data goes, and *"nowhere, we count it
ourselves"* is a much better answer than naming a third party. And these are exactly the numbers the
validation engine needs to say whether an idea has real demand.

> **Student story.** Priya asks in `#money`: *"is anyone actually using this?"* The answer is specific:
> 240 visitors, 31 sign-ups, 12 came back a second time. Her AI analyst tells her the sign-up rate is
> healthy but returning users are weak, and suggests one thing to change.

---

### PHASE 7 · A workspace for the whole class

**Effort: about 2 weeks.**

**What it is.** Faculty and administrators get a view: which students are active, what has shipped, what is
stuck. Roles, so a professor sees the cohort and a student sees only their own work.

**Why it matters.** This is what a university is actually buying. A licence with no way to see the cohort
is a hard sell to a department head.

> **Student story.** Priya's professor opens the cohort view: 40 students, 31 with something live, 6 who
> have not started. He messages the six. Priya's own work stays private to her unless she shares it.

---

### PHASE 8 · Talking to people, our own outbound

**Effort: about 2 weeks, plus a lawyer before anything is sent.**

**What it is.** Writing and scheduling the emails, posts and messages that sell a student's product, all
inside our own workspace, all passing the honesty gate before they leave.

**Why it matters.** We already have the gate that checks whether a claim is backed by evidence, whether
the audience opted in, and whether the AI identifies itself. What is missing is our own place to compose
and schedule, rather than depending on someone else's tool.

**The honest limit:** the delivery pipe stays rented (see Part 1), and **nothing goes out until a lawyer
has reviewed the templates.** Outbound has real rules and we intend to be the company that follows them.

> **Student story.** Priya asks for help finding customers. A draft appears in `#launch`: an email to a
> student group that has opted in to hearing about campus tools. The gate has already checked that every
> factual claim in it is backed. Priya reads it, changes one sentence, approves. It sends. The record of
> who received it is kept.

---

### PHASE 9 · Our own login

**Effort: about 3 weeks. Deliberately LAST, and here is the honest warning.**

**What it is.** Handling sign-in ourselves rather than through a provider.

**Why it is last, and why I would think hard before doing it at all.** Login is the one surface where a
mistake is unrecoverable. A bug in a chat feature is embarrassing. A bug in login means somebody reads
another student's data, and you cannot un-leak it. The industry consensus that you should not hand-roll
authentication exists for good reasons, and those reasons do not stop applying because we are ambitious.

**If we do it:** last, slowly, and reviewed by someone who does security for a living. Not before a real
customer exists.

> **Student story.** Priya signs in with her university account. This already works today. Phase 9 changes
> nothing she can see, which is precisely why it is ninth.

---

## Part 3 · The whole picture

| Phase | What | Weeks | Unblocks |
|---|---|---|---|
| 1 | Our own workspace | 3 | Kills the Slack dependency |
| 2 | Prompt starts a build | 1 | **Goal step 4** |
| 3 | Files | 1 | Most real products |
| 4 | Break detection | 1 | "It runs itself" becomes true |
| 5 | Getting paid | 3 | **Goal step 6** |
| 6 | Analytics | 2 | Real demand numbers |
| 7 | Cohort view | 2 | **The thing a university buys** |
| 8 | Outbound | 2 | The selling step |
| 9 | Login | 3 | Nothing visible. Do last or never |

**About 18 weeks of focused work**, and roughly 15 weeks to everything that matters, since Phase 9 is
optional.

**Rented before this plan: nine things.** Model, hosting, database, storage, chat, email, payments,
analytics, login.

**Rented after: three.** The model, the hosting, the email pipe. Plus card processing inside Phase 5.

---

## Part 4 · The honest warning, and it is the important part

Everything above is real, buildable, and correctly ordered. **And none of it is why the company has no
customers.**

Today, nobody outside the founder can sign in, and no student has ever used the product. Eighteen weeks of
building in-house does not change either fact. If we finish all nine phases and still nobody has tried it,
we will have a beautiful machine and the same problem.

**So the sequencing that actually wins:**

1. **First, this week:** turn sign-in on and get twenty real people to use what already exists. Nothing in
   this plan is worth as much as the first real user.
2. **Then Phases 1 and 2**, because they remove a procurement gate and fix the biggest hole in the goal.
3. **Then Phase 5**, because a student cannot make $1,000 without it.
4. **Then the rest, in order.**

Build it all in house. Just get one person to use it first, so that we are building what they actually
needed rather than what we assumed.
