# Who claims AI runs a whole company, and what happened to them

Three independent research passes, 2026-08-17, commissioned to answer one question: should competitor.inc
launch claiming it can run Cursor or any MNC today? Every fact labelled VERIFIED / CLAIMED / NOT FOUND.
Primary documents were pulled directly where government sites blocked automated fetching.

**The answer is no, on four separate grounds, any one of which is sufficient.**

---

## 1. Nobody has ever sold this claim

After eleven distinct search angles: **no enterprise, university or government body publicly states that
it bought "AI runs our company."** A confirmed absence, not a gap in the search.

The closest datapoints are scoped, anonymous, or reversed. Notion via Decagon reports a genuine 3.4%
ask-for-human rate on support chat, and the case study says the outcome "elevated the role of CX agents",
with the team retained. Naive's own flagship proof is "some customers who run an entire rental-car agency
autonomously", **unnamed**, after a $28.5M round. Klarna is the one large enterprise that made the claim
about itself, then **reversed and rehired in May 2025**, with reported compliance concern over AI
autonomously handling disputes and account closures.

The claim is therefore not merely risky. It is **commercially unproven**, which moves it from brave to
pointless.

## 2. The claim has a decay curve, and the nearest competitor already rode it

The pattern: launch with "replace your team", absorb a backlash or a churn scandal, rewrite to "alongside
your team". Where it survives it survives in a **testimonial**, so the vendor keeps the marketing benefit
without asserting it in their own voice.

- **Artisan**, the "Stop Hiring Humans" billboard company, walked it back twice and its careers page reads
  "Hiring bold humans to build the best AI employees." ~168-190 employees.
- **Pancake** (Basalt, Stockholm) launched 2026-05-28 as "OpenClaw in Slack that makes your company
  autonomous": Slack interface, subagent squads, agent email and phone, spend caps, kill switch, SOC 2.
  **That is our exact shape.** Its hero copy today reads **"You run your company. We run your GTM."**
  It narrowed to one function, unforced, in under three months.
- **Polsia** prints "AI That Runs Your Company While You Sleep", has genuinely zero employees, and raised
  $30M to hire sales, marketing and engineers.
- **Cofounder** prints "run an entire company with AI" and "Nothing ships without your approval" on the
  same page.

## 3. The ceiling is 50%, set by the best-resourced deployment on earth

**Salesforce**: $800M Agentforce ARR, support headcount 9,000 to 5,000, Benioff verbatim "I need less
heads." He moved toward the claim, not away from it. **And his own ratio is 50% agents, 50% humans**, with
staff redeployed rather than eliminated.

Our own measured coverage is 46.7% of company functions automated and 81.6% of automatable work covered
(`lib/org/coverage.ts`). We are already in that league on the ratio, and it is checkable.

**Nobody in the category publishes a success rate.** Cognition is a productivity company showing zero
productivity metrics. The only rigorous independent test (Answer.AI, January 2025) found Devin completed
**3 of 20 tasks**, and that is 19 months stale. There is no current independent measurement of any product
in this category, which makes our coverage ledger the only published measurement of its kind.

**Logo walls here are unreliable by default.** ZoomInfo confirmed on the record it was never an 11x
customer and demanded its logo removed; Airtable said the product "was never used in production."

## 4. The enforcement record, and the two findings aimed at us

**Massachusetts, our own jurisdiction.** The MA Attorney General's advisory of 2024-04-16 enumerates as an
unfair and deceptive practice under c. 93A: representing that an AI system is **"fully automated when its
functions are performed in whole or in part by humans."** That is precisely the proposed claim, named in
writing, in the state the founder operates from. And **93A § 11 gives a business-to-business cause of
action with treble damages and attorney's fees**, so one unhappy university can sue directly with no
regulator involved.

**"It will be true by launch" is not a defence, it is the violation.** The FTC's substantiation policy
requires a reasonable basis **before a claim is disseminated**, and the Workado order restates it
operatively: no efficacy claim without competent evidence **at the time it is made**.

**Nobody was charged for saying "AI-powered". Everybody was charged for a number or an absolute:**
"above 99% success" (Nate), "95%+ non-intervention" and "eliminates human order taking" (Presto),
"98 percent accurate" (Workado), "hallucination rate below 0.001%" (Pieces), "automate nearly 100%"
(Growth Cave). "We can run Cursor today" is an absolute.

**Enforcement accelerated and went B2B.** 13 AI-washing cases since 2024, a dozen in 2025 alone, and
**7 of the last 8 involved claims made to other businesses.** Selling to institutions is the hunting
ground, not a shield. It survived the administration change.

**Having no entity makes this worse, not better.** Every FTC case named the humans. Nate's founder was
indicted **27 months after the company dissolved**. Air AI's owners were personally banned from an entire
line of business, and their $18M judgment was suspended to $50,000 for inability to pay: **being broke
discounted the cash and did nothing to the ban.**

**Reliance is not required, but it is the severity multiplier.** The standard is "likely to mislead, rather
than whether it causes actual deception", and the gradient tracks money that moved: roughly $400k
settlements for vague claims, criminal indictment when $42M moved and vanished.

**The clock that kills is journalistic, not legal.** The Information published, and Nate was dead in seven
months while the SEC arrived 34 months later. ZoomInfo refuted 11x in a two-sentence email and the founder
lost the CEO job in about eight weeks.

---

## The finding outside the original scope, and it is about the GOAL not the launch

**"A student makes their first $1,000" is an earnings claim on a business opportunity.** Four of the FTC's
AI cases were fundamentally earnings-claim cases, the most-enforced category in the entire record, carrying
**affirmative disclosure duties under the Business Opportunity Rule that exist independently of whether the
claim is true.** Air AI's owners were banned from "making earnings claims without adequate substantiation
or disclosure."

This is not a reason to abandon step 6. It is a reason to get it lawyered before it is marketed, and to
never state it as a typical or expected outcome without substantiation and disclosure.

## And the asymmetry that decides it

Regulators are converging on remedies that are literally a governed-truth discipline: Pieces must publish
its metric definitions and methods, Workado must retain its evidence. That is tailwind for this thesis.

**But a product that sells verifiable honesty and is caught overclaiming its own autonomy does not merely
take a fine. The value proposition inverts.** The downside is not money, it is the only thing being sold.

---

## What to launch instead, and it is stronger

> **"81.6% of the automatable work of running a software company runs here unattended. Here is the ledger,
> function by function, naming the seven things that do not and why. Salesforce, the best-resourced agent
> deployment on earth, runs at 50%. No competitor in this category publishes a number at all."**

Checkable, unique, and it survives the first demo.

**NOT LEGAL ADVICE.** A licensed attorney must review any capability or earnings claim before it is
published. Verification gaps are recorded in the source passes: the DOJ release could not be fetched
(403/JS-gated), Builder.ai restatement figures conflict across sources, no EU AI Act penalty for
overclaiming was found (powers went live 2026-08-02), and the FTC's "Keep your AI claims in check"
guidance now 404s on the live site and was retrieved from the Internet Archive, so it must not be cited as
current without confirming whether it was withdrawn or moved.

---


# The Maximal Autonomy Claim: Who Says It, and What Backs It

**Research date: 2026-08-17.** All fetches performed 2026-08-17 unless noted.
**Method:** primary sources (company's own live marketing) for claims; press/primary filings for funding and traction. Read-only; no signups, no forms, no trials.

**Label key**
- `VERIFIED` = read directly on a primary source (company site, SEC/filing, first-party announcement)
- `CLAIMED` = asserted by the company or its investors, not independently confirmed
- `NOT FOUND` = actively looked for, absent

---

## Executive summary of the gap

The headline finding: **almost nobody who made the maximal claim still makes it in the same words.** The claim has a documented decay curve. Companies launch with "replace your team," absorb a backlash or a churn scandal, and by 2026 have rewritten the homepage to "alongside your team," "human results," or "your teammate." The maximal claim survives mainly in two places: (1) pre-product ideological ventures with no customers to disappoint (Mechanize), and (2) testimonial quotes and third-party voices, where the vendor gets the claim's marketing benefit without asserting it in their own voice (Artisan, Lindy).

Second finding: **the "no humans" sellers all employ humans, and several employ a lot of them.** See per-company headcount below.

---

## 1. Artisan (artisan.co)

**URL:** https://www.artisan.co · https://www.artisan.co/careers · **Fetched 2026-08-17**

### The maximal claim, verbatim

The famous version, on billboards from October 2024 onward:

> "Stop Hiring Humans"

Supporting billboard copy reported in press:

> "Artisans Won't Complain About Work-Life Balance"
> "Artisans Won't Come into Work Hungover"

`VERIFIED` (billboard text) via multiple independent outlets including [IBTimes UK](https://www.ibtimes.co.uk/controversial-stop-hiring-humans-campaign-1797096), [KRON4](https://www.kron4.com/news/technology-ai/controversial-stop-hiring-humans-billboard-campaign-takes-to-the-skies-over-sf/), [SF Standard](https://sfstandard.com/2025/04/07/the-real-person-behind-san-franciscos-hated-anti-human-ad-campaign/).

Still-live maximal framing on their **careers** page (this is the company's own voice, present tense):

> "Every great company of the next decade will be built on AI employees. We're building the company that builds them."

`VERIFIED` on https://www.artisan.co/careers, 2026-08-17.

### The self-refuting line (most important single finding in this report)

Artisan's own careers page headline, verbatim:

> **"Hiring bold humans to build the best AI employees"**

`VERIFIED` on https://www.artisan.co/careers, 2026-08-17. The company that bought billboards saying "Stop Hiring Humans" leads its careers page with the word "Hiring" and the word "humans" in the same sentence. TechCrunch made the same observation in a video titled ["stop hiring humans startup artisan hires humans"](https://techcrunch.com/video/stop-hiring-humans-startup-artisan-hires-humans).

### How many humans do THEY employ?

- **168 employees** as of 2026-03-31. `CLAIMED` (Tracxn, third-party aggregator)
- **190 employees**. `CLAIMED` (PitchBook)
- **~35 employees** in 2025-2026, up from 16 in 2024. `CLAIMED` (Latka)
- Actively recruiting: careers page live with "See open roles" / "Apply now". `VERIFIED`

Aggregators disagree by 5x, so treat the absolute number as soft. What is **not** soft: the direction is up, they are hiring, and the count is in the dozens-to-low-hundreds, not zero. Exact figure `NOT FOUND` on any primary source; Artisan does not publish headcount.

### The walk-back: documented and unambiguous

This is the clearest walk-back in the entire dataset, and it happened in two stages.

**Stage 1, the asterisk.** After backlash (including a direct rebuke from Sen. Bernie Sanders on X, and what CEO Jaspar Carmichael-Jack describes as thousands of death threats), Artisan relaunched the campaign with fine print appended to the same slogan:

> "Stop Hiring Humans … *For Work They Hate"
> "Stop Hiring Humans ... *To Write Cold Emails"
> "Stop Hiring Humans ... *To Do Manual Outbound"

`VERIFIED` via press reporting. The asterisk converts a claim about human labour into a claim about cold email templates.

**Stage 2, the homepage rewrite.** The current artisan.co homepage no longer makes the maximal claim in the company's own voice at all. Present headline, verbatim:

> "The AI BDR that runs in your stack, alongside your team"
> "Scale pipeline without adding headcount"
> "Ava owns the execution, you own the constraints"

`VERIFIED` 2026-08-17. Note the precise engineering here: "**alongside** your team," not instead of it. "Without **adding** headcount," not reducing it. "**You** own the constraints." Three separate hedges in three consecutive lines. This is a company that has been sued-adjacent enough to hire a careful copywriter.

**Where the maximal claim now lives:** in a customer's mouth, not Artisan's. On the homepage:

> "We've replaced our entire outbound sales team with Artisan"

This is a testimonial. Artisan gets the benefit of the claim while attributing it to someone else. Watch for this pattern. It recurs at Lindy.

Also note the CEO's own explicit narrowing, per his blog post responding to the backlash: the slogan targets "email blasting, template churn, and list-building," and the company "does not seek to eliminate entire BDR roles," with cold calling and human connection remaining human tasks. `CLAIMED` (his stated intent, reported in press).

### Claimed traction

- **$5M ARR, $15M valuation**. `CLAIMED` (Latka; Latka figures are self-reported by founders and are not audited). Note this conflicts with PitchBook/Tracxn headcount of 168-190; $5M ARR against 168 employees would be ~$30k revenue per employee, which is implausible for a funded SaaS company. At least one of these numbers is wrong. Flagging rather than guessing.
- Funding: Artisan raised a **$25M Series A** round announced April 2025, led by Glade Brook Capital. `CLAIMED`, widely reported, not verified against a filing in this pass.

### Named, verifiable customers

Logos/names on site: **SaaStr** (with an attributed quote from Jason Lemkin, Founder & CEO), SumUp, CookUnity, Zirtual, RAISE Summit, Quora, Arc. `VERIFIED` that the names appear on artisan.co.

Whether any has a **full case study with measured outcomes**: `NOT FOUND` in this pass. The SaaStr/Lemkin attribution is the strongest, a named executive at a named company on the record. The rest are logo-wall only.

### What the claim quietly excludes

- The product is an **AI BDR**, one function (top-of-funnel outbound), not a company. "Stop Hiring Humans" was never scoped to anything but SDR/BDR work, as the CEO later confirmed.
- **Cold calling is excluded** by the CEO's own narrowing. Calls are "queued for reps", a human closes.
- "Ava owns the execution, **you own the constraints**", the human is the policy layer. That is not an autonomous company; that is a tool with a supervisor.
- Optional CRM integration (Salesforce/HubSpot) implies the customer still runs a human-operated sales stack around it.

### Verdict

**Claim is UNBACKED by published evidence, and the company has itself retracted it.** The maximal claim ("Stop Hiring Humans") has been walked back twice, survives only as an asterisked slogan and a customer testimonial, and is contradicted in Artisan's own words on its own careers page ("Hiring bold humans"). The narrow claim that now replaces it ("AI BDR alongside your team") is plausible but is not the maximal claim.

---

## 2. Mechanize (mechanize.work)

**URL:** https://www.mechanize.work · **Fetched 2026-08-17**

### The maximal claim, verbatim

Current site, the company's stated long-term objective:

> "the full automation of valuable work across the economy"

`VERIFIED` on https://www.mechanize.work, 2026-08-17.

At launch (April 2025), the claim was broader and was reported in these terms:

> "the full automation of all work"
> "the full automation of the economy"

`CLAIMED` / widely reported. See [PYMNTS](https://www.pymnts.com/artificial-intelligence-2/2025/ai-startup-mechanize-aims-for-automation-of-all-work/), [Fortune](https://fortune.com/article/tech-founder-online-epoch-ai-mechanize-tamay-besiroglu-automated-employees-workforce), [Breitbart](https://www.breitbart.com/tech/2025/04/21/famed-ai-researcher-launches-startup-to-automate-all-human-jobs/), [Yahoo Finance](https://finance.yahoo.com/news/famed-ai-researcher-launches-controversial-160945867.html).

Founder Tamay Besiroglu (previously of Epoch AI) sized the market by **summing all human wages**: ~$18 trillion/year in the US, **$60+ trillion globally**. `CLAIMED`. This is the most honest statement of the maximal claim anyone in this dataset has made, the TAM *is* the wage bill, i.e. the product's addressable market is human employment itself.

### The quiet narrowing (a walk-back in emphasis, not in ideology)

Note the current wording: "full automation of **valuable** work." The qualifier "valuable" was not in the launch framing. More importantly, what the site actually *sells* today has collapsed to a narrow slice:

> "environments and evals for frontier coding agents"

Plus one named artifact: **GBA Eval**, a benchmark measuring whether coding agents can write a Game Boy Advance emulator from scratch in 24 hours. `VERIFIED`.

Also per launch reporting: the initial focus is **white-collar work only** (finance, customer service, management) and explicitly **excludes manual labour**, because that would require robotics. `CLAIMED`. So "all work" excluded most of the world's workers from day one.

### Funding

**No disclosed round size, valuation, or lead investor.** `NOT FOUND`. Mechanize has not published funding amounts.

Named backers, `VERIFIED` on their own site: Nat Friedman, Daniel Gross, Patrick Collison, Adam D'Angelo, Marco Mascorro, Dwarkesh Patel, Sholto Douglas, Devendra Chaplot, Alex Atallah, Marcus Abramovitch. Press additionally names Jeff Dean. This is an angel roster, not an institutional round. Consistent with a small pre-revenue research bet.

### Claimed traction / customers / revenue

**`NOT FOUND` on all three.** No customers named, no revenue claimed, no ARR, no case studies. Mechanize sells training environments and evals, plausibly to a handful of frontier labs, and names none of them.

### How many humans do THEY employ?

Exact count `NOT FOUND`. Evidence points to **very small** (single digits to low teens): three publicly known founders, an angel-only cap table, and no institutional round. They are **actively recruiting humans**. "recruiting software engineers to design and build evaluation environments" `VERIFIED` on their site.

The irony is structural: a company whose mission is to automate all human labour is hiring human software engineers to hand-build the environments that would do it.

### What the claim quietly excludes

- Manual/physical labour. Excluded by their own admission (needs robotics).
- Mechanize does **not** automate any work today. It builds *benchmarks and training environments* so that *other people's* models might later. The gap between "full automation of the economy" and "we ship a Game Boy Advance emulator benchmark" is the widest claim-to-artifact gap in this report.
- No product a business can buy to replace an employee.

### Verdict

**Claim is UNBACKED by published evidence.** Mechanize is the most ideologically committed and the least commercially substantiated entity here: zero named customers, zero disclosed revenue, zero disclosed funding, and a shipped product surface consisting of one coding benchmark. It is worth taking seriously as a *statement of intent by well-connected people*, not as evidence that anything is automated.

---

## 3. 11x (11x.ai)

**URL:** https://www.11x.ai · **Fetched 2026-08-17**

### The maximal claim, verbatim

Current tagline:

> "11x – Digital workers, Human results"

Supporting copy:

> "Digital workers don't just automate tasks – they transform your business"
> "24/7 Digital Workforce"
> "Autonomous Intelligence"

Products: **Alice** ("AI SDR" / "Outbound digital worker") and **Julian** ("AI Phone Agent" / "Inbound digital worker"). `VERIFIED` 2026-08-17.

### The walk-back

"Digital workers, **Human results**" is a hedge, and a telling one. The earlier positioning was the pure replacement claim. 11x was among the first to market "AI SDRs" as headcount substitutes. The current tagline reframes the AI as the *input* and humans as the *outcome*. "Digital worker" also does less work than "AI employee": it is a category noun, not a promise that you can fire anyone.

### Funding

> "$70M+ raised from a16z and Benchmark"

`VERIFIED` as a claim on 11x.ai. Corroborated: **$50M Series B led by Andreessen Horowitz**, first reported by TechCrunch 2024-09-30, at roughly a **$350M valuation**. About **35x reported ARR**. `CLAIMED` (press-reported).

### Claimed traction: and the scandal that gutted it

This is the single best-documented claim-vs-evidence failure in the dataset. A **TechCrunch investigation published 2025-03-24 by Marina Temkin**, based on nearly two dozen sources including investors and current and former employees, alleged:

- **ARR inflated by counting full contract value regardless of whether customers stayed.** Reported ARR ~**$14M** against roughly **$3M** in contracts that actually survived the first three months. `CLAIMED` (reported allegation, sourced to former employees)
- **70-80% customer churn within the first three months.** `CLAIMED` (same)
- **Customers listed who were not customers.** **ZoomInfo confirmed it was never a customer** and demanded its logo be removed. **Airtable** ran a "very short" trial in late 2023 and stated the product "was never used in production and never rolled out to our sales team", yet was still listed as a customer on 11x's site as of late March 2025. `VERIFIED` as on-the-record statements from the named companies themselves.

That last item is the important one, and it is *verified*, not merely alleged: two named enterprises publicly stated that 11x's own customer list was false. Any logo wall in this category should now be treated as unverified by default.

### Named, verifiable customers (current site)

Names listed 2026-08-17: Mapped, The Lab Group, Ornn, BrainSuite, BuildWitt, Workera, Leica Biosystems, Cofenster, MMB Networks, Checkr, Unitech, CaniBuild, Questex.

Attached metrics, all `CLAIMED`: "1.5x increase in qualified meetings"; "$1M+ pipeline generated in first 3 months"; "35% of pipeline generated within first 3 months"; "9.7% reply rate" (Leica Biosystems); "5x increase in qualified meetings" (MMB Networks).

Independently verified customer outcomes: `NOT FOUND`. Given ZoomInfo and Airtable, the burden of proof on this list is higher than normal.

### How many humans do THEY employ?

Exact current count `NOT FOUND`. Evidence of substantial human headcount: TechCrunch's investigation drew on "current and former employees" in the plural across nearly two dozen sources, and the company has raised $70M+. Consistent with a headcount in the high dozens to low hundreds. A company selling a "24/7 Digital Workforce" is staffed by a human workforce.

### What the claim quietly excludes

- "Human **results**", the tagline itself concedes a human is the judge of output.
- Two products covering **outbound email/social and inbound phone**. Not a company. Not even all of sales.
- "Enterprise-ready," "Deeply integrated," "Customised to you" all imply significant human configuration and integration labour.

### Verdict

**Claim is UNBACKED by published evidence, and materially contradicted.** Two named enterprises (ZoomInfo, Airtable) went on the record to deny being customers; reported churn of 70-80% in three months is the arithmetic opposite of an autonomous worker that "transforms your business." 11x is the cautionary case: the maximal claim sold a $350M valuation before the evidence was checked.

---

## 4. Lindy (lindy.ai)

**URL:** https://www.lindy.ai · **Fetched 2026-08-17**

### The maximal claim, verbatim

> **"Your next hire is AI."**

`VERIFIED` on https://www.lindy.ai, 2026-08-17. This is the cleanest, most direct maximal claim of any *commercially live, self-serve* product in this report. Artisan and 11x have both retreated from this register; Lindy has not.

Supporting copy:

> "The AI Teammate That Lets You Do More"
> "Lindy connects to all your tools, knows everything about your company, and does real work for the whole team."
> "Why Lindy feels like a **real teammate.**"

### The maximal claim outsourced to testimonials

The hardest replacement language on the page is in customers' mouths, not Lindy's, the same pattern as Artisan:

> "Replace your executive assistant with an AI agent.", attributed to Alex Reibman
> "Lindy AI just killed the virtual assistant industry.", attributed to Hasan Toor

And an unverifiable productivity claim from a social-media handle:

> "28 hours per week" saved; "400% productivity increase in 30 days", attributed to @AIwithGhotai

`VERIFIED` that these appear on the page. The underlying claims are `CLAIMED` and unauditable. Note the structure: Lindy's own voice says "teammate" (additive); its testimonials say "replace" and "killed" (substitutive). The company gets both messages without owning the second.

Also note the internal contradiction between the two registers: "Your next **hire**" is replacement framing, while "The AI Teammate That Lets **You** Do More" is augmentation framing. Both are in the same fold of the same page.

### Named, verifiable customers: the biggest evidence gap here

Logos displayed: **Shopify, Apple, Adobe, McKinsey & Company, NVIDIA, Harvard University, Airbnb, Retool, Stanford, Autodesk, AppLovin.**

`VERIFIED` that these logos appear on lindy.ai. **Case studies with named contacts and measured outcomes: `NOT FOUND`**, the logos are presented without accompanying case-study detail on the homepage.

This deserves a flag. Lindy sells self-serve plans starting at **$29.99/mo** (`VERIFIED`: Plus $29.99/3k credits, Pro $99.99/15k credits, Max $199.99/35k credits, 7-day free trial). At that price point, a single employee at Apple or McKinsey expensing a $30 subscription is enough to put the logo on the wall. A logo wall on a self-serve product is evidence of *signups*, not of enterprise adoption or of anyone being replaced. Following the ZoomInfo/Airtable precedent at 11x, these logos should be treated as unverified.

### Funding

`NOT FOUND` in this pass. No funding figure appears on the homepage and I did not confirm a round against a primary source. Lindy (Lindy AI, founded by Flo Crivello) is known to be venture-backed; I am not going to assert an amount I have not read.

### Claimed traction

- **G2 rating 4.9 stars**. `CLAIMED` (third-party review platform; G2 ratings are real but self-selected)
- **"42 active" skills**. `VERIFIED` as page copy
- Customer count, revenue, ARR: `NOT FOUND`

### How many humans do THEY employ?

`NOT FOUND`. No team page headcount located in this pass. Lindy is publicly known to be a small-to-midsize venture-backed startup with a human engineering and go-to-market team. A company whose homepage says "Your next hire is AI" is itself hiring humans.

### What the claim quietly excludes

- **Credit metering is the real limit.** $29.99 buys 3,000 credits/month. An "employee" that stops working when the credits run out is a metered API, not a hire. This is the most concrete exclusion in the report: the fine print prices the "hire" by the task.
- "**Whatever you do on repeat**, hand it to Lindy on a schedule", the actual scope is *repetitive, schedulable* tasks. That is automation, and Lindy describes it accurately elsewhere on the page.
- "Lindy **helps** you complete work". Helps.

### Verdict

**Claim is PARTLY BACKED by published evidence.** The narrow product claim (a connected, schedulable agent that does repetitive work across your tools, for $30-200/mo) is plausible and consistent with the pricing and the G2 rating. The maximal claim ("Your next hire is AI," "replace your executive assistant," "killed the virtual assistant industry") is backed by nothing published. No case study, no measured outcome, no named customer contact, and a logo wall that a $30 self-serve subscription can buy into.

---

## 5. Cognition / Devin (cognition.com)

**URL:** https://cognition.ai → redirects 301 to https://cognition.com/ · **Fetched 2026-08-17**

### The maximal claim, verbatim

> "Devin, the first autonomous software engineer"
> "Devin plans, writes, tests, and ships production code on its own"

`VERIFIED` on https://cognition.com/, 2026-08-17. "On its own" is an explicit autonomy claim, still live.

> "Devin is deployed at some of the largest and most complex institutions in the world"

`VERIFIED` as page copy.

### The walk-back: softened but not abandoned

Devin launched in March 2024 as "the first AI software engineer," a framing that implied a headcount substitute. The current page keeps "autonomous software engineer" but surrounds it with collaboration language that was not in the original launch:

> "working alongside people as an exponential collaborator"

and reframes the human's role as promotion rather than replacement. Engineers "operate more like architects: strategizing, designing systems, and focusing on problem solving, **while agents handle the repetitive engineering work**."

`VERIFIED` 2026-08-17. Note the same two-move pattern as Artisan: keep the strong noun ("autonomous software engineer"), add "alongside," and narrow the scope to "the repetitive engineering work."

### The independent evidence: the best-measured gap in the report

Three data scientists affiliated with **Answer.AI** (the lab founded by Jeremy Howard and Eric Ries) tested Devin on 20 real tasks and published results in **January 2025**:

- **3 of 20 tasks completed satisfactorily** (~15% success rate)
- 3 inconclusive
- **14 outright failures**

Their stated conclusion, as reported: Devin delivered a polished experience that was impressive when it worked, "but that's the problem – it rarely worked." They also flagged that their **inability to predict which tasks would succeed** was the more serious problem. Tasks similar to early wins would fail in complex, time-consuming ways.

`CLAIMED` → strongly corroborated. This is an independent third-party evaluation, published, and covered by [The Register](https://www.theregister.com/2025/01/23/ai_developer_devin_poor_reviews/), [Futurism](https://futurism.com/first-ai-software-engineer-devin-bungling-tasks), and [ITPro](https://www.itpro.com/software/development/the-worlds-first-ai-software-engineer-isnt-living-up-to-expectations-cognition-ais-devin-assistant-was-touted-as-a-game-changer-for-developers-but-so-far-its-fumbling-tasks-and-struggling-to-compete-with-human-workers). It is the closest thing to a controlled measurement of the maximal claim that exists in this dataset.

**Important caveat, stated honestly:** this evaluation is from January 2025, testing an early Devin. Cognition has shipped ~19 months of improvements since, and their own blog lists a post titled "Estimating the Productivity of an Autonomous AI Software Engineer" (dated 06.04.26) whose figures I could not extract from the homepage, `NOT FOUND`. A current independent re-evaluation at the same rigour: `NOT FOUND`. So the 15% figure documents the gap *at that time*, and should not be quoted as Devin's performance today.

### Named customers: the strongest customer list in this report

Logos on cognition.com: **Mercedes-Benz, Goldman Sachs, Infosys, Anduril, Itaú, Cognizant, Nubank, Athena Health, RV Tech.** `VERIFIED` that they appear.

These are materially more credible than Lindy's or 11x's lists, for a structural reason: Devin is an enterprise-priced product sold into regulated institutions (Goldman Sachs, Itaú, Nubank are banks), so these are procurement relationships, not $30 self-serve signups. Goldman Sachs's Devin deployment in particular was independently reported in mainstream financial press.

Case studies with measured outcomes: `NOT FOUND` on the homepage. Quantified productivity metrics: `NOT FOUND`. Explicitly absent, which is notable for a company whose entire pitch is engineering productivity.

### Funding

Not extracted from a primary source in this pass. Cognition is very heavily funded (multiple rounds, multi-billion valuation, and it acquired Windsurf in 2025), but I am not asserting figures I did not read. `NOT FOUND` for this pass.

### How many humans do THEY employ?

`NOT FOUND` for an exact figure. Directionally: Cognition is a large, heavily funded AI lab with a substantial human engineering org, and it *acquired another company's engineering team* (Windsurf), the opposite of demonstrating that autonomous software engineers remove the need to hire software engineers.

### What the claim quietly excludes

- "the repetitive engineering work", their own scoping. Architecture, system design, and problem-solving are explicitly reserved for humans by Cognition's own copy.
- "**alongside** people". Devin is positioned as a collaborator, and Cognition says so directly.
- Devin operates on tasks, in a sandbox, with human review of PRs. Nothing in the copy claims it owns a codebase unsupervised.

### Verdict

**Claim is PARTLY BACKED by published evidence.** The customer list is real and enterprise-grade. Genuinely the best evidence in this report that agentic engineering work is being bought at scale. But the specific maximal claim ("ships production code **on its own**") has never been substantiated with a published success rate, and the one rigorous independent measurement that does exist found 15%. Cognition publishes zero productivity metrics on its own homepage, which for a productivity product is a conspicuous silence.

---

## 6. Polsia (polsia.com)

**URL:** https://polsia.com · **Fetched 2026-08-17**

### The maximal claim, verbatim

> **"AI That Runs Your Company While You Sleep"**

`VERIFIED` on https://polsia.com, 2026-08-17. This is the maximal claim in its purest retail form: not a function, not a role. Your *company*, and with the human explicitly unconscious.

**Fetch limitation, stated honestly:** polsia.com returned essentially only this headline to my fetch. No product detail, no customer list, no team page, no pricing was retrievable. Either the site is genuinely that thin or it is client-rendered and my read-only fetch could not execute it. I am not going to guess at content I could not read. Everything below comes from funding press.

### Funding

- **$30 million** at a **$250 million valuation**, announced **2026-05-25**. `CLAIMED` (reported by [The SaaS News](https://www.thesaasnews.com/news/polsia-raises-30m-other/), [AIN](https://en.ain.ua/2026/05/25/ai-startup-polsia-with-no-employees-raised-30m-in-funding/), Fundraise Insider)
- Round type reported as **Growth**
- Investors: Sound Ventures, True Ventures, Offline Ventures, Adjacent, Tekton Ventures, Drysdale Ventures, Vaynerfund, plus angels
- **Lead investor: `NOT FOUND`**, not specified in the reporting I could read

### How many humans do THEY employ?: the headline fact

> **Zero hired employees.** Solo-founder venture, founded by **Ben Sera**.

`CLAIMED`, and reported consistently across multiple outlets. AIN's headline is literally "AI startup Polsia with no employees raised $30M in funding."

**This is the one company in the dataset whose headcount actually matches its claim.** A company selling "AI that runs your company" that is itself run by one person is, at minimum, internally consistent. It is the strongest single existence-proof in this report, and it is an existence proof of a *solo founder with leverage*, which is a real and interesting thing, not of a company with no humans.

### The immediate contradiction

From the same funding announcement, the stated use of funds:

> grow the US sales and marketing team, improve the AI model through a research partnership with Sorbonne University, and **hire more engineers**

`CLAIMED` (reported). So the zero-employee company selling "AI that runs your company" raised $30M in order to **hire humans**. Sales, marketing, and engineering. The zero-employee status has an expiry date, and the company set it themselves. Note also the Sorbonne research partnership: the AI is not finished, and improving it requires a university.

### Claimed traction

- **Annual revenue approaching $10 million**. `CLAIMED` (press-reported, not audited)
- Grew **$1M → $3M ARR in roughly one month** in early 2026. `CLAIMED`, and attributed to **True Ventures**, i.e. sourced to an investor in the round. An investor's growth figure about their own portfolio company is marketing, not verification.
- Neither revenue nor customer count was disclosed in the primary funding release I read (`NOT FOUND` per The SaaS News), which conflicts with the ~$10M figure circulating elsewhere. Two reports, two different disclosure states. Treat the revenue as unconfirmed.

### The traction figure I could not confirm: and which matters most

Prior intel in my own notes holds that only **~4% of companies created on Polsia are actually active**. I could **not** confirm this in this pass, `NOT FOUND` from any source I could read today. If true it is the decisive number for this company, because it would mean the platform mass-produces companies that don't run. Flagging as unverified and explicitly not relying on it.

### Named, verifiable customers

**`NOT FOUND`.** No named customer, no case study, no reference account located. For a company reportedly near $10M revenue, zero named customers is a significant absence.

### What the claim quietly excludes

`NOT FOUND`. I could not retrieve docs, ToS, or fine print. Unable to assess the exclusions. Third-party review sites exist (preuve.ai, cto.new, agentaya.com all publish "Is Polsia legit?" reviews), the existence of that genre of content around a company is itself weak signal, but I have not read them and am not treating SEO-affiliate reviews as evidence.

### Verdict

**Claim is UNBACKED by published evidence.** $30M raised and a reported ~$10M revenue against **zero named customers, zero case studies, zero retrievable product detail, and an investor-sourced growth figure.** The one genuinely verified-consistent fact, a solo founder with no employees. Is real and notable, but it evidences founder leverage, not that customers' companies are being run by AI while they sleep.

---

## 7. MEDVI: the case everyone cites, examined

**Why this entry exists:** Medvi is not a vendor selling the maximal claim. It is the **proof point** that vendors, investors, and press cite *as evidence* that the maximal claim is true. It is invoked constantly in "one-person unicorn" and "zero-employee company" content. It therefore deserves the hardest look in this report, because if the flagship example doesn't hold, the category's evidence base is thin.

**URLs:** [Forbes 2026-04-02](https://www.forbes.com/sites/josipamajic/2026/04/02/ai-and-20000-helped-one-man-build-a-18-billion-telehealth-startup/) · [Yahoo Finance / Fortune](https://finance.yahoo.com/sectors/healthcare/articles/1-8-billion-startup-just-190000841.html) · [Inc.](https://www.inc.com/leila-sheridan/the-no-employee-billion-dollar-startup-how-ai-is-changing-the-face-of-solopreneurship/91326517) · **Fetched 2026-08-17**

### The claim

A GLP-1 telehealth company, launched September 2024 from a house in LA with **$20,000**, run by founder Matthew Gallagher, that reached:

- **$401 million revenue in 2025** (first full calendar year), **250,000 customers**, **16.2% net margin = $65M net profit**
- **$1.8 billion in sales claimed for 2026**
- **Two employees:** Matthew Gallagher and his brother Elliot

### The evidence: genuinely the strongest in this report

The 2025 figures come from **financials reviewed by The New York Times**. `VERIFIED`-adjacent. This is the only revenue number in this entire report backed by a major newspaper reviewing actual financials rather than a founder self-report or an investor's blog. That deserves acknowledgment: **something real happened here.** A two-person company did an enormous amount of revenue.

The 2026 **$1.8B** figure is different: `CLAIMED`, company-asserted, and the Fortune/Yahoo reporting explicitly notes it does not identify independent verification. Do not treat $401M and $1.8B as equally solid.

### What the AI actually did

`VERIFIED` per Forbes: Gallagher used **ChatGPT, Claude, and Grok** to write the code; **Midjourney and Runway** for ad creative; **ElevenLabs** for voice; custom agents to connect systems; a chatbot for inbound service. He owns "branding, website, paid media, checkout flow, and customer service."

### What the claim quietly excludes: and this is the whole story

The humans did not disappear. **They moved onto someone else's payroll.** Per Forbes and Fortune, Medvi outsources to **CareValidate** and **OpenLoop Health**, which supply:

> licensed physicians, prescription processing, pharmacy fulfillment, shipping logistics, and regulatory compliance

`VERIFIED` across two independent outlets. Every regulated, licensed, physical, and liability-bearing function, the doctors who write the prescriptions, the pharmacists who fill them, the compliance staff. Is performed by humans at vendor companies. Medvi's "2 employees" is a statement about **where the W-2s sit**, not about how much human labour the business consumes. A GLP-1 telehealth business cannot legally operate without licensed prescribers; there is no version of this company with no humans.

This is the single most transferable finding in the report: **"zero employees" in the AI era usually means "zero employees on my payroll."** Outsourcing is not automation. It is 40-year-old business practice with a new headline.

### What happened when ungoverned AI generated the marketing

This is the other half of the story, and it is not incidental, the failures are *specifically* failures of unsupervised AI output:

- **FDA Warning Letter, issued 2026-02-20 (letter #721455)**, alleging **"misbranding"**. Suggesting Medvi compounds drugs when it does not, rendering the products "false or misleading." `VERIFIED` (an FDA warning letter is a public regulatory record)
- **Deepfaked customer testimonials.** Per reporting, "Each image in the smiling, sports-bra'd crowd appears to have been generated from scratch using AI," and before-and-after photos are described as "eerily convincing deepfakes." `CLAIMED` (reported allegation)
- **800+ allegedly fake doctor Facebook accounts**, including named profiles (Dr. Matthew Anderson, Dr. Spencer Langford) with questionable origins. `CLAIMED`
- **Fake press logos**. Displaying Bloomberg and The Times logos implying coverage that never occurred. `CLAIMED`
- **Alleged FTC truth-in-advertising violations** over terms like "trusted by experts" and "doctor-approved." `CLAIMED`
- **Class action lawsuit** over spam email with subject lines like "This might be the easiest way to start Ozempic." `CLAIMED`
- **The chatbot fabricated commercial facts.** Per Forbes, the customer service bot "initially fabricated drug prices" and "hallucinated product lines that did not exist," requiring "manual correction and iteration." `VERIFIED` (reported in Forbes as fact, not allegation)

That last item is the cleanest illustration available anywhere of why an ungoverned agent cannot be trusted to make public claims: it invented prices and products that did not exist, in front of paying customers, and a **human had to catch it**.

### Verdict

**Claim is PARTLY BACKED, the revenue is real, the "no humans" framing is not.** The $401M/2 employees figure survives scrutiny as an accounting fact and is the strongest evidence in this report that AI leverage produces real revenue. But the company runs on outsourced licensed humans for every regulated function, and its unsupervised AI output produced an FDA warning letter for misbranding, a chatbot that invented prices, allegedly deepfaked testimonials, and fabricated press logos. Medvi is simultaneously the best proof that AI leverage works and the best proof that ungoverned AI output creates regulatory liability.

---

## 8. Cofounder (cofounder.co)

**URL:** https://cofounder.co · **Fetched 2026-08-17**

### The maximal claim, verbatim

> **"Cofounder lets you run an entire company with AI"**
> "Start with an AI roadmap, then hand off engineering, sales, marketing, design, finance, and ops to agents."
> "Cofounder is an agent orchestration platform designed to help you run an entire business"

> "Agentic departments. Cofounder is designed like a real company, with departments, managers, and shared context."

`VERIFIED` on https://cofounder.co, 2026-08-17. Corporate entity: "The General Intelligence Company Of New York."

This is a full-company claim covering six departments. Broader in scope than Artisan (sales only), 11x (sales only), or Cognition (engineering only).

### The fine print that cancels the claim: printed on the same page

Cofounder is unusual and, frankly, more honest than its peers: it publishes the exclusion **directly beside** the maximal claim, in equal weight.

> **"Human in the loop. Agents work alongside you, requiring approval when potentially dangerous actions are taken."**
> **"Nothing ships without your approval"**

`VERIFIED` 2026-08-17.

Read those two next to "run an entire company with AI" and the claim resolves to something much smaller: *you* run the company, approving everything that ships, and agents do the work between approvals. That is a materially different product from "autonomous company," and Cofounder says so itself without being asked. Credit where due. This is the disclosure the rest of the category omits. It also means the headline is contradicted by the company's own feature list.

### Claimed traction

> Over **10,650 companies**

`CLAIMED`, `VERIFIED` as page copy. Note carefully what this number counts: **companies created on the platform**, not paying customers, not surviving companies, not revenue-generating companies. This is a signup-adjacent metric presented in the position where a customer count would go. No revenue or ARR figure: `NOT FOUND`.

### Named customers

Referenced as case studies: **ActiveGraph, Veery, LearnPath, Valence OS.** `VERIFIED` that the names appear on cofounder.co.

Independent verification that these are real, operating, revenue-generating companies: `NOT FOUND`. All four are unfamiliar names with no independent footprint I located, which is expected if they are companies *built on* Cofounder rather than established businesses that adopted it. That distinction matters: a case study about a company that exists only because it was created on your platform is not the same evidence as an incumbent switching to you.

### Funding

`NOT FOUND` in this pass. Prior context in my notes indicates cofounder.co raised roughly **$8.7M led by USV (Union Square Ventures)**. `CLAIMED`, not re-verified against a primary source today.

### How many humans do THEY employ?

`NOT FOUND`. No team page headcount retrieved. Also worth noting: SOC 2 compliance is claimed (`VERIFIED` as page copy), and SOC 2 requires human-operated controls, policies, and an audit relationship, i.e. humans.

### What the claim quietly excludes

- **Everything dangerous, and everything that ships.** "Nothing ships without your approval" is a total carve-out of the autonomy claim, in the vendor's own words.
- **You do the roadmap**. "Start with an AI roadmap" still requires a human to define and accept the plan.
- "**Fully extensible**. Easily connect MCP, custom APIs, custom skills, or an entire custom codebase". Real use requires human integration engineering.
- "designed **like** a real company", a simile, and the copy is careful to keep it one.

### Verdict

**Claim is PARTLY BACKED by published evidence, and self-limited by the vendor.** The orchestration product plausibly exists and 10,650 created companies suggests genuine usage. But the maximal claim ("run an entire company with AI") is explicitly contradicted two lines later by "Nothing ships without your approval," and the four case studies are unverifiable. Cofounder is the most transparent company in this report about what its claim excludes, which paradoxically makes its headline the easiest to disprove. Using only its own page.

---

## 9. Genspark (genspark.ai)

**Fetch status: BLOCKED.** genspark.ai returned **HTTP 403 Forbidden** to my read-only fetch on 2026-08-17. I could not read their marketing copy on a primary source. Everything below is second-hand and labelled accordingly. I am not substituting a guess for their homepage wording.

### The maximal claim (second-hand, not primary-verified)

> "One prompt, job done. The first platform that autonomously delivers complete business outcomes."

`CLAIMED`, attributed to Genspark's Super Agent marketing by third-party reviewers ([eesel AI](https://www.eesel.ai/blog/genspark-ai-review), [felloai](https://felloai.com/what-is-genspark-ai/)). **Not verified on genspark.ai** because the site blocked me. Treat the exact wording as unconfirmed.

Note "**complete business outcomes**" and "**autonomously**". That is an outcome-level autonomy claim, stronger than a task-level one. Also reported: a 2026 product called **Genspark Claw**, marketed around the phrase "the first AI colleague." `CLAIMED`.

### Funding

- **$535M total across 4 rounds**; most recent a **$100M Series B extension on 2026-06-17**, led by **Sozo Ventures**, with Korea Mirae Asset and UpHonest Capital. `CLAIMED` (third-party aggregators)
- Valuation **$2.6B**. `CLAIMED`

### Claimed traction

- **$250M ARR in 2026**, up from $50M in 2025. `CLAIMED` (Latka; founder-self-reported, unaudited)
- **2M+ monthly active users** by March 2026. `CLAIMED`

If the $250M ARR figure is even roughly right, Genspark is the largest pure-play agent company in this report by revenue. But it comes from Latka, which is self-reported data, and I could not check it against a primary source.

### Named, verifiable customers

**`NOT FOUND`.** No named enterprise customer or case study located. For a company claiming $250M ARR, that is a notable absence, though it is consistent with a **consumer/prosumer self-serve** business (2M MAU) where there are no logo-able enterprise accounts to name. A high-volume self-serve product is a legitimate business model; it is just not evidence that anyone's company is being run by AI.

### How many humans do THEY employ?

`NOT FOUND`. Genspark is a substantial venture-backed company with $535M raised; headcount is certainly not zero.

### Verdict

**Claim is UNBACKED by published evidence**, with the honest caveat that their site blocked my fetch, so I could not read their own fine print or case studies. What is checkable (zero named customers, unaudited self-reported ARR) does not substantiate "autonomously delivers complete business outcomes."

---

## 10. OpenAI Frontier: the incumbent claim, at maximum scale

**URL:** https://openai.com/index/introducing-openai-frontier/ and https://openai.com/business/frontier/. **Both returned HTTP 403 Forbidden** to my fetch on 2026-08-17. Quotes below are second-hand from reporting and are labelled as such. Launched **2026-02-05**.

### The maximal claim (second-hand)

> Teams across the organization, technical and non-technical, can use Frontier to **hire AI coworkers** who take on many of the tasks people already do on a computer.

> Frontier gives agents the same skills people need to succeed at work: shared context, onboarding, hands-on learning with feedback, and clear permissions and boundaries.

> agents "plan complex tasks, take real actions, and fix their own mistakes"

`CLAIMED`, attributed to OpenAI's own announcement, relayed via [DataCamp](https://www.datacamp.com/blog/openai-frontier), [InfoQ](https://www.infoq.com/news/2026/02/openai-frontier-agent-platform), [SmarterX](https://smarterx.ai/smarterxblog/openai-frontier). Not primary-verified due to the 403.

This is the most consequential adoption of the claim in the dataset, because OpenAI has borrowed the entire **HR vocabulary**: you "hire" AI coworkers, "onboard" them, and manage their performance. Reporting also indicates Enterprise IAM "applies across your workforce of employees **and AI coworkers**", one identity system for both, which is the deepest structural version of the claim anyone has shipped.

### The exclusions: which are unusually large

- **Not generally available.** "Currently, OpenAI Frontier is available to a limited group of early enterprise adopters...with broader availability rolling out over the coming months." `CLAIMED` (reported). **There is no public signup.**
- **Requires a Big Four-style consultancy to deploy.** Access runs through the **Frontier Alliance** partner program: **McKinsey, BCG, Accenture, Capgemini.** `CLAIMED`. This is the quiet part: the platform that lets you hire AI coworkers requires you to first hire McKinsey. Every deployment is mediated by a large team of human consultants billing hourly.
- **"clear permissions and boundaries"**, a governance layer defined by humans.
- **"makes agent performance transparent to human managers"**, a human manager is architecturally required.
- Reported prerequisites: "highly customized" deployments, "clean, connected data infrastructure," and an **"AI-literate workforce for effective oversight."** `CLAIMED`. The last one is decisive: the product requires a workforce.

### Named customers

**Uber, Intuit, State Farm, HP, Oracle** as early customers. `CLAIMED` (consistently reported across outlets, and named in OpenAI's announcement per that reporting). Case studies with measured outcomes: `NOT FOUND`. These are early-access design partners, not published results.

### Pricing

Reported as **outcome-based**. Paying for work completed rather than per seat. `CLAIMED`. Worth noting: outcome-based pricing is the one pricing model that would actually put a vendor's revenue at risk if the agents didn't work, so if real it is a meaningful commitment.

### Verdict

**Claim is UNBACKED by published evidence, because it is too early to be backed.** OpenAI has made the most linguistically complete version of the maximal claim ("hire AI coworkers," shared IAM with employees) while shipping it to a closed list of design partners via four consultancies, with zero published outcomes. The claim may well become backed; as of 2026-08-17 there is nothing published to back it, and the delivery model requires more humans (consultants + an AI-literate workforce + human managers), not fewer.

---

## 11. Salesforce Agentforce: the only company with hard numbers, and it disproves the maximal version

**URLs:** salesforce.com/agentforce/ and the Agentforce 360 press release **both returned HTTP 403** on 2026-08-17. Quotes below are second-hand, labelled. Financial figures are from earnings disclosures, which makes them the most reliable numbers in this report.

### The claim, and its deliberate hedge

Salesforce's positioning, per its own fiscal 2026 materials as reported:

> "the operating system for the Agentic Enterprise"

Benioff, verbatim:

> "We're entering the age of the Agentic Enterprise. Where AI **elevates human potential** like never before."

`CLAIMED` (widely reported, [Salesforce newsroom](https://www.salesforce.com/news/press-releases/2025/10/13/agentic-enterprise-announcement/), [TechRadar](https://www.techradar.com/pro/this-is-the-next-revolution-salesforce-ceo-marc-benioff-hails-the-arrival-of-the-agentic-enterprise)).

Note the hedge is built into the slogan: "**elevates human potential**." Salesforce sells the concept as **"digital labor"**. Benioff frames per-user licenses from **$125/user/month** in those terms, while framing the outcome as human augmentation. The commercial noun is replacement; the PR adjective is elevation.

### The traction: genuinely verified, and the only such case here

- **Agentforce ARR $800 million, up 169% year over year**
- **29,000 deals closed**
- Accounts in production up nearly **50% quarter over quarter**

`VERIFIED`-grade: these are figures disclosed by a **public company (NYSE: CRM)** in earnings communications, subject to securities law. This is the only revenue number in this report with real legal consequences attached to being wrong. Whatever else is true, **enterprises are spending real, audited money on agents.**

### The reverse walk-back: Salesforce moved TOWARD the claim, and produced evidence

Every startup here softened its claim. Salesforce did the opposite, and unusually, brought numbers:

- Salesforce **cut ~4,000 customer support roles**; its support workforce went from **9,000 to 5,000** since the start of 2025. `VERIFIED` (Benioff stated it publicly on The Logan Bartlett Show; reported by [Fortune](https://fortune.com/2025/09/02/salesforce-ceo-billionaire-marc-benioff-ai-agents-jobs-layoffs-customer-service-sales/), [Fox Business](https://www.foxbusiness.com/economy/salesforce-cuts-4000-jobs-due-ai-ceo-says), [TechRadar](https://techradar.com/pro/salesforce-says-it-cuts-4-000-support-jobs-and-replaced-them-with-ai))
- Benioff, verbatim: **"I need less heads."** `VERIFIED` (direct quote, widely reported)
- Support costs down **17%**. `CLAIMED` (company figure)
- Reporting explicitly notes this **reversed** Benioff's own earlier position that AI would augment rather than replace. `VERIFIED` as a documented change of position.

**This is the strongest single piece of evidence in the entire report that AI agents displace human headcount at scale.** It is first-party, from a public company, with a number attached.

### And here is the ceiling, from the same source

> Today, **50% of interactions are with agents, 50% are with humans.**

`CLAIMED` (Salesforce's own figure). The most advanced, best-resourced, most financially committed deployment of customer-service agents on earth, by the vendor, on itself, as a flagship reference. Tops out at **half**. Not 90%. Not "no humans needed." Half.

And on the 4,000: Salesforce's own statement is that it **stopped backfilling** and redeployed people, not that the work vanished:

> "we no longer need to actively backfill support engineer roles. We've successfully redeployed hundreds of employees into other areas like professional services, sales, and customer success."

`VERIFIED` (company statement). Attrition plus redeployment, not elimination.

### Verdict

**Claim is BACKED for the narrow version, UNBACKED for the maximal version.** Salesforce is the only entity in this report that has published audited-grade revenue ($800M ARR) *and* first-party headcount evidence (9,000 → 5,000 support staff, "I need less heads"). The narrow claim. Agents materially reduce support headcount. Is backed. The maximal claim is refuted by Salesforce's own number: **50/50 human-to-agent**, with staff redeployed rather than removed. Notably, Salesforce never actually made the maximal claim; its slogan says "elevates human potential."

---

## 12. Microsoft and ServiceNow: the incumbents who explicitly refuse the maximal claim

### Microsoft

Microsoft's flagship annual research, the **2026 Work Trend Index**, is titled: **"Agents, human agency, and opportunity."** `VERIFIED` (title on [microsoft.com/worklab](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)).

The world's largest enterprise software vendor, and OpenAI's biggest commercial partner, named its agent research after **human agency**. Its central concept is the **"agent boss"**, a human who supervises and coordinates AI teammates. `VERIFIED`. The frame is explicitly promotion-of-humans, not replacement-of-humans.

Their own adoption number undercuts the hype: **only 16% of AI users qualify as "Frontier Professionals,"** their most advanced category. `CLAIMED` (Microsoft research, based on trillions of anonymized M365 signals and a 20,000-worker survey across 10 countries, a large and methodologically disclosed sample). Microsoft also reports an AI **"paradox"** holding companies back ([GeekWire](https://www.geekwire.com/2026/microsofts-new-research-finds-an-ai-paradox-holding-companies-back/)).

**Verdict: Microsoft does not make the maximal claim.** It makes the opposite claim. Humans manage agents, and publishes data showing adoption is early. `N/A` for claim-backing; recorded here because the largest vendor's refusal to make the claim is itself evidence about the claim.

### ServiceNow

**Fetch status: BLOCKED**, the ServiceNow newsroom returned **HTTP 429** and then **403** on 2026-08-17. Second-hand only.

ServiceNow launched **"Autonomous Workforce"** at Knowledge 2026, deploying "AI specialists" for L1 service desk, CRM, HR and security. `CLAIMED`.

The critical detail, and it is a self-imposed limit: the AI specialists execute work **"with defined scope, authority, and governance."** `CLAIMED` (per [ServiceNow newsroom](https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-brings-Autonomous-Workforce-to-every-major-business-function/default.aspx) reporting). Governance is in the product description, not the fine print.

Availability: the first AI specialist (**Level 1 Service Desk**) is in **controlled availability**, with GA expected Q2 2026. `CLAIMED`. "Autonomous Workforce" ships as one Level-1 helpdesk agent in limited release.

**Verdict: claim is UNBACKED by published evidence**. No published outcomes, product in controlled availability, and the claim is self-limited to "defined scope, authority, and governance." Note the word choice: "Autonomous **Workforce**" is a product name; "L1 service desk" is the product.

---

# Cross-cutting findings

## Verdict table

| Company | Maximal claim (their words) | Their own headcount | Verdict |
|---|---|---|---|
| **Artisan** | "Stop Hiring Humans" | ~168-190 `CLAIMED`; careers page live | **UNBACKED**, retracted twice by the company itself |
| **Mechanize** | "full automation of valuable work across the economy" | Very small; hiring engineers | **UNBACKED**, 0 customers, 0 revenue, ships one benchmark |
| **11x** | "Digital workers, Human results" / "24/7 Digital Workforce" | High dozens-low hundreds `CLAIMED` | **UNBACKED**, 2 named "customers" publicly denied being customers |
| **Lindy** | "Your next hire is AI." | `NOT FOUND`, non-zero | **PARTLY BACKED**, product real; logo wall buyable for $29.99 |
| **Cognition / Devin** | "ships production code on its own" | Large; *acquired* an eng team | **PARTLY BACKED**, best customer list; 15% success in the one rigorous test (Jan 2025) |
| **Polsia** | "AI That Runs Your Company While You Sleep" | **Zero** `CLAIMED`, the only match | **UNBACKED**, 0 named customers; investor-sourced growth figures |
| **Medvi** (proof point) | "2 employees, $401M" | **2** `VERIFIED`-adjacent | **PARTLY BACKED**, revenue real; humans outsourced; FDA warning letter |
| **Cofounder** | "run an entire company with AI" | `NOT FOUND` | **PARTLY BACKED**, self-cancelled by "Nothing ships without your approval" |
| **Genspark** | "autonomously delivers complete business outcomes" | `NOT FOUND`, non-zero | **UNBACKED**, site blocked me; 0 named customers |
| **OpenAI Frontier** | "hire AI coworkers" | Very large | **UNBACKED**, closed beta, deployed via McKinsey/BCG/Accenture |
| **Salesforce** | "digital labor" / "elevates human potential" | 9,000 → 5,000 support `VERIFIED` | **BACKED (narrow) / UNBACKED (maximal)**, their own ceiling is 50/50 |
| **ServiceNow** | "Autonomous Workforce" | Very large | **UNBACKED**, one L1 helpdesk agent, controlled availability |
| **Microsoft** | *declines the claim*, "human agency," "agent boss" | Very large | **N/A**, makes the opposite claim |

## 1. The claim has a decay curve, and it is well documented

Every venture-backed company that made the maximal claim in its own voice has since softened it. The pattern is consistent enough to be a rule:

| Company | Then | Now |
|---|---|---|
| Artisan | "Stop Hiring Humans" | "Stop Hiring Humans **\*For Work They Hate**" → "**alongside your team**" |
| 11x | AI SDRs replace your SDRs | "Digital workers, **Human results**" |
| Cognition | "the first AI software engineer" | "**working alongside people** as an exponential collaborator" |
| Mechanize | "full automation of **all work**" | "full automation of **valuable** work" + a GBA emulator benchmark |
| Benioff | AI will augment, not replace | "**I need less heads**" (*reversed direction*) |

Only Salesforce moved toward the claim, and only Salesforce brought numbers.

## 2. Three tells that the claim is being hedged

Learned from reading these pages side by side. All three appear repeatedly:

- **"Alongside."** Artisan: "alongside your team." Cognition: "alongside people." Cofounder: "Agents work alongside you." When a vendor inserts "alongside," the replacement claim has been withdrawn.
- **The claim gets outsourced to a testimonial.** Artisan's own copy says "alongside your team," but a customer quote says "We've replaced our entire outbound sales team." Lindy's own copy says "teammate," but its testimonials say "Replace your executive assistant" and "killed the virtual assistant industry." The vendor keeps the marketing benefit of the maximal claim while never asserting it. **This is the single most common evasion in the category**, and it is worth naming because it is legally deliberate: a testimonial is someone else's speech.
- **The exclusion is printed next to the claim.** Cofounder: "run an entire company with AI" and "Nothing ships without your approval," on the same page. ServiceNow: "Autonomous Workforce" with "defined scope, authority, and governance." The fine print isn't hidden. It's adjacent, and nobody reads it.

## 3. The "no humans" sellers employ humans, and one accidentally admitted it

The report's best single artifact is Artisan's own careers page headline: **"Hiring bold humans to build the best AI employees."** A company that bought billboards telling the world to stop hiring humans leads recruitment with the word "Hiring."

The only company whose headcount matches its claim is **Polsia** (zero employees), and it raised $30M explicitly to **hire a sales team, a marketing team, and more engineers**. Its zero-employee status has a company-announced expiry date.

## 4. "Zero employees" usually means "zero employees on my payroll"

Medvi is the category's flagship proof and the clearest illustration. Two employees, $401M revenue, NYT-reviewed financials, and **CareValidate and OpenLoop Health supply the licensed physicians, prescription processing, pharmacy fulfillment, shipping, and compliance.** The human labour didn't vanish; it was purchased from vendors.

Any "N-employee company" figure should be read as a statement about employment structure, not about automation. Ask: who does the licensed, regulated, physical, and liability-bearing work?

## 5. Logo walls are now actively unreliable: this is established, not speculative

Two named enterprises went **on the record** denying they were customers of a company advertising them:

- **ZoomInfo** confirmed it was never an 11x customer and demanded its logo be removed.
- **Airtable** stated its trial product "was never used in production and never rolled out to our sales team", while still appearing on 11x's customer list months later.

Against that precedent, evaluate the other logo walls: Lindy displays **Apple, McKinsey, NVIDIA, Harvard, Shopify, Adobe** on a product with a **$29.99/month self-serve tier and a 7-day free trial.** One employee's expensed subscription is enough to earn a logo. Cognition's list (Goldman Sachs, Mercedes-Benz, Nubank, Itaú) is far more credible precisely because those are enterprise procurement relationships in regulated industries that cannot be initiated with a credit card.

**Rule of thumb this research supports:** a logo wall on a self-serve product is evidence of signups. A logo wall on an enterprise-priced product sold into a regulated industry is evidence of procurement. Only the second is worth anything.

## 6. Only two hard numbers exist in this entire category

Out of thirteen entities, exactly two traction figures carry real evidentiary weight:

1. **Salesforce: $800M Agentforce ARR, +169% YoY, 29,000 deals**, disclosed by a public company under securities law.
2. **Medvi: $401M revenue, 250,000 customers, 16.2% net margin (2025)**. Financials reviewed by The New York Times.

Everything else is founder-self-reported (Latka), investor-asserted (True Ventures on Polsia), or page copy. **The two hard numbers both come with a hard ceiling attached:** Salesforce's own agent-to-human ratio is 50/50, and Medvi outsources every licensed function to human-staffed vendors.

## 7. The best-measured version of the gap

**Devin, tested independently by three Answer.AI-affiliated data scientists (published January 2025): 3 of 20 tasks completed satisfactorily, 3 inconclusive, 14 outright failures.** Their more damaging observation was not the 15% success rate but the **unpredictability**. They could not tell in advance which tasks would succeed, and tasks resembling earlier wins failed in slow, expensive ways.

**Stated honestly: this is 19 months old and tested an early Devin.** Cognition has since published a post titled "Estimating the Productivity of an Autonomous AI Software Engineer" (dated 06.04.26) whose figures I could not retrieve. A current independent replication at comparable rigour is `NOT FOUND`, which is itself the finding. **Nobody has published a rigorous, independent, current measurement of any of these products.** The category's central factual question is unmeasured.

## 8. What nobody in this dataset does

Across all thirteen, `NOT FOUND` in every case:

- **Nobody publishes a success rate.** Cognition, whose entire value proposition is engineering productivity, shows **zero quantified productivity metrics** on its homepage.
- **Nobody names the liability holder.** Not one page states who is legally responsible when the agent makes a false claim to a customer. Medvi shows exactly what that costs: an FDA warning letter for misbranding, a chatbot that invented drug prices and non-existent product lines, and allegedly deepfaked testimonials.
- **Nobody names an AI-disclosure statute.** Cofounder cites SOC 2 (a security audit); nobody cites a disclosure law.
- **Nobody distinguishes what the agent *observed* from what it *inferred*** before putting a claim in front of a customer. Medvi's chatbot fabricating prices is the direct consequence.

## 9. The honest read

**The maximal claim is not currently true, and the people selling it mostly know that**, which is why their own pages hedge, their testimonials carry the strong version, and their fine print cancels it.

But two things *are* true and should not be dismissed:
- **AI leverage produces real revenue at tiny headcount.** Medvi's $401M on two employees is real. That is a genuine change in what a small team can do.
- **Agents do displace headcount in narrow, high-volume functions.** Salesforce's support org went 9,000 → 5,000, first-party, on the record.

The gap is not between "AI works" and "AI doesn't." It is between **narrow, supervised, measurable automation** (real, purchasable, and already reducing headcount) and **the autonomous company** (asserted by everyone, published by no one, and contradicted by the fine print of the very companies asserting it).

---

# Fetch limitations: disclosed

The following blocked my read-only fetches on 2026-08-17. Where I used second-hand sources I labelled them `CLAIMED` and did not present them as primary-verified. **I did not substitute guesses for any blocked page.**

| URL | Status |
|---|---|
| genspark.ai | 403 Forbidden |
| openai.com/index/introducing-frontier/ and /business/frontier/ | 403 Forbidden |
| salesforce.com/agentforce/ and Agentforce 360 press release | 403 Forbidden |
| servicenow.com newsroom (both URLs) | 429, then 403 |
| en.ain.ua Polsia article | 403 Forbidden |
| en.wikipedia.org/wiki/Artisan_AI | 404 Not Found (article does not exist at that title) |
| polsia.com | Returned only a single headline; product/customer/team detail not retrievable |

Additional honest gaps: exact headcounts are `NOT FOUND` on primary sources for Artisan, 11x, Lindy, Cognition, Cofounder, and Genspark. None publish it, and third-party aggregators disagree (Artisan: 35 vs 168 vs 190). Funding is `NOT FOUND` for Lindy and Mechanize. The "~4% of Polsia companies are active" figure from prior internal notes could **not** be confirmed today and is not relied upon anywhere in this report.


# Maximal-Claim Watch: pre-launch / stealth / newly-funded "AI runs the whole company"

Research date: **2026-08-17**. Read-only pass. No waitlist joined, no form submitted, no account created, no trial started.

Label key: **VERIFIED** = read it myself on the primary page/filing. **CLAIMED** = the company or a secondary outlet says it; I did not independently confirm. **NOT FOUND** = I looked and could not find it.

Note on method and its limits: YC's directory, most stealth landing pages, and funding databases are gated or JS-rendered. Where a fetch failed I say so rather than infer. Search-engine summaries are treated as leads, never as evidence.

---

## HEADLINE ANSWER (the reason for this research)

**Has any company successfully sold the full-autonomy claim to an enterprise or an institution? NO. NOT FOUND, after eleven distinct search angles.** No named enterprise, university, or government body publicly says it bought "AI runs our company" or "AI runs our department." The closest named datapoint in existence is Notion reporting a **3.4% ask-for-human rate** on support chat through Decagon -- one channel of one function, with the human team retained and explicitly reframed rather than removed. The only large enterprise that ever really made the claim about itself was **Klarna**, and it publicly reversed and rehired. Full detail and the audit trail of how hard I looked are in "The enterprise-sale question" below.

**Three findings that matter more than the entry list:**
1. **The two most credible full-autonomy teams both refused to sell the claim and decided to buy companies instead.** Rocketable (YC W25) acquires software products; Skyfall AI (ex-Maluuba/Microsoft founders) is spending $1M to buy a business and run it with AI as CEO. Skyfall states the reason plainly: *"If you want a truly autonomous business, you have to buy a business and operate the whole thing end to end."*
2. **The nearest neighbour to our pitch already retreated.** Pancake launched on Product Hunt 2026-05-28 as *"OpenClaw in Slack that makes your company autonomous"* -- Slack-first, subagent squads, agent email and phone, spend caps, kill switch, SOC 2, i.e. our shape. Its hero copy today reads **"You run your company. We run your GTM."** Under three months, unforced.
3. **Our governance vocabulary is now commodity.** Human-in-the-loop approvals, spend caps, audit logs, scoped/killable agents, SOC 2: shipped or claimed by Pancake, Corvera (4 people), Naive (10 people), and SAP. Governance-as-vocabulary differentiates us from nobody. Only enforcement that can fail closed, provenance behind a public claim, and a named liable human still do.

---

## Entries

### 1. Rocketable (YC W25) -- the purest form of the maximal claim
- **URL**: https://www.ycombinator.com/companies/rocketable -- **fetched 2026-08-17** -- also https://rocketable.com
- **Stage**: funded (YC Winter 2025), operating. Not stealth. This is a holding company, not a SaaS product.
- **Claim, VERBATIM** (VERIFIED on YC page): tagline *"The AI Maximalist Software Holding Company"*; body *"Rocketable is building a large portfolio of wildly profitable software businesses by acquiring existing products and replacing human teams with AI agents."*
- **The maximal sentence, VERBATIM** (VERIFIED): *"When every human function required to operate a software product has an AI agent equivalent, the next step will be within reach: operating an entire company with a team of AI agents instead of humans."*
- **Founders / size**: Alan Wells (solo founder listed). Team size **2**. San Francisco. (VERIFIED, YC page)
- **Funding**: YC-backed; no round disclosed on the YC page. **NOT FOUND**
- **Shippable today vs promised**: nothing is sold to anyone. Rocketable *buys* software companies and runs them with agents in-house. There is no product a customer can use. Note the tense in their own sentence: *"the next step **will be** within reach"* -- they are explicitly describing operating a whole company with agents as a future state, not a current one.
- **Governance**: **NOT FOUND**. No human approval, compliance, audit, or AI-disclosure language on the YC page.
- **Verdict**: The claim is real and stated plainly, but it is a claim about *themselves*, not a product. There is no thing to buy. Closest philosophical neighbour to competitor.inc and the furthest from a sale.

### 2. Axelrod (YC S26) -- "hotels that run themselves", and they invented graduated autonomy
- **URL**: https://www.ycombinator.com/companies/axelrod -- **fetched 2026-08-17**
- **Stage**: YC Summer 2026 (the batch running right now, Demo Day 2026-09-10). Just launched / early customers unproven.
- **Claim, VERBATIM** (VERIFIED): tagline *"Boutique Hotels that run themselves"*; body *"Autonomous software for hotels that takes over all front-of-house and back-of-house tasks with zero integrations, running operations better than your staff would."*
- Also VERBATIM: *"Agents execute all non-physical front-of-house (FoH) and back-of-house (BoH) tasks"* and *"runs better than your staff would"*; agents drive *"the hotel's existing stack (PMS, POS, RMS) the way your staff do"*.
- **Founders / size**: Saman Sayahpour, Adrian Lucas Tariel Stoica. Team size **2**. San Francisco. (VERIFIED)
- **Funding**: YC standard deal; nothing else disclosed. **NOT FOUND**
- **Shippable today vs promised**: a real vertical product is plausible (they name the systems they drive -- PMS/POS/RMS) but no named hotel customer is on the page. **Named customer: NOT FOUND.**
- **Governance -- IMPORTANT, this is the one competitor that has our rail**: VERBATIM *"Agents start fully supervised and earn autonomy as they prove themselves, so hotels hand over the operations at their own pace."* That is earned-autonomy staging, stated as a selling point. No compliance framework, no audit trail, no AI-disclosure language. Partial.
- **Verdict**: Product behind the claim, probably -- but the claim is scoped to one vertical's non-physical tasks, and they already ship the "supervised first" framing. Do not assume graduated autonomy is unique to us; a 2-person S26 team is selling it as copy.

### 3. Corvera (YC W26) -- an "AI agent workforce" that already ships the compliance vocabulary
- **URL**: https://www.ycombinator.com/companies/corvera -- **fetched 2026-08-17**
- **Stage**: funded (YC Winter 2026), shipping.
- **Claim, VERBATIM** (VERIFIED): tagline *"The context layer for AI-native CPG brands"*; positioning phrase *"the AI agent workforce for CPG back-office"*; product claims *"Process orders end-to-end without lifting a finger"*.
- **Founders / size**: Christopher Kong (CEO, 2x founder), Dirk Breeuwer (CTO, ex-Google Data & AI lead), Matthew Collins (CPO). Team size **4**. San Francisco. (VERIFIED)
- **Funding**: not disclosed beyond YC. **NOT FOUND**
- **Shippable today vs promised**: real product; MCP-based context layer plus agents over an existing CPG data stack. Named customer **NOT FOUND**.
- **Governance -- present, and stated in our vocabulary**: VERBATIM *"secure, audit-logged, and access-controlled"* and *"human-in-the-loop approvals"* on order processing. (VERIFIED)
- **Verdict**: Product behind the claim. Note hard: audit logging + human-in-the-loop + access control is now standard copy for a 4-person W26 team. Compliance *vocabulary* is no longer a differentiator. Only enforcement is.

### 4. River AI -- the biggest cheque in the space explicitly REJECTS the replacement claim
- **URL**: https://techcrunch.com/2026/08/11/general-catalyst-leads-1-1b-round-into-2-month-old-river-ai/ -- **fetched 2026-08-17**
- **Stage**: post-stealth (launched June 2026), **$1.1B round** led by General Catalyst and AMP PBC, with Nvidia, AMD Ventures, Y Combinator, Temasek. Company was ~2 months old. Founder Igor Babuschkin (xAI co-founder, ex-DeepMind, ex-OpenAI). (CLAIMED by TechCrunch; treat the round as reported, not as filed)
- **The claim, VERBATIM** (VERIFIED in the article): River is building *"personally trainable assistants, rather than following the trajectory other AI labs are on: human worker replacements."*
- **Why this entry matters**: this is the single largest recent raise adjacent to our category and it **defines itself against** the replace-the-workforce framing. The maximal claim is not consensus even among the best-funded. Whoever tells the founder "everyone is claiming full autonomy now" is wrong.
- **Shippable today**: yes, a real API billed per million tokens (RL + LoRA fine-tuning). Not a company-runner.
- **Governance**: **NOT FOUND**.
- **Verdict**: Not a competitor to the claim. Counter-evidence against it. Keep for the positioning file.

---

## The Klarna precedent -- the one enterprise that DID say it publicly, and then took it back
- **URLs**: https://www.forbes.com/sites/quickerbettertech/2025/05/18/business-tech-news-klarna-reverses-on-ai-says-customers-like-talking-to-people/ and https://www.fastcompany.com/91468582/klarna-tried-to-replace-its-workforce-with-ai -- **fetched/searched 2026-08-17**
- Feb 2024: Klarna + OpenAI ship an assistant that handled 2.3M chats in 30 days, publicly framed as *the work of 700 full-time agents* (CLAIMED, widely reported).
- May 2025: Klarna reverses and rehires humans. CEO Sebastian Siemiatkowski concedes quality fell -- reported quote *"what you end up having is lower quality"* -- and commits to an "Uber-type" model where a customer can always reach a human. (CLAIMED, Forbes + Fast Company)
- Reported failure modes: hallucination on edge cases, CSAT collapse on complex/emotional tickets, and **compliance concern about AI autonomously handling disputes and account closures**.
- **Why this is the most important entry in the file**: the only large enterprise that loudly bought the full-autonomy story about its own department is also the most cited reversal in the market. Every enterprise buyer in 2026 has heard of it. That is the objection we will be sold against, and it is also the exact opening for a governed pitch: the failure was not capability, it was ungoverned handoff of disputes and account closures.

---

### 5. Pancake / Basalt (Stockholm) -- THE closest thing to us, and it already RETREATED from the maximal claim
This is the most important competitive entry. Read it twice.

- **URLs**: https://getpancake.ai/ and https://www.producthunt.com/products/pancake-6 -- both **fetched 2026-08-17**
- **Stage**: launched on Product Hunt **2026-05-28/29** (620 points; ~465 votes and 65 comments day one). Built by **Basalt**, Stockholm. Reported raise ~**$156,500** at launch (CLAIMED, secondary). **As of today the site is back to "Join waitlist" / "Book a call".**
- **The original claim, VERBATIM** (VERIFIED via Product Hunt product page + secondary review): *"OpenClaw in Slack that makes your company autonomous"* and, from their own site at the time, *"stacks autonomous agents to help your company run itself"*.
- **The claim TODAY, VERBATIM** (VERIFIED on getpancake.ai, fetched 2026-08-17): hero reads **"You run your company. We run your GTM."**
- **That delta is the finding.** In under three months, the nearest neighbour to our pitch walked from "makes your company autonomous" to an explicit disclaimer that the human runs the company and the agents run one function. Nobody made them do that. The maximal claim did not survive contact with buyers.
- **Overlap with competitor.inc -- uncomfortably close**: Slack as the interface; a squad of dedicated subagents per request; agents get their own phone number, email inbox, and authenticated browsing; private cloud computer + encrypted secrets; multi-provider LLM (Claude/GPT/Gemini). Compare our AgentMail + treasury + policy engine. They shipped the same shape.
- **Governance -- they have our rails, in our words** (VERBATIM, from the PH product page): *"humans only step in to merge PRs, approve external comms, and sign off on anything irreversible or above a spend threshold"*; *"every agent action is logged, scoped, and killable. nothing runs invisibly"*; **SOC 2** referenced (compliance.getbasalt.ai). On the current site: *"Spend caps and approvals built in"*.
- **Pricing**: $49/mo base plan with a 3-day trial and $100 credits at PH launch; the current site shows **$99/month flat**. Both CLAIMED from page text. "Agent credit card" was marked *Soon*.
- **Shippable today vs promised**: real product existed and was being used at launch. Today's public surface is **waitlist only, not joined** (per instruction). No named customer, no logo wall -- testimonials are individual X/Twitter handles only. **Named customer: NOT FOUND.**
- **Verdict**: There is a product behind it, and there is also a documented retreat. The forbidden-floor + spend-cap + kill-switch + audit-log rail set is **not a moat by itself** -- a small Stockholm team shipped it and put SOC 2 next to it. Our defensible edge has to be the part they do not have: enforcement wired into the publish gate, provenance-graded truth, and a named liable human. Not the vocabulary.

---

### 6. The General Intelligence Company of New York (product: "Cofounder") -- the one-person-billion-dollar claim
- **URLs**: https://www.generalintelligencecompany.com/about -- **fetched 2026-08-17**; secondary https://stealthstartupspy.substack.com/p/stealth-startup-spy-232 and Forbes 2025-12-08 on the $8.7M round
- **Stage**: out of stealth. $2M pre-seed (reported 2025-04-13), then **$8.7M led by USV** (reported Forbes 2025-12-08). Backers also listed as Compound and Acrew. Founded January 2025.
- **Founders**: Andrew Pignanelli (co-founder/CEO), Abhishyant Khare (CTO, ex-engineering lead at Gantry). Team size **2** at the stealth-listing stage. New York City.
- **Mission, VERBATIM** (VERIFIED on their about page): **"Enable the one-person one-billion dollar company."** Supporting lines, VERBATIM: *"People orchestrating swarms of agents can run vast complex businesses"*; *"Every business owner should have a full staff of agents available 24/7"*; *"AI should enable people to work less and do more."*
- Earlier framing, VERBATIM (CLAIMED, secondary): *"building full-stack AI agents to run businesses end-to-end - enabling a future where one person can operate at the scale of a Fortune 500"*.
- **Reported self-description of the loop** (CLAIMED, secondary): an agent watches the support inbox, and when a customer requests a feature it writes the code, submits it for review, and pushes toward production, with *"No human touches it until the final approval."* Pignanelli reported as saying *"Over 95% of our code is written by AI."*
- **Shippable today vs promised**: product **"Cofounder"** shipped (launched September, thousands of users in week one -- CLAIMED). It is an AI chief-of-staff, not a company-runner. Same pattern as everyone else: maximal mission statement, chief-of-staff product.
- **Governance**: **NOT FOUND** on the about page. The only oversight signal is the reported *"final approval"* human step in their own internal loop -- notably, they apply human approval to themselves while marketing autonomy.
- **Verdict**: Claim without the matching product yet. This is our namesake rival (cofounder.co) and now I have the parent entity name for the intel file.

### 7. Naive -- the funded category leader, and it CANNOT NAME A CUSTOMER
- **URL**: https://techcrunch.com/2026/08/06/naive-raises-28-5m-to-automate-the-grunt-work-of-setting-up-and-running-a-company/ -- **fetched 2026-08-17**
- **Stage**: **$28.5M Series A** led by Nexus Venture Partners, ~$32M total; YC, Zetta, Liquid 2, angels Gokul Rajaram, Tim Zheng, JD Sherman. **10 full-time employees.** Revenue run-rate reported up 10x to low double-digit millions over six months. (CLAIMED, TechCrunch)
- **Claim, VERBATIM**: *"its infra can automate most of the work in setting up and running a business"*; *"set up over 30,000 developer customers within months of its launch"*.
- **The critical line, VERBATIM**: *"We have some customers who run an entire rental-car agency autonomously."* -- **the customer is NOT named.** Other cited uses are AI automation agencies and faceless TikTok/YouTube channels, including one posting AI-generated pet videos.
- **Governance, VERBATIM**: *"users are still required to be involved to complete KYC/KYB processes"*; *"A governance layer promises to help users set budgets, restrict their agents' capabilities, and require human approval before sensitive actions"*. Note the reporter's word choice: *promises*. No audit, liability, or disclosure detail.
- **Verdict**: Product yes, at real scale, with 30,000 developer accounts. But the full-autonomy proof point is an **anonymous rental-car agency and a pet-video channel**. Their governance layer is budgets + capability restriction + human approval on sensitive actions -- our exact rail set, described in the future tense.

### 8. SAP "Autonomous Enterprise" -- the incumbent made the maximal claim in May 2026
- **URLs**: https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/ and https://www.forbes.com/sites/victordey/2026/05/12/the-end-of-the-erp-era-sap-wants-ai-agents-to-run-your-autonomous-enterprise/ -- both **fetched 2026-08-17**
- **Stage**: announced at Sapphire 2026, Orlando, **2026-05-12**. Roadmap language, not GA. VERBATIM: *"The suite will deploy more than 50 domain-specific Joule Assistants"* -- future tense; no availability date given.
- **Claim, VERBATIM**: SAP positions agents to *"help enhance the world's most critical business workflows, so that humans and AI work together"*. Note that SAP's own words are **"humans and AI work together"**, not replacement. CEO Christian Klein, VERBATIM: *"For the mission-critical processes of our customers, 'almost right' just isn't good enough."*
- **Named customer**: exactly one, **RWE** (European energy). What RWE actually does, VERBATIM per Forbes: *"AI agents analyze offshore wind turbine incidents, identify likely root causes and generate prefilled maintenance work orders."* **Prefilled work orders = a draft a human executes.** No RWE quote is provided in either piece. No customer validates the autonomy claim.
- **Governance, VERBATIM**: Klein -- *"Every action an agent takes in our Autonomous Suite is fully logged. You always know what an agent did, why it did it and what data it used."* He calls it *"traceability by design."* SAP also claims it will *"anchor AI agents in the business processes, data and governance so they can deliver accurate, compliant and secure outcomes."*
- **The gap, and it is our gap to attack**: SAP's governance answer is **logging, not approval, and not liability**. Neither article contains human-approval requirements, a liability framework, or what happens when an agent is wrong. Traceability tells you who to blame after the loss; it does not prevent the loss.
- **Verdict**: Claim with a roadmap and one scoped reference. The most credible actor in the category, and even it retreats to "humans and AI work together."

### 9. Lower-intensity entries checked and scoped out
- **Sameday** (YC W23, Lehi UT, founder Aaron Cooper, team 7). VERBATIM: *"The leading AI workforce for the trades"*, *"outperforming humans at high-stakes, revenue-critical work, such as sales, dispatch, and more"*, *"Sameday's virtual sales agent closes 80% of all sales calls it receives."* Function-level, not company-level. Named customer **NOT FOUND**. Governance **NOT FOUND**. https://www.ycombinator.com/companies/sameday (fetched 2026-08-17)
- **Hyper** (YC P26, founder Kanyes Thaker + "Shalin"). VERBATIM: *"The Self-Driving Company Brain"*, *"Hyper learns your entire company and puts it back into every AI you use."* Despite the name it is a context/knowledge layer feeding other agents, not an operator. "Book a demo." Governance **NOT FOUND**. https://www.ycombinator.com/launches/QKg-hyper-the-self-driving-company-brain (fetched 2026-08-17)
- **Other YC S26/W26 names in this neighbourhood** (from an aggregator listing, batch/copy **CLAIMED not VERIFIED** -- and note one aggregator name, "Rex", resolved to an unrelated W23 nutrition wearable when I checked the slug, so treat the whole list as unverified leads): Async ("specialized AI agents for back-office work"), Marble and truffle (AI-native restaurant back office), Denta (dental back office), Care GP, Whitespace (wholesale distribution), Verdant (permitting for local government), Rational ("AI coworkers for accounting teams"), Pango (agentic OS for e-commerce logistics), Item ("agents run business processes across sales, support, and account management autonomously"). **Every single one is a vertical or a function. Not one sells the whole company.**
- **a16z Speedrun, 14 Big Ideas for 2026** (https://speedrun.substack.com/p/14-big-ideas-for-2026, fetched 2026-08-17): no idea in the list is "AI runs the whole company." Closest are *"AI agents compete. Whoever performs best gets paid."*, *"they already take responsibility for outcomes, not just information"*, and the fat-startup idea *"A fat startup ships outcomes, not features. It bundles software, data, hardware, and human ops."* Governance/liability language across the whole piece: **NOT FOUND**, except one aside, *"sometimes using human-in-the-loop to start."* Useful for the reapplication: outcome-responsibility is the language a16z is using, and nobody there is asking for a company-in-a-box.

---

### 10. Skyfall AI -- the most honest maximal claim in the market, and it proves the sale is impossible
- **URL**: https://www.forbes.com/sites/victordey/2026/07/20/former-microsoft-ai-leaders-are-spending-1m-to-prove-ai-can-replace-ceos/ -- **fetched 2026-08-17**
- **Stage**: funded operating company running a **public experiment**, announced 2026-07-20. Not a product launch.
- **Founders**: Sam Pasupalak (CEO), Kaheer Suleman (CTO), Sumit Pasupalak (CPO). Pasupalak and Suleman previously built **Maluuba, acquired by Microsoft for ~$160M in 2017**. Team size not disclosed.
- **The claim, VERBATIM** (VERIFIED in the Forbes piece): *"We want to democratize the power of a CEO to all the small businesses around the world, rather than building another marketing or sales agent."*
- **The sentence that answers the whole research question, VERBATIM**: **"If you want a truly autonomous business, you have to buy a business and operate the whole thing end to end."**
- **What they are actually doing**: spending up to **$1M to acquire a small B2B SaaS or e-commerce company** and run it with AI as CEO, with the goal of *"doubling the company's revenue in six months while publicly documenting both its successes and failures."* Prior work was AI playing RollerCoaster Tycoon.
- **Shippable today vs promised**: **nothing to buy.** It is an experiment with a public scoreboard. No named customer, no enterprise.
- **Governance**: **NOT FOUND** in the article. The one honest thing they do have is a commitment to publish failures, which is closer to our unedited-log posture than anything else in this file.
- **Verdict**: Claim only, no product -- but the most intellectually serious version of it. Note the convergence: **Skyfall and Rocketable, independently, both concluded that the only way to demonstrate full autonomy is to BUY a company rather than sell software to one.** Two well-credentialed teams looked at selling the full-autonomy claim and decided it could not be sold. That is not a coincidence, it is the market telling us something.

### 11. AI-CEO stunts, for completeness (do not cite these as competition)
- NetDragon Websoft (China, video games) and Dictador (Poland, drinks) both installed humanoid "AI CEOs". Reported assessment, VERBATIM from the sweep: *"probably publicity stunts dressed up as corporate strategy"*, and both *"functioned largely as decision-support experiments rather than true autonomous leadership."* (CLAIMED, secondary; see https://theconversation.com/will-companies-ever-be-run-by-an-ai-ceo-236424 and https://techxplore.com/news/2026-08-companies-ai-ceo.html)
- Sam Altman, on the Conversations with Tyler podcast, November 2025, VERBATIM as reported: *"Shame on me, if OpenAI is not the first big company run by an AI CEO."* (CLAIMED, secondary) An aspiration from the best-resourced lab on earth, stated as a future thing, nine months before today.
- Mark Zuckerberg reported to be training an agent to partly automate his own job. (CLAIMED, secondary) Note the word **partly**.

---

## Analyst ground truth (the numbers a university procurement office will have read)

All three are Gartner press releases. **Gartner's own site returned HTTP 403 to my fetches**, so the quotes below are **CLAIMED** from search snippets of those exact newsroom URLs plus corroborating trade coverage (CIO Dive, IT-Online, insurance-canada.ca). The URLs are Gartner's own newsroom; the wording should be re-verified in a browser before it goes in any founder-facing or customer-facing doc.

1. **2025-06-25** -- https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
   - *"Over 40% of agentic AI projects will be canceled by the end of 2027, due to escalating costs, unclear business value or inadequate risk controls."*
   - *"current models don't have the maturity and agency to autonomously achieve complex business goals or follow nuanced instructions over time."*
   - **"agent washing"** -- rebranding existing products as agents. Gartner estimates **only about 130 of the thousands of agentic AI vendors are real.**
2. **2026-05-26** -- https://www.gartner.com/en/newsroom/press-releases/2026-05-26-gartner-says-applying-uniform-governance-across-ai-agents-will-lead-to-enterprise-ai-agent-failure
   - Prediction: **by 2027, 40% of enterprises will demote or decommission autonomous AI agents due to governance gaps found only after production incidents.**
   - **Shiva Varma, Senior Director Analyst, VERBATIM**: *"Enterprises are treating AI agent governance as binary, either locked down or fully trusted, and that is the root cause of failure."*
   - Gartner's recommendation: **classify agents by actual autonomy level and apply controls proportionate to what the agent can do.** That is a per-agent autonomy matrix. We have one (policy.ts, per-agent matrix + caps). It is now the analyst-endorsed answer, which means it is about to become table stakes rather than a moat -- move on it while it still reads as foresight.
3. **2025-06-10** -- https://www.gartner.com/en/newsroom/press-releases/2025-06-10-gartner-predicts-50-percent-of-organizations-will-abandon-plans-to-reduce-customer-service-workforce-due-to-ai
   - Headline alone is the finding: **50% of organizations will abandon plans to reduce their customer service workforce because of AI.** The headcount-replacement pitch is already forecast to fail in the one function where it works best.

Also relevant, widely circulated, and certain to be quoted at you by a skeptical buyer: the MIT finding that **~95% of GenAI pilots delivered no measurable P&L impact** (52 executive interviews, 153 leader surveys, 300 public deployments). CLAIMED, secondary -- and note the pushback, e.g. https://www.marketingaiinstitute.com/blog/mit-study-ai-pilots argues the 95% figure is overread. Do not repeat the stat without the caveat.

---

## THE ENTERPRISE-SALE QUESTION -- the answer is NO, and here is exactly how hard I looked

**Finding: NOT FOUND. As of 2026-08-17 I could not find a single named enterprise or institution that publicly says it bought "AI runs our company" or "AI runs our department" and is running that way. Zero. The confirmed absence holds across vendors, incumbents, the public sector, and higher ed.**

### How hard I looked (so the absence can be trusted, and so it can be re-tested later)
Eleven distinct search angles, each aimed at finding a *named* buyer, not a vendor claim:
1. Vendor case-study libraries with named logos (Salesforce Agentforce, Decagon).
2. The incumbent making the loudest claim (SAP Autonomous Enterprise, Sapphire 2026).
3. The best-funded startup in the exact category (Naive, $28.5M Series A, 2026-08-06).
4. YC directory, W25 through S26, for company-level rather than function-level claims.
5. Product Hunt 2026 AI-agent launches and weekly roundups.
6. a16z Speedrun's own published thesis for 2026.
7. Stealth-startup trackers and pre-seed newsletters.
8. Higher-ed and university procurement announcements.
9. US federal / state / local government AI procurement.
10. "AI CEO" claims, including the stunts.
11. Analyst coverage (Gartner) and the layoffs-blamed-on-AI lists, working backwards from any company that cut a whole function.

### What the closest six near-misses actually say -- every one of them is scoped, anonymous, or reversed
1. **Notion (named, via Decagon)** -- the strongest real datapoint. https://decagon.ai/case-studies/notion (fetched 2026-08-17). Reported metrics: **"3.4% ask for human rate"**, 2x deflection, 34% better resolution time. Emma Auscher, Global Head of Customer Experience, is quoted -- but her quote is about **running a rigorous RFP**, not about autonomy: VERBATIM *"We conducted a rigorous RFP process, evaluating everything from interaction quality and user interface to the depth of integrations, product roadmap, and the caliber of engagement and partnership offered."* The case study frames the outcome as having *"elevated the role of CX agents"* and freed them from *"low-impact tasks"* for *"upskilling and specialization."* **The team still exists. This is one channel of one function, and Notion never says AI runs support.**
2. **Klarna** -- said it, then took it back. See the Klarna section above. This is the only large enterprise that ever really made the claim about itself, and it is now the market's cautionary tale.
3. **Salesforce and IBM** -- Salesforce cut ~4,000 support roles with Benioff saying AI handles **about 50%** of customer interactions; IBM replaced hundreds of back-office roles via its own AskHR. (CLAIMED, secondary.) Both are **self-supply, not a purchase**, and both are a percentage, not a department. A vendor eating its own dog food is not a customer.
4. **RWE (named, via SAP)** -- agents *"generate prefilled maintenance work orders."* A draft a human executes. No RWE quote exists in either the SAP or Forbes writeup.
5. **Naive's rental-car agency** -- VERBATIM *"We have some customers who run an entire rental-car agency autonomously."* **Anonymous.** A company with 30,000 developer customers and a $28.5M round still cannot put a name to its own flagship proof.
6. **An unnamed Decagon customer** reportedly cut its support team by 80%. Also anonymous, and also one function.

### The institutional picture specifically (this is the one that matters for the Boston-universities plan)
- **University of Maine System** is the clearest recent institutional AI purchase I found: **~$1.39M over two years** for **ChatGPT Edu** via reseller Carasoft, covering ~25,200 students and ~5,600 employees, targeted to start 2026-07-01, still in a five-day appeals window when reported. https://themainemonitor.org/umaine-closing-ai-tool/ (fetched 2026-08-17). What they bought, VERBATIM: the ability to *"analyze data, summarize documents, build custom versions of ChatGPT for internal use and work with higher messaging limits than the free version."* The headline reassurance is a **data** promise, VERBATIM: the platform *"will not use prompts entered into the system to train OpenAI's technology."* Governance is deferred to existing policy -- classroom decisions made by *"the 'people doing that work'"*, with *"systemwide information policies, such as those that protect student privacy"* still applying. The Board will **revisit year-two funding**.
  - **Read that as the template**: an institution at that scale bought **seats of a chatbot with a data-residency promise and an annual escape hatch**. It did not buy autonomy. It did not buy outcomes.
- **US public sector**: the VA reportedly deployed an agentic operations system with Slack AI to 150+ VA medical and outpatient centers; VA, Air Force, and Department of Labor are automating workflows. Typical city/county AI contracts land at **$50k-$500k**, justified in staff-hours saved on document processing, and now routed through existing co-op vehicles (NASPO ValuePoint, Sourcewell, OMNIA Partners). (CLAIMED, secondary.) **Workflow automation with a staff-hours ROI story. Not autonomy.**

### What this means for us -- read this part before writing any campus deck
1. **Nobody has sold the maximal claim, so we are not late. But nobody has sold it because it does not currently sell.** Being first to a sale nobody has closed is a hypothesis, not a head start.
2. **The two most credible full-autonomy teams both refused to sell it.** Rocketable acquires software companies; Skyfall is spending $1M to buy a business outright. Skyfall says the reason out loud: *"If you want a truly autonomous business, you have to buy a business and operate the whole thing end to end."* If we intend to sell it to a university instead, we need an argument for why we can do what they judged unsellable.
3. **Pancake is the live experiment in selling it, and it retreated in under three months** from *"makes your company autonomous"* to *"You run your company. We run your GTM."* That is the most direct evidence available about what happens to our pitch on contact with buyers.
4. **Our whole rail vocabulary is now commodity copy.** Human-in-the-loop approvals, spend caps, audit logs, kill switches, scoped agents, SOC 2 -- shipped by Pancake (Stockholm, tiny), Corvera (4 people, W26), Naive (10 people), and SAP ("traceability by design"). **Saying we have governance differentiates us from nobody.** What none of them has: enforcement that can *fail closed* on a public claim, provenance-graded truth behind that claim, and a named human who is legally liable. That is the sentence to sell, and it has to be demonstrable in under three minutes.
5. **Gartner has handed us the buyer's objection and the buyer's checklist at the same time.** Objection: 40% of autonomous agents get demoted or decommissioned by 2027 because governance gaps only surface after an incident. Checklist: classify agents by actual autonomy level, apply proportionate controls. Varma's line -- *"either locked down or fully trusted, and that is the root cause of failure"* -- is the exact framing our per-agent matrix and earned-autonomy staging answer. Use their words.
6. **Sell the step, not the company.** Every purchase actually happening in 2026 is one function, one channel, or one document pipeline, with a named human still accountable, an escalation path, and an annual off-ramp. The six-step goal survives this intact -- **"a student makes their first $1,000"** is an outcome claim, which is far more sellable than an autonomy claim, and it is the one claim in our whole story that no competitor in this file is making.
7. **Say nothing we cannot show.** Gartner's own estimate is that only ~130 of thousands of agentic vendors are real, and it has a name for the rest: **agent washing**. Any campus deck that leads with autonomy lands us in that bucket in front of exactly the audience that reads Gartner.

### Re-test triggers (when to run this sweep again)
- Skyfall publishes its acquisition or its six-month revenue result. Their public failure log will be the single best evidence in the category, for or against.
- Naive names the rental-car agency, or any customer, in a case study.
- Pancake's hero copy changes again in either direction.
- YC S26 Demo Day, **2026-09-10** -- the batch is mid-flight today, so Axelrod and the others will have new copy and possibly named pilots.
- Any vendor publishes a **named** enterprise or university saying AI runs a whole function. That is the day the answer to this question changes, and it should change our plan too.

# THE ACCOUNTABILITY RECORD: What Happened to Companies That Claimed AI They Could Not Back

Research pass compiled 2026-08-17. Primary sources fetched directly where available (SEC complaint PDFs, FTC press releases, court dockets).

**THIS IS NOT LEGAL ADVICE.** I am not a lawyer. This is a research summary of publicly documented enforcement actions and reporting. For a decision with legal exposure, get a licensed attorney in your jurisdiction (Massachusetts, per founder location).

**Labeling convention used throughout:**
- **VERIFIED** = I fetched the primary source document (court filing, agency release) and read the language myself.
- **CLAIMED** = reported by press or secondary/legal-analysis sources; consistent across sources but I did not read the underlying primary document.
- **NOT FOUND** = I looked and could not confirm.

---

## THE ONE-PARAGRAPH ANSWER, UP FRONT

The single most important finding: **in every case where a founder was criminally charged, the charge was not "your product didn't work." It was "you told someone your product worked a certain way, they gave you money because of it, and you knew it wasn't true."** The legal trigger is not capability. It is the gap between a specific representation and the speaker's own knowledge, plus someone parting with money. A product that is 20% built and honestly described is legally boring. A product that is 80% built and described as 100% autonomous, sold to a paying customer, is the exact fact pattern the SEC and DOJ have now charged. See [THE LEGAL LINE](#the-legal-line) below.

---

## CASE 1: Nate, Inc. / Albert Saniger — the closest analogue in existence

**Status: VERIFIED from primary sources.** I read the SEC's complaint in full.

Primary sources:
- SEC Litigation Release No. 26282, April 11, 2025: https://www.sec.gov/enforcement-litigation/litigation-releases/lr-26282
- SEC complaint, *SEC v. Alberto Saniger Mantinan a/k/a Albert Saniger*, No. 1:25-cv-02937 (S.D.N.Y., filed Apr. 9, 2025): https://www.sec.gov/files/litigation/complaints/2025/comp26282.pdf
- Criminal docket: *USA v. Saniger*, No. 1:25-cr-00157 (S.D.N.Y.)

### What was claimed, VERBATIM

From the SEC complaint (all VERIFIED, quoted from the filing):

The **Seed Round pitch deck** described Nate as:
> "a digital assistant able to transact online without human intervention"

and as:
> "the first non-human executive assistant that can buy anything, anywhere."

The **Series A pitch deck** stated the app was enabled by "intelligent automation" and that Nate's:
> "neural networks understand HTML and transact on websites in the same way consumers do."

When an investor doing diligence asked directly about Nate's "failure rate today in terms of when a human needs to get involved," Saniger replied on or about February 28, 2020:
> "If you look at the automation piece only (and forget other things that could make things go wrong like credit card failure or out of stock etc) AND assuming we had a user base that fairly represents the entire world then success ranges from 93% to 97% . . . . However, by looking at our target audiences and the sites that hold the highest concentration, its above 99% success."

### What was actually happening

Per the complaint (VERIFIED):
- At the time of the Seed Round, **"virtually all orders placed by Nate's users were manually completed, including by overseas contract workers"** — human contractors "primarily located in the Philippines."
- A Nate automation employee told Saniger in a **June 11, 2021 Slack message** that Nate's "automation rate" was **"essentially zero."** (This is the single most damning document in the case. It is an internal message, in writing, timestamped, showing the founder was told the true number.)
- Engineering leads "informed Saniger that the company engineers had yet to develop working AI for the app."
- Saniger "instructed the automation engineering groups that they were not to report on the status of AI development to other Nate employees" — so "most Nate employees lacked visibility."
- **The rigged demo:** Saniger "required Nate engineers to be on standby during product demonstrations to potential investors in order to ensure the successful completion of any test purchases and leave investors with a misimpression that the app worked as Saniger had represented." He also gave engineers a **"VIP" list of investor email addresses** so their orders would be manually completed promptly.
- When Nate did eventually automate, it used **"bots"** — and the complaint notes Saniger's own Seed deck had disparaged bots: "[b]ots crash every time the merchant adds a new product to the site, does A/B testing, or makes a permanent change to its design or order flow." So he knew the difference he was eliding.

### Who acted, and when

| Date | Event |
|---|---|
| June 2022 | **The press acted first.** An article in *The Information* "cast doubts on Nate's claimed use of AI." (VERIFIED per complaint ¶73) |
| Immediately after | Series B collapsed. Nate could not close. (VERIFIED, ¶74) |
| Jan 2023 | Nate ceased operations, all employees terminated, dissolved via California Assignment for the Benefit of Creditors. Investors got **nothing** back. (VERIFIED, ¶¶75-77) |
| Feb 11, 2025 | Saniger signed a tolling agreement through counsel — i.e., he knew the investigation was live. (VERIFIED, ¶78) |
| Apr 9, 2025 | **DOJ (SDNY) criminal charges** and **SEC civil complaint** filed in parallel, same day. |

### The consequence

**Criminal (DOJ/SDNY):** One count of securities fraud, one count of wire fraud. **CLAIMED** (widely and consistently reported; DOJ's own press release returned 403/JS-gated to my fetches, so I did not read it directly). Reported statutory maximum 20 years per count.

**Civil (SEC):** VERIFIED from the complaint. Charged under Section 17(a) of the Securities Act, Section 10(b) of the Exchange Act, and Rule 10b-5. Relief sought:
- permanent injunction against further securities-law violations
- **conduct-based injunction** barring him from participating in the issuance, offer, purchase or sale of any security (other than his own personal accounts) — i.e., *he cannot raise money again*
- **officer-and-director bar**
- disgorgement with prejudgment interest
- civil money penalties

**Financial scale:** Raised **over $42 million** total. ~$34M in the Series A alone. Saniger **personally sold $3 million of his own shares** to a Series A investor in June 2021 — the same month he was told automation was "essentially zero." Investors lost "tens of millions of dollars," substantially all of their investment. (VERIFIED)

**Outcome to date (as of Aug 2026):** Saniger **pleaded not guilty**. He was released on a **$250,000 bond** permitting residence in Spain with travel restrictions. No conviction, no guilty plea, no dismissal. Both cases pending. **CLAIMED** — sourced to MLex reporting (https://www.mlex.com/mlex/articles/2423455/former-nate-ceo-pleads-not-guilty-to-us-fraud-charges-over-ai-claims) and a Quinn Emanuel client alert describing Saniger as the first AI-disclosure matter heading toward trial rather than settlement (https://www.quinnemanuel.com/the-firm/publications/client-alert-the-first-real-test-what-saniger-means-for-ai-disclosure-fraud/). I could not open the PACER docket directly to verify current posture.

### Why this case matters most to the decision at hand

Five features of the Nate fact pattern are worth staring at:

1. **The claim was about autonomy specifically** — "without human intervention," "non-human." Not "AI-powered" as vague garnish. That specificity is what made it falsifiable and therefore chargeable.
2. **The founder was told the true number in writing, internally, and the number was near zero.** "Essentially zero" in a Slack message is the entire case.
3. **The demo was staged.** Humans on standby so the thing appeared to work. This converted a marketing-puffery argument into a scheme-to-defraud argument.
4. **The press broke it, not a regulator.** June 2022 article → company dead within seven months. Enforcement arrived nearly *three years later*. The commercial death sentence and the legal one are on completely different clocks.
5. **Dissolving the company did not end personal exposure.** Nate was dissolved in January 2023. Saniger was charged in April 2025, personally, as an individual. The corporate wrapper evaporating did nothing.

---

## CASE 2: FTC "Operation AI Comply" (Sept 25, 2024)

**Status: VERIFIED.** I fetched and read the FTC press release in full: https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes

The framing quote, from then-FTC Chair **Lina M. Khan** (VERIFIED verbatim):
> "Using AI tools to trick, mislead, or defraud people is illegal. The FTC's enforcement actions make clear that there is no AI exemption from the laws on the books. By cracking down on unfair or deceptive practices in these markets, FTC is ensuring that honest businesses and innovators can get a fair shot and consumers are being protected."

"**There is no AI exemption from the laws on the books**" is the operative sentence for anyone weighing a launch claim.

### 2.1 DoNotPay — "the world's first robot lawyer"

**What was claimed (VERIFIED verbatim from FTC release):** DoNotPay marketed an AI service as "the world's first robot lawyer." It promised consumers its service would let them "sue for assault without a lawyer" and "generate perfectly valid legal documents in no time," and that the company would "replace the $200-billion-dollar legal industry with artificial intelligence."

**What was actually happening:** Per the FTC complaint — the company **"did not conduct testing to determine whether its AI chatbot's output was equal to the level of a human lawyer,"** and **"did not hire or retain any attorneys."** A separate feature claimed to check a small business website for hundreds of federal and state law violations from nothing but an email address, purportedly catching violations that could cost $125,000 in legal fees; the FTC alleged this "was also not effective."

**Consequence:** Settled by proposed Commission order. **$193,000 payment.** Required to notify consumers who subscribed 2021–2023 about the limitations of the law-related features. **Prohibited from claiming its product can substitute for any professional service without evidence to back it up.** Commission vote 5-0.

**The load-bearing detail for our purposes:** the FTC's theory was not that the chatbot was bad. It was that **DoNotPay never tested it against the benchmark it claimed to match.** The violation was *the absence of substantiation*, not the presence of a defect. You do not get to make a comparative capability claim and then discover later whether it was true.

### 2.2 Rytr — providing the means to deceive

**What was claimed / done:** Since April 2021 Rytr sold an AI "writing assistant," one use case of which was explicitly "Testimonial & Review" generation. Paid subscribers could generate unlimited detailed consumer reviews from minimal generic input.

**What was actually happening:** Per the complaint, the service produced reviews "that contained specific, often material details that had no relation to the user's input," which "almost certainly would be false for the users who copied them and published them online." At least some subscribers generated hundreds, in some cases tens of thousands, of reviews.

**Consequence:** Proposed order barring Rytr from advertising, promoting, marketing, or selling **any service dedicated to or promoted as generating consumer reviews or testimonials.** No monetary penalty reported in the release.

**Notable:** the vote was **3-2**. Commissioners **Melissa Holyoak and Andrew Ferguson voted NO** and issued dissenting statements. This matters for 2026 forecasting: Ferguson later chaired the FTC. The theory Rytr rested on — liability for providing a *tool* others misuse, with no proof of actual consumer harm — is the *contested* edge of AI enforcement. The theories in DoNotPay (unsubstantiated capability claims) were unanimous 5-0. **Unsubstantiated capability claims are the consensus, bipartisan enforcement zone. That is the durable risk.**

### 2.3 Ascend Ecom (Ascend Ecommerce / Ascend CapVentures / ACV Partners / Accelerated eCom Ventures / Ethix Capital / ACV Nexus)

**Claimed:** "cutting edge" AI-powered tools would let consumers earn thousands a month in passive income via online storefronts; "proprietary software and artificial intelligence to maximize clients' business success"; stores producing five-figure monthly income by year two.

**Reality:** "for nearly all consumers, the promised gains never materialize, and consumers are left with depleted bank accounts and hefty credit card bills." Also alleged: pressuring consumers to modify or delete negative reviews, and threatening to withhold a "guaranteed buyback" from people who reviewed the company negatively.

**Scale:** defrauded consumers of **at least $25 million.**

**Consequence:** Federal court **temporarily halted the scheme and put it under a receiver.** Run by William Basta and Kenneth Leung. Filed C.D. Cal. Vote 5-0. Case ongoing as of the release.

### 2.4 Ecommerce Empire Builders

**Claimed:** help consumers build an "AI-powered Ecommerce Empire"; "Skip the guesswork and start a million-dollar business today" by harnessing the "power of artificial intelligence"; social media ads claiming clients can make $10,000 monthly.

**Reality:** FTC alleges the company "has no evidence to back up those claims." Training programs cost almost $2,000; "done for you" storefronts up to **$35,000.** CEO **Peter Prusinowski** alleged to have used consumers' money to enrich himself. Consumers complained stores made little or no money and refunds were denied or partial.

**Consequence:** Federal court order **temporarily halting the scheme, receiver appointed.** Filed E.D. Pa. Vote 5-0.

### 2.5 FBA Machine / Passive Scaling

**Claimed:** guaranteed income through online storefronts using "AI-powered" software to price products and maximize profits; consumers could operate a "7-figure business"; testimonials from clients who "generate over $100,000 per month in profit"; sales agents said the business was "risk-free" with guaranteed refunds.

**Reality:** earnings claims "rarely, if ever, materialize." Consumer investments ranged from tens of thousands to **hundreds of thousands** of dollars.

**Scale:** cost consumers **more than $15.9 million.**

**The rebrand detail:** **Bratislav Rozenfeld** (a/k/a Steven Rozenfeld, Steven Rozen) ran it as Passive Scaling from 2021; "When Passive Scaling failed to live up to its promises and consumers sought refunds and brought lawsuits, Rozenfeld rebranded the scheme as FBA Machine in 2023." Rebranding did not work as a shield.

**Consequence:** Action taken June 2024; federal court order halting the scheme, receiver appointed. Filed D.N.J. Vote 5-0.

### 2.6 The prior FTC AI cases the release explicitly stacks on

The FTC listed these as precedent (VERIFIED from the release):
- **Automators** — another online storefront scheme
- **Career Step** — allegedly used AI technology to convince consumers to enroll in bogus career training
- **NGL Labs** — allegedly claimed to use AI for moderation in an anonymous messaging app unlawfully marketed to children
- **Rite Aid** — AI facial recognition in stores without reasonable safeguards
- **CRI Genetics** — deceived users about accuracy of DNA reports, including claims it used an AI algorithm for genetic matching


---

## CASE 3: Presto Automation — the "70% human" order, and the best-documented internal dissent

**Status: VERIFIED.** I read the SEC's order in full.

Primary source: SEC Order Instituting Cease-and-Desist Proceedings, *In the Matter of Presto Automation Inc.*, Securities Act Release No. 11352 / Exchange Act Release No. 102177, Admin. Proc. File No. 3-22413, **January 14, 2025**: https://www.sec.gov/files/litigation/admin/2025/33-11352.pdf

Widely described as the **SEC's first AI-washing enforcement action against a public company.** (CLAIMED — per D&O Diary and DLA Piper analyses; the SEC order itself does not say "first.")

### What was claimed, VERBATIM

In **five registration statements filed with the SEC between October 21, 2022 and May 1, 2023**, Presto claimed that Presto Voice:
> "eliminat[es] human order taking"

Presto also reported "automated order completion" rates of **95% to 99%** and "non-intervention" rates at or above 95%.

Presto described the underlying technology as **"our" technology** and **"Presto's" technology** — including "Presto's speech recognition technology," "Presto's automated voice ordering technology," "Presto's solution."

### What was actually happening

Per the order (all VERIFIED):

1. **The tech wasn't theirs.** From November 2021 to September 2022, every commercially deployed Presto Voice unit ran on a **third party's** speech recognition technology ("Supplier A," identified in the order's context as Hi Auto). Presto did not begin developing its own until early 2022. Calling it "our technology" "created the false impression that this technology was proprietary to Presto."

2. **Humans did the work.** "Presto hired, trained, and supervised human order takers located abroad (**primarily in the Philippines and India**), who processed the vast majority of drive-thru orders placed through Presto Voice."

3. **The metric was redefined without saying so.** The impressive "non-intervention" rate "in fact referred to orders completed **without restaurant staff intervention**, which required significant **off-site** human intervention." The number was true of a definition nobody was told about.

4. **When forced to disclose the real number:** In a Nov 17, 2023 prospectus supplement Presto disclosed for the first time that **"over 70% of orders taken by our Presto Voice solution require human agent intervention."** Then in a Dec 14, 2023 Form 8-K it clarified that the 70% figure applied only to the few pilot locations running the most advanced version — and that **human agent intervention was required on 100% of orders at the substantial majority of** locations.

### The internal dissent — the most quotable passages in the entire record

These are verbatim from the SEC order and are the sharpest warning in this whole research pass, because they show people inside the company saying the true thing and being overruled:

- **January 20, 2022**, one Presto executive to another: *"with HITL [humans in the loop], accuracy is not a major concern"* and *"…can even get to 95% or more with humans."*
- **October 2022**, a senior Presto executive to a group of executives: the company should not refer to *"automation rate with customers because it infers no supervision which isn't true."*
- **January 2023**, another Presto executive: concern that Presto was *"telling investors Presto AI is running 95%+ accuracy without disclosing AI is doing NONE of the work and all orders are processed by humans."*

The order notes: "Similar concerns were voiced internally by several other senior executives at Presto." And: "Despite understanding that its terminology was likely to mislead and confuse investors, Presto took no steps to correct the misleading statements... **until it provided clarity, after learning of the Commission's investigation.**"

### The consequence

- **Charges:** Section **17(a)(2)** of the Securities Act, Section 13(a) of the Exchange Act, Rules 13a-11 and 13a-15(a).
- **Sanction:** Cease-and-desist order. **NO civil monetary penalty.**
- **Why no penalty:** The order states the Commission "considered Respondent's current financial condition," plus remedial acts and cooperation (Presto voluntarily met with staff multiple times and changed its disclosures once it learned of the investigation).
- **Nasdaq:** Trading suspended **August 8, 2024**; Form 25 filed to delist stock and warrants **September 6, 2024**; now over-the-counter. Presto filed a Form 15 on September 19, 2024 to deregister, effective December 18, 2024.

**Read the "no penalty" carefully. It is not good news.** Presto avoided a fine because it was already financially destroyed and delisted. The market killed it before the SEC finished. The zero-dollar penalty is a measure of how little was left, not of how forgiving the SEC was.

### The legal detail that matters most here

Presto was charged under **Section 17(a)(2)**, not 10(b)/Rule 10b-5. This distinction is the single most important technical point in this entire document:

- **Section 10(b) / Rule 10b-5** (charged against Saniger) requires **scienter** — intent to deceive, or recklessness.
- **Section 17(a)(2)** requires only **negligence**. (CLAIMED as a general statement of law — this is the settled reading of *Aaron v. SEC*, 446 U.S. 680 (1980); I did not fetch the opinion. Verify with counsel.)

Practical translation: **you do not have to be a liar to be liable.** Being sloppy or self-flattering about a capability claim, in a document that helps you sell a security, can be enough. "I genuinely believed it would work by launch" is a defense to fraud charges but not necessarily to negligent-misrepresentation charges.

---

## CASE 4: SEC AI-washing — Delphia (USA) Inc. and Global Predictions Inc.

**Status: VERIFIED.** I read the SEC press release in full.

Primary source: SEC Press Release 2024-36, **March 18, 2024**, "SEC Charges Two Investment Advisers with Making False and Misleading Statements About Their Use of Artificial Intelligence": https://www.sec.gov/newsroom/press-releases/2024-36

**Total penalties: $400,000.** Delphia **$225,000**; Global Predictions **$175,000**.

### Delphia (USA) Inc. (Toronto)

Claimed, VERBATIM, from 2019 to 2023 in SEC filings, a press release, and on its website, that it:
> "put[s] collective data to work to make our artificial intelligence smarter so it can predict which companies and trends are about to make it big and invest in them before everyone else."

The order finds these statements false and misleading because **"Delphia did not in fact have the AI and machine learning capabilities that it claimed."** Also charged with violating the **Marketing Rule**, which prohibits a registered investment adviser from disseminating any advertisement containing any untrue statement of material fact.

### Global Predictions Inc. (San Francisco)

In 2023, on its website and social media, falsely claimed to be the:
> "first regulated AI financial advisor"

and misrepresented that its platform provided:
> "[e]xpert AI-driven forecasts."

Also violated the Marketing Rule by falsely claiming to offer tax-loss harvesting, and included an impermissible liability hedge clause in its advisory contract.

### The quotes that define the doctrine

**SEC Chair Gary Gensler** (VERBATIM):
> "We find that Delphia and Global Predictions marketed to their clients and prospective clients that they were using AI in certain ways when, in fact, they were not. We've seen time and again that when new technologies come along, they can create buzz from investors as well as false claims by those purporting to use those new technologies. Investment advisers should not mislead the public by saying they are using an AI model when they are not. Such **AI washing** hurts investors."

**Gurbir S. Grewal, Director of the SEC's Division of Enforcement** (VERBATIM):
> "As more and more investors consider using AI tools in making their investment decisions or deciding to invest in companies claiming to harness its transformational power, we are committed to protecting them against those engaged in 'AI washing.' As today's enforcement actions make clear to the investment industry – **if you claim to use AI in your investment processes, you need to ensure that your representations are not false or misleading.** And public issuers making claims about their AI adoption must also remain vigilant about similar misstatements that may be material to individuals' investing decisions."

**Both firms settled without admitting or denying findings**, consented to censure and cease-and-desist orders.

**Note the scale asymmetry:** these were the *smallest* consequences in this document — a few hundred thousand dollars — and they went to firms that made **vague** claims ("AI-driven forecasts," "makes our AI smarter"). The founders who made **specific, falsifiable autonomy claims** (Saniger: "without human intervention") got criminal charges. **Specificity is the risk multiplier.**

---

## CASE 5: Builder.ai / Engineer.ai (Sachin Dev Duggal) — the six-year fuse

**Status: mostly CLAIMED.** Builder.ai was a private UK company, so there is no SEC filing or DOJ indictment to read. The record here is investigative journalism (WSJ, Bloomberg, Rest of World) plus insolvency filings I did not obtain. Treat amounts as reported, not adjudicated.

Primary/best sources:
- Rest of World, "Inside the collapse of Builder.ai: Was it even an AI company?": https://restofworld.org/2025/builderai-ai-apps-downfall/
- Bloomberg, July 30, 2025: https://www.bloomberg.com/news/features/2025-07-30/startup-builder-ai-goes-from-1-5-billion-unicorn-to-bankruptcy
- Wikipedia (for consolidated timeline/citations): https://en.wikipedia.org/wiki/Builder.ai

### What was claimed

- CEO Sachin Dev Duggal claimed the AI could build **"at least 80% of an app or web site"** independently. (CLAIMED)
- "Natasha," the assistant, marketed as the **"world's first AI-powered product manager."** (CLAIMED)
- Duggal, quoted: **"Imagine a world where you can pick up the phone, speak to Natasha, and three days later have your app in the app store."** (CLAIMED)
- Software built **"6x faster and up to 70% cheaper."** (CLAIMED)

### What was actually happening

- Human developers in **India and Ukraine** performed the vast majority of the work. Natasha generated mainly front-end code and UI elements requiring human review and rework. A former "productologist" quoted: **"A lot of the customized work was done by humans."** (CLAIMED, Rest of World)
- **2019: The Wall Street Journal reported the company (then Engineer.ai) was exaggerating its use of AI, with most coding done by humans.** A former chief business officer filed a wrongful termination suit alleging the proprietary tech was **"nothing more than smoke and mirrors."** (CLAIMED)

### Timeline — note the six-year gap between exposure and collapse

| Date | Event | Label |
|---|---|---|
| Aug 2019 | WSJ reports AI exaggeration; ex-CBO's "smoke and mirrors" suit | CLAIMED |
| Mar 2022 | Series C, $100M | CLAIMED |
| May 2023 | Series D, ~$250M, led by Qatar Investment Authority | CLAIMED |
| — | Peak valuation **$1.5B**; total raised **$445M+** from investors incl. **Microsoft**, QIA, SoftBank | CLAIMED |
| Feb 2025 | Duggal steps down as CEO, retains title **"chief wizard"** | CLAIMED |
| Mar 2025 | Bloomberg reports inflated revenues; lender **Viola Credit** seizes most cash | CLAIMED |
| May 2025 | Bloomberg alleges **"round-tripping"** / fake billing with Indian firm **VerSe**; Viola Credit seizes **~$37M** from accounts | CLAIMED |
| **May 20, 2025** | **Insolvency / bankruptcy announced; 500+ employees laid off** | CLAIMED |
| June 2025 | Website shuttered | CLAIMED |

### The financial reality

- **2023 revenue restated from ~$220M down to ~$140M** (CLAIMED). Other reporting says an internal investigation found revenues restated to **roughly a quarter of prior estimates** — these two figures are inconsistent across sources; I could not reconcile them from primary documents. **Treat the exact restatement magnitude as unconfirmed.**
- Investigation reportedly found **round-tripping of funds to inflate revenue, fictitious invoices, and inflated forecasts used to raise further capital.** (CLAIMED)
- 2024 forecast revenues were roughly **quadruple** actual results. (CLAIMED)

### Separate legal exposure

India's **Enforcement Directorate** has reportedly filed a supplementary PMLA (money laundering) chargesheet naming Duggal, alleging he was a key beneficiary of a fund-siphoning scheme linked to Videocon Industries. **CLAIMED** — this is a *separate matter*, predating and distinct from the AI claims, and I did not verify it from an ED release. Do not conflate it with the AI-washing story.

### The lesson specific to Builder.ai

**The AI exaggeration alone did not kill it. It survived WSJ exposure in 2019 and then raised $350M more.** What killed it was **revenue fraud** — round-tripping, fake invoices — which is a different and much harder-edged offense. The AI overclaim created the pressure (a valuation that required revenue the product could not generate), and the revenue fraud was the attempt to relieve that pressure.

**That is the mechanism to fear.** The overclaim is rarely the fatal act. It's that the overclaim sets a bar you then have to fake your way over. Saniger staged demos. Presto redefined "non-intervention." 11x counted cancelled contracts. Builder.ai invoiced itself. Nobody set out to commit the second fraud; the first claim required it.

---

## CASE 6: 11x — the ARR and logo case (press-enforced, not regulator-enforced)

**Status: CLAIMED.** No enforcement action found. This is journalism plus on-record corporate denials.

Primary source: TechCrunch, **March 24, 2025**, by Dominic-Madori Davis and Marina Temkin, "a16z and Benchmark backed 11x has been claiming customers it doesn't have": https://techcrunch.com/2025/03/24/a16z-and-benchmark-backed-11x-has-been-claiming-customers-it-doesnt-have

### What was claimed

11x (AI SDR / sales-automation, founded 2022 by **Hasan Sukkar**, backed by a16z and Benchmark) displayed customer logos on its website as endorsements, and reported ARR that counted full annual contract value for customers who had already exited.

### The on-record denials — this is the part to internalize

**ZoomInfo spokesperson** (VERBATIM, per TechCrunch):
> "We did not give them permission to use our logo in any manner, and we are not a customer."
> "During the pilot, 11x's product performed significantly worse than our SDR employees, and we did not move forward afterward."
> "since November, 11x has been claiming us as a customer in a multitude of channels: in sales calls, on its website, and now even on its AI dialer."

**Airtable spokesperson** (VERBATIM, per TechCrunch): a "very short" trial; "ultimately decided that it wasn't a fit for our business. It was never used in production and never rolled out to our sales team."

### The ARR mechanism

11x sold one-year contracts containing a **90-day / three-month break clause** that functioned as a trial. ARR counted the **full annual contract value** for every signed customer, including those who had already broken. Per an employee quoted by TechCrunch:
> "the company might say it had $14 million in annual recurring revenue when in reality, the number of contracts that passed the three-month trial period totaled only about $3 million"

Churn, per an employee: **"We were losing 70-80% of customers that came through the door."**

### Responses

- **11x:** said it "promptly removed any undesired or inaccurate customer mentions on their site and within their products when requested" and attributed remaining issues to **"human error."**
- **Benchmark:** "has been provided transparent updates from 11x, including the break clauses."
- **a16z:** denied rumors of legal action — "a16z is not suing."

### The consequence

**No regulator acted.** The consequence was reputational and organizational:
- **Founder Hasan Sukkar stepped down as CEO in May 2025**, roughly two months after the story. CTO Prabhav Jain took over. (CLAIMED)
- The company's name became a shorthand for AI-ARR inflation. Search "11x" today and the scandal outranks the product.

**The transferable lesson:** 11x's fatal error was **naming other people's companies as proof.** A customer logo is a claim about a third party who can contradict you on the record, instantly, with a spokesperson and zero legal risk to themselves. ZoomInfo did not need to sue; it just needed to answer a reporter's email. **The cheapest, fastest, most destructive refutation of a false claim is a named customer saying "we are not a customer."**

---

## CASE 7: Amazon "Just Walk Out" — the case where nothing legal happened, and why

**Status: CLAIMED, and Amazon disputes it.** Included because the founder needs to see the *contrast* case.

- Reporting (The Information, April 2024, amplified by Bloomberg/Business Standard and others) said Just Walk Out relied on **more than 1,000 workers in India reviewing video** of what US Amazon Fresh shoppers picked up, and that **~700 of every 1,000 sales needed human involvement**, far above Amazon's target of 50 reviews per 1,000. (CLAIMED)
- **Amazon disputed the characterization**, saying workers in India watched some videos "after the fact" to train machines to label actions and products, that the team was "way less than 1,000" people, and that they helped verify receipts in "a small percentage of cases." (CLAIMED — Amazon's pushback is on record, see Axios, April 17, 2024: https://www.axios.com/2024/04/17/amazon-walk-out-store-technology-grocery-expansion)
- Amazon **phased Just Walk Out out of US Amazon Fresh stores** in favor of Dash Cart smart carts. (CLAIMED)

**Consequence: no enforcement action, no penalty, no charge. NOT FOUND — I searched and found no FTC, SEC, or DOJ action against Amazon over Just Walk Out claims.**

### Why Amazon walked and Saniger didn't — this is the useful part

1. **Amazon never claimed "no humans."** It branded a customer *experience* ("just walk out" — describing what the shopper does), not an internal architecture. Saniger claimed "without human intervention" — a statement about the machine.
2. **Nobody bought Amazon stock because of Just Walk Out.** Materiality is the hinge of securities law. Just Walk Out was rounding error in Amazon's financials, so no misstatement was material to an investor.
3. **Amazon had the resources to contest the characterization publicly and immediately**, and did.
4. **Human-in-the-loop was arguably disclosed** in the general sense that Amazon described using human review for model training.

**The lesson is not "big companies get away with it."** The lesson is that **branding an outcome is safe and describing a mechanism is dangerous.** "Just walk out" is a promise about the customer's experience, and the experience was real. "Neural networks transact without human intervention" is a promise about how the machine works, and it was false. Both companies used offshore humans. Only one described its internals in a way that could be proven false.

---

## CASE 8: The 2025–2026 enforcement wave — the pace ACCELERATED, and it turned B2B

This is the most decision-relevant section, and the biggest single update on the earlier record.

### The headline numbers

- **The FTC has filed 13 AI-washing cases since 2024.** (CLAIMED — DLA Piper, May 2026: https://www.dlapiper.com/en-us/insights/publications/2026/05/ftc-ai-washing-action-underscores-enforcement-in-business-to-business-context)
- **At least a dozen of those came in 2025 alone.** (CLAIMED)
- **Of the last eight FTC AI-washing cases, SEVEN involved marketing claims made to OTHER BUSINESSES, not consumers.** (CLAIMED, DLA Piper)

**That last statistic is the one that matters for a B2B founder.** The original 2024 sweep was consumer-facing (get-rich-quick storefronts). The 2025–2026 wave is **B2B**. Selling to institutions instead of consumers is no longer a shield; it is now where the FTC is actually looking.

### The enforcement survived the change of administration

This is worth stating plainly because it is a common and wrong assumption that AI enforcement was a Lina Khan project that ended:

- **Workado** was settled April 2025 under the Trump FTC, vote **3-0**.
- **FTC Chairman Andrew Ferguson**, April 2026 congressional testimony, said the agency supports "growth in the AI market by targeting bad actors who undermine innovation through deception." (CLAIMED, via DLA Piper)
- **Presto** (SEC) was settled January 14, 2025.
- **Saniger** (SEC + DOJ) was charged April 9, 2025.
- Ferguson had *dissented* in **Rytr** (the tool-liability theory) but has *prosecuted* unsubstantiated-capability cases. The dividing line held: **vague tool-misuse theories are contested; false capability claims are bipartisan.**

### 8.1 Workado, LLC (f/k/a Content at Scale AI) — the substantiation case to read twice

**Status: VERIFIED.** FTC press release, April 28, 2025: https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-order-requires-workado-back-artificial-intelligence-detection-claims
Final order approved August 28, 2025: https://www.ftc.gov/news-events/news/press-releases/2025/08/ftc-approves-final-order-against-workado-llc-which-misrepresented-accuracy-its-artificial

**Claimed:** its AI Content Detector was **"98 percent" accurate** at detecting whether text was written by AI or a human. Also claimed the detector "was developed using a wide range of material, including blog posts and Wikipedia entries, to make it more accurate for the average user."

**Reality:** the model "was only trained or fine-tuned to effectively classify **academic** content." Independent testing showed accuracy on **general-purpose content was just 53 percent.** (Other reporting gives 74.5% on mixed human/AI text and 53.2% non-academic.)

**Quote from Chris Mufarrige, Director of the FTC's Bureau of Consumer Protection** (VERBATIM):
> "Consumers trusted Workado's AI Content Detector to help them decipher whether AI was behind a piece of writing, but the product did no better than a coin toss. Misleading claims about AI undermine competition by making it harder for legitimate providers of AI-related products to reach consumers."

**Consequence:** No monetary penalty. But the order:
- prohibits Workado from making **any** representation about the effectiveness of any covered product **"unless it is not misleading, and the company has competent and reliable evidence to support the claim at the time it is made"**
- requires it to **retain the evidence** it uses to support efficacy claims
- requires emailing eligible consumers about the settlement
- requires **compliance reports to the FTC one year after the order and every year for three more years**
- **each future violation of the order may carry a civil penalty of up to $53,088**

Vote 3-0. Lead staff attorney Ben Halpern-Meekin, FTC Northwest Region.

**Why this is the single most instructive case for a founder about to publish a number:** Workado's product *worked*. It was a real ML model, really trained, really deployed. It just did not hit the number printed on the box, in the domain customers used it in. **The violation was the number, not the product.** And the remedy is a four-year reporting leash plus a $53,088-per-violation tripwire on every future marketing claim the company makes. That is a permanent, compounding tax on one unverified statistic.

### 8.2 Air AI Technologies — the closest 2026 analogue for an AI-agent company

**Status: VERIFIED.** FTC press releases, August 25, 2025 (complaint) and March 24, 2026 (settlement): https://www.ftc.gov/news-events/news/press-releases/2026/03/air-ai-its-owners-will-be-banned-marketing-business-opportunities-settle-ftc-charges-company-misled
Case page: https://www.ftc.gov/legal-library/browse/cases-proceedings/airai

Air AI sold AI-powered phone-call / AI sales-agent technology to small businesses and entrepreneurs.

**The FTC's August 2025 complaint** against Air AI, **five related companies, and their owners — Caleb Maddix, Ryan O'Donnell, and Thomas Lancer** — alleged that since at least February 2023 they:
- "Falsely claimed that people who purchase their services will or are likely to make substantial earnings"
- "Falsely claimed that purchasers of the Air AI Access Card or licenses are protected by a refund or buy-back guarantee"
- "Misrepresented the performance, efficacy, nature, or central characteristics of their services, their refund policies, or the risk, earnings potential, or profitability of its services," violating the **Telemarketing Sales Rule**
- Failed to provide required disclosure documents and earnings claims statements, made false profitability and refund claims, and failed to honor refunds — violating the **Business Opportunity Rule**

**Consequence (March 2026 proposed order):**
- **$18 million monetary judgment**, "largely suspended based on the company's and operators' inability to pay the full amount," with the operators required to pay **$50,000** to the Commission for consumer relief
- Air AI **and its operators personally** are **banned from**:
  - "Selling or marketing any business opportunity"
  - making false claims or misrepresentations while telemarketing
  - making false claims or misrepresentations while selling **any goods and services**
  - "Making earnings claims without adequate substantiation or disclosure"
- Vote 2-0. Filed in the U.S. District Court for the District of Arizona.

**Two things to take from Air AI:**

1. **The owners were named personally and are personally banned from an entire line of business.** Not the LLC. The humans. Forever, unless modified.
2. **The $18M was "largely suspended" for inability to pay — and they still ate a lifetime industry ban.** Being broke reduced the check to $50,000. It did not reduce the ban. **Insolvency is not a defense; it is only a discount on the cash portion.**

### 8.3 Growth Cave / GrowthBox — the "automate nearly 100%" case

**Status: CLAIMED** (via DLA Piper, February 2026: https://www.dlapiper.com/en-us/insights/publications/2026/02/ftc-resolves-another-case-involving-ai-washing). FTC announcement January 27, 2026.

**Claimed:** its AI software would **"automate nearly 100% of the process"** of setting up and operating online education courses.

**Reality:** users had to manually upload advertisements, set appointments, and input messages for text and email distribution.

**Consequence:** order bans defendants from misrepresenting that **"a product or service will use artificial intelligence (AI) to maximize revenues or otherwise enhance [its] profitability, effectiveness, or efficiency."**

**Note the claim that got charged: "automate nearly 100% of the process."** Not "AI-powered." A *quantified autonomy* claim. This is the third time in this document that a percentage-of-autonomy claim is the charged conduct (Saniger's "above 99% success," Presto's "95%+ non-intervention," Growth Cave's "nearly 100%").

### 8.4 CMG Media Corporation and two marketing firms — "Active Listening"

**Status: CLAIMED** (DLA Piper, May 2026). FTC action **May 21, 2026** — the **thirteenth** FTC AI-washing case since 2024.

**Claimed:** an AI-powered "Active Listening" tool that would detect pertinent conversations from smart devices and use the voice data to target ads, using only data from consumers who had "opted in."

**Reality:** the companies allegedly "used no such tool, collected no voice data, and obtained no consumer consent." They bought email lists from data brokers and resold them at inflated prices.

**Consequence:** **$930,000** collectively, for redress to affected CMG customers.

**This is a pure B2B case** — the deceived parties were advertisers, i.e. businesses.

### 8.5 The other settled 2025 cases from the original 2024 sweep

(CLAIMED, via DLA Piper's case list)
- **Ascend Ecom** — settled **May 2025**
- **Empire Holdings Group** ("Ecommerce Empire Builders") — settled **June 2025**
- **FBA Machine** — settled **June 2025**

So every member of the original Operation AI Comply e-commerce trio resolved against the defendants within roughly nine months. **NOT FOUND:** I did not obtain the individual settlement dollar figures for these three; they were not in the sources I read.

### 8.6 Securities class actions — the fourth enforcement surface

**Innodata, Inc. (INOD)** — a private securities class action, not a government action. **CLAIMED.**

- **Trigger:** On **February 15, 2024**, activist short-seller **Wolfpack Research** published "Exposing INOD's 'Smoke and Mirrors' AI," concluding Innodata "is a manually data-entry business driven by offshore labor, not innovation." **The stock fell 30% that day.**
- **Allegations:** that Innodata misrepresented and failed to disclose that it "did not have a viable AI technology"; that its "Goldengate" AI platform "is a rudimentary software developed by just a handful of employees"; that it was not going to use AI to any significant degree for new contracts; and that it was not effectively investing in AI R&D.
- **Status:** motion to dismiss the Second Amended Complaint filed April 11, 2025, fully briefed and pending. Complaint: https://www.cohenmilstein.com/wp-content/uploads/2025/02/Innodata-Securities-Class-Action-Complaint.pdf
- **AI-related securities class action filings are rising.** (CLAIMED — DLA Piper, Sept 2025: https://www.dlapiper.com/en-us/insights/publications/2025/09/ai-related-securities-class-action-filings-are-on-the-rise-key-observations)

**Why this surface matters even though it's for public companies:** it shows the **short-seller-to-lawsuit pipeline**, and it shows that *"offshore labor, not innovation"* is now a recognized, brandable attack. The phrase "smoke and mirrors AI" has appeared independently in the Builder.ai wrongful-termination suit (2019) and the Wolfpack report on Innodata (2024). There is a ready-made narrative frame waiting for any company that fits it.

### 8.7 EU AI Act — live as of two weeks ago, but mostly not about overclaiming

**Status: CLAIMED.** Enforcement dates are well documented across sources but I did not read the Official Journal text.

- **August 2, 2026** (fifteen days before this document): the European Commission's **enforcement and penalty powers over general-purpose AI (GPAI) model providers became applicable.** The grace period ended. Violations dating back to **August 2, 2025**, when the first wave of GPAI obligations took effect, are reportedly in scope.
- **Fines:** up to **3% of global annual turnover or €15 million**, whichever is higher, for GPAI provider violations (Art. 101). For **prohibited practices**, up to **€35 million or 7%**.
- **Article 50 transparency** is the provision most relevant to an agent product: any AI chatbot, voice agent, or interactive system deployed in the EU must **clearly tell users at the start of an interaction that they are dealing with AI, not a person.** AI-generated or manipulated content must carry machine-readable labels. This applies **regardless of where the deploying company is based, so long as EU residents are the end users.**
- **NOT FOUND:** I found no confirmed EU AI Act fine actually levied against any company for AI capability overclaiming as of 2026-08-17. Enforcement powers are live; specific penalties are not yet on the public record that I could locate.

**Honest read for a US founder selling to Boston universities:** the EU AI Act is **probably not your near-term exposure** — it is aimed at GPAI *model providers* and at prohibited practices, and it bites on EU end users. The piece that could reach you is **Article 50: if your agent talks to a person, it must say it is an AI.** That obligation is about *disclosure of AI-ness*, which is the opposite failure mode from overclaiming AI-ness. If anything it cuts in your favor: the regulatory direction of travel is "say exactly what is and isn't a machine."

---

## CASE 9: State attorneys general — the surface that reaches a B2B seller fastest

### 9.1 Texas AG v. Pieces Technologies — selling AI to institutions, called out for a metric

**Status: CLAIMED** (Texas AG site returned 402/403 to my fetches; the terms below are consistent across Goodwin, WilmerHale, Manatt, Troutman, and Healthcare Dive summaries). September 2024.

Sources: Texas AG release (https://www.texasattorneygeneral.gov/news/releases/attorney-general-ken-paxton-reaches-settlement-first-its-kind-healthcare-generative-ai-investigation); Goodwin analysis (https://www.goodwinlaw.com/en/insights/publications/2024/12/alerts-practices-hltc-texas-ag-enters-into-settlement-with-provider-of-gen-ai-tools); WilmerHale (https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20241010-texas-attorney-ags-office-reaches-settlement-with-ai-company-over-deceptive-claims)

**Why this is the closest structural analogue to selling into universities.** Pieces Technologies is a Dallas gen-AI company that sold clinical documentation tools **to hospitals** — sophisticated institutional buyers with procurement departments, exactly like a university.

**Claimed:** a "critical hallucination rate" of **less than 0.001%** and a "severe hallucination rate" of **less than one in 100,000.**

**Reality per the AG:** these metrics were **"likely inaccurate,"** potentially deceiving the hospitals using the tools. Pieces **denies wrongdoing** and maintains its error rate is accurate.

**Consequence — read the remedy closely, because the remedy is the point:**
- **No financial penalty. No monetary settlement.**
- Pieces must **disclose the definition of its accuracy metrics and the methods used to calculate them**, whenever those metrics are used in advertising or marketing.
- Must **notify current and future customers** about any known harmful or potentially harmful uses of its products.
- Must notify its **directors and employees** about the order.
- Must submit to **compliance monitoring.**

**The transferable rule:** the AG did not demand the number be better. It demanded the number be **defined and shown**. This is exactly the failure Presto committed (reporting a "non-intervention rate" measured against a definition nobody was told). **A metric without a stated definition and method is the specific thing regulators are now ordering companies to fix.**

### 9.2 Massachusetts AG Advisory — THE most directly applicable authority for a Boston founder

**Status: CLAIMED as to exact wording** (mass.gov returned 403 to my fetch; the language below is quoted consistently by Orrick, Lexology/NatLawReview, and Manatt). **April 16, 2024.** AG **Andrea Campbell** — reportedly the first state AG in the country to issue AI guidance.

Primary source (not retrievable by me, 403): https://www.mass.gov/doc/ago-ai-advisory-41624/download
Announcement: https://www.mass.gov/news/ag-campbell-issues-advisory-providing-guidance-on-how-state-consumer-protection-and-other-laws-apply-to-artificial-intelligence
Analysis: https://www.orrick.com/en/Insights/2024/04/Massachusetts-Attorney-General-Shares-Artificial-Intelligence-Guidance-What-Businesses-Need-to-Know

The advisory states that existing Massachusetts law — the **Consumer Protection Act, M.G.L. c. 93A** — applies to AI, and lists as unfair or deceptive practices:

1. **Falsely advertising the quality, value, or usability of AI systems**
2. **Supplying an AI system that is defective, unusable, or impractical for the purpose advertised**
3. **Misrepresenting the reliability, manner of performance, safety, or condition of an AI system — including representing that an AI system is "fully automated when its functions are performed in whole or in part by humans"**
4. Offering AI systems unfit for ordinary or specific purposes
5. Misusing deepfakes, voice cloning, or chatbots to deceive consumers
6. Failing to comply with public health, safety, or welfare statutes

**Item 3 is the whole question, named explicitly, by the attorney general of the state the founder operates in.** Representing a system as fully automated when humans do part of the work is enumerated as a deceptive practice under Massachusetts law. There is no ambiguity to exploit here and no need to reason by analogy from Nate or Presto.

### 9.3 Why 93A is worse than a federal action for a small seller

**Status: CLAIMED** (general statement of Massachusetts law; verify with MA counsel).

M.G.L. c. 93A is unusually sharp:
- **§ 9** (consumer claims): **treble damages** for willful or knowing violations, plus **attorney's fees** for a prevailing plaintiff. Reportedly one of the few claims in Massachusetts where a plaintiff recovers full attorney's fees if they win *any* money at all.
- **§ 11** (**business-to-business** claims): a statutory cause of action **between businesses**, allowing recovery of **treble damages, attorney's fees, costs, and injunctive relief.**

**Translation for a founder selling licenses to universities:** the buyer does not need the FTC, the SEC, or the DOJ. **A single institutional customer that believes it was misled can sue under 93A § 11 directly**, and if the violation is found willful or knowing, collect three times its damages plus its lawyers' bills. That is the fastest, cheapest, most likely adverse event in this entire document — far more likely than a federal enforcement action against a small company. And it starts with a 93A demand letter, which costs the sender almost nothing.

---

# THE LEGAL LINE

## Where aspirational marketing ends and actionable misrepresentation begins (US)

**NOT LEGAL ADVICE.** Sourced doctrine, not counsel.

### The controlling framework: FTC Deception Policy Statement (1983)

**Status: VERIFIED.** I read the primary document.

FTC Policy Statement on Deception, **October 14, 1983**, appended to *Cliffdale Associates, Inc.*, 103 F.T.C. 110, 174 (1984): https://www.ftc.gov/system/files/documents/public_statements/410531/831014deceptionstmt.pdf

The three elements, VERBATIM:
> "First, there must be a representation, omission or practice that is likely to mislead the consumer."
> "Second, we examine the practice from the perspective of a consumer acting reasonably in the circumstances. If the representation or practice affects or is directed primarily to a particular group, the Commission examines reasonableness from the perspective of that group."
> "Third, the representation, omission, or practice must be a 'material' one. The basic question is whether the act or practice is likely to affect the consumer's conduct or decision with regard to a product or service."

**The sentence that answers the reliance question, VERBATIM:**
> "The issue is whether the act or practice is **likely to mislead**, rather than whether it **causes actual deception**."

### Where puffery ends — VERBATIM from the same statement

> "The Commission generally will not pursue cases involving obviously exaggerated or puffing representations, i.e., those that the ordinary consumers do not take seriously. **Some exaggerated claims, however, may be taken seriously by consumers and are actionable.**"

And on opinion-framing, which is how most "aspirational" marketing tries to survive:
> "Claims phrased as opinions are actionable, however, **if they are not honestly held**, if they misrepresent the qualifications of the holder or the basis of his opinion or **if the recipient reasonably interprets them as implied statements of fact**."

The cases the FTC cites for the boundary:
- *Pfizer, Inc.*, 81 F.T.C. 23, 64 (1972): "there is a category of advertising themes, in the nature of puffing or other hyperbole, **which do not amount to the type of affirmative product claims for which either the Commission or the consumer would expect documentation.**"
- *Wilmington Chemical*, 69 F.T.C. 828, 865 (1966): "A seller has some latitude in puffing his goods, **but he is not authorized to misrepresent them or to assign to them benefits they do not possess** ... **Statements made for the purpose of deceiving prospective purchasers cannot properly be characterized as mere puffing.**"
- *Jay Norris*, 91 F.T.C. 751, 847 n.20 (1978), aff'd, 598 F.2d 1244 (2d Cir.), cert. denied, 444 U.S. 980 (1979) — "electronic miracle" was held NOT to be puffery, because in context it lent "added credence" to surrounding exaggerated claims. **Even a fantastical word loses its puffery protection when it sits next to specific false claims.**

### The substantiation rule — this is the one that actually decides the founder's question

**Status: VERIFIED.** FTC Policy Statement Regarding Advertising Substantiation, **November 23, 1984**, appended to *Thompson Medical Co.*, 104 F.T.C. 648, 839 (1984), **aff'd, 791 F.2d 189 (D.C. Cir. 1986), cert. denied, 479 U.S. 1086 (1987)**: https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation

VERBATIM:
> "we reaffirm our commitment to the underlying legal requirement of advertising substantiation — that advertisers and ad agencies **have a reasonable basis for advertising claims before they are disseminated.**"

> "The Commission intends to continue vigorous enforcement of this existing legal requirement that advertisers substantiate **express and implied claims, however conveyed**, that make **objective assertions** about the item or service advertised. Objective claims for products or services represent explicitly or by implication that the advertiser has a reasonable basis supporting these claims. **These representations of substantiation are material to consumers.** ... Therefore, **a firm's failure to possess and rely upon a reasonable basis for objective claims constitutes an unfair and deceptive act or practice in violation of Section 5 of the Federal Trade Commission Act.**"

> "When the substantiation claim is express (e.g., 'tests prove', 'doctors recommend', and 'studies show'), the Commission expects the firm to have **at least the advertised level of substantiation.**"

On implied claims:
> "Although firms are unlikely to possess substantiation for implied claims they do not believe the ad makes, **they should generally be aware of reasonable interpretations and will be expected to have prior substantiation for such claims.**"

**The four words that decide this: "BEFORE THEY ARE DISSEMINATED."** The reasonable basis must exist **at the moment the claim is published**, not at some later point when the roadmap catches up. "We'll have it working by the time anyone checks" is not a legal position; it is the violation itself. The Workado order restates this in modern operative language: no efficacy representation unless the company "has competent and reliable evidence to support the claim **at the time it is made.**"

### The FTC's own AI-specific guidance

**Status: VERIFIED via Internet Archive.** Michael Atleson, FTC Division of Advertising Practices, "Keep your AI claims in check," **February 27, 2023.**

**IMPORTANT CAVEAT: the live FTC URL now returns 404.** I retrieved it from the Wayback Machine. Live URL (dead): https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check — Archived copy: https://web.archive.org/web/2024/https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check
Do not cite this as current agency guidance without checking whether it has been formally withdrawn or merely reorganized. The underlying 1983/1984 policy statements remain live on ftc.gov and are the actual legal authority.

VERBATIM, the operative passages:

> "some products with AI claims might not even work as advertised in the first place. ... Marketers should know that — for FTC enforcement purposes — **false or unsubstantiated claims about a product's efficacy are our bread and butter.**"

> "**Are you exaggerating what your AI product can do?** Or even claiming it can do something beyond the current capability of any AI or automated technology? ... **Your performance claims would be deceptive if they lack scientific support or if they apply only to certain types of users or under certain conditions.**"

> "**Are you promising that your AI product does something better than a non-AI product?** ... You need adequate proof for that kind of comparative claim, too, and **if such proof is impossible to get, then don't make the claim.**"

> "**Are you aware of the risks?** You need to know about the reasonably foreseeable risks and impact of your AI product before putting it on the market. If something goes wrong ... **you can't just blame a third-party developer of the technology. And you can't say you're not responsible because that technology is a 'black box' you can't understand or didn't know how to test.**"

> "**Does the product actually use AI at all?** If you think you can get away with baseless claims that your product is AI-enabled, think again. In an investigation, **FTC technologists and others can look under the hood** and analyze other materials to see if what's inside matches up with your claims. ... **merely using an AI tool in the development process is not the same as a product having AI in it.**"

Two of these are pointed directly at an agent-orchestration product:
- **"if such proof is impossible to get, then don't make the claim"** — an autonomy rate you cannot measure is a claim you cannot make.
- **"you can't say you're not responsible because that technology is a 'black box'"** — "the model did it" is pre-emptively rejected as a defense.

### Also live and new: FTC policy statement on AI accuracy, July 2026

**Status: CLAIMED — I could not retrieve the text.** Federal Register redirected my fetch to an anti-bot interstitial, which I did not engage with.

"Policy Statement Concerning the Suppression of Accuracy in Artificial Intelligence Systems," Federal Register, **July 7, 2026**: https://www.federalregister.gov/documents/2026/07/07/2026-13628/policy-statement-concerning-the-suppression-of-accuracy-in-artificial-intelligence-systems — also at https://www.regulations.gov/document/FTC-2026-0859-0013

Secondary reporting indicates the FTC positions undisclosed AI output-steering as consumer deception distinct from puffery, reasoning in part that **consumers accept AI outputs without independently checking them more than 90% of the time**, so reliance on AI output is qualitatively different from reliance on ordinary ad copy. (CLAIMED — via Consumer Finance Monitor, https://www.consumerfinancemonitor.com/2026/07/14/ftc-takes-aim-at-ai-accuracy/ and TechTimes.) **Flagging as recent and directionally relevant; read the actual statement before relying on it.**

---

## THE LINE, STATED PLAINLY

Synthesizing the verified doctrine and the thirteen-plus charged cases, the line falls almost exactly here:

### On the safe side (aspirational, generally not actionable)

- **Vision and intent framed as such.** "We're building toward a company that runs itself." "Our goal is full autonomy." Future-tense, first-person-intent, unmeasurable.
- **Subjective and evaluative claims.** "Beautifully designed." "The best way to start a company." Taste, feel, appearance — expressly carved out by the 1983 statement.
- **Outcome branding that is literally true of the user experience.** Amazon's "Just Walk Out" survived because the customer really does walk out. Describe what the user does, not what the machine is.
- **Honest capability with named limits.** "Agents draft and check the work; a human approves before anything goes live." This is not weaker marketing. It is the only version that is also a legal shield, and after Pieces and Presto it is what regulators are ordering companies to say anyway.

### On the actionable side (documented as charged conduct)

Every one of these has an enforcement action behind it:

| Claim type | Charged in |
|---|---|
| **Quantified autonomy** ("above 99% success," "95%+ non-intervention," "automate nearly 100%") | Saniger, Presto, Growth Cave |
| **"No human involvement"** ("without human intervention," "eliminates human order taking," "fully automated") | Saniger, Presto, MA AG advisory item 3 |
| **Accuracy or error metrics** ("98% accurate," "hallucination rate <0.001%") | Workado, Pieces Technologies |
| **Comparative claims vs. humans or non-AI** ("replace the $200B legal industry," "world's first robot lawyer") | DoNotPay |
| **"Our" / proprietary technology when it's a vendor's** | Presto |
| **"Uses AI" when it substantially doesn't** | Delphia, Global Predictions, CMG "Active Listening" |
| **Named customers who aren't customers** | 11x (no enforcement, but instant public refutation) |
| **Earnings or ROI claims** ("make $10,000/month," "first $1,000") | Air AI, FBA Machine, Ecommerce Empire Builders, Ascend Ecom |
| **A metric whose definition is undisclosed** | Presto, Pieces Technologies |

### The single-sentence test

**If a competent skeptic with access to your logs could run a measurement and prove your sentence false, it is not aspirational marketing — it is an objective claim, and you must already hold the evidence for it before you publish it.**

Corollary: the more specific and numeric the claim, the shorter the distance to liability. **Vagueness is legally safer but commercially weaker; specificity is commercially stronger but must be earned first.** There is no configuration where specificity is both unearned and safe.

### The special warning about earnings claims

Note the bottom row of that table. **Four of the FTC's AI cases were fundamentally about earnings claims, not AI claims** — Air AI, FBA Machine, Ecommerce Empire Builders, Ascend Ecom. The AI framing was aggravating context; the charged deception was "you will make money."

This is worth flagging because a promise that a student will "make their first $1,000" is structurally an **earnings claim tied to a business opportunity**, which is the single most heavily enforced category in this entire document. It potentially implicates the FTC's **Business Opportunity Rule** and, if there is any telemarketing, the **Telemarketing Sales Rule** — both of which Air AI was charged under, and both of which impose **affirmative disclosure duties** (required disclosure documents, earnings claim statements) that exist independently of whether the claim is true. Air AI's owners were personally banned from "making earnings claims without adequate substantiation or disclosure." **This deserves its own conversation with a lawyer, separate from the AI-capability question.**

---

# DIRECT ANSWERS TO THE THREE QUESTIONS

## Q1: Does it matter if a paying customer relied on the claim?

**Short answer: reliance makes it dramatically worse, but its absence is not a defense. Different bodies of law weight it differently, and at least one does not require it at all.**

### Where reliance is NOT required

**FTC Act Section 5.** VERBATIM from the 1983 Deception Policy Statement: *"The issue is whether the act or practice is likely to mislead, rather than whether it causes actual deception."* (VERIFIED)

The FTC does not need to produce a single deceived customer. It needs to show the claim was **likely** to mislead a reasonable member of the target audience about something **material**. Materiality can be presumed: *"In many instances, materiality, and hence injury, can be presumed from the nature of the practice."*

**Substantiation is its own free-standing violation.** The 1984 statement: *"a firm's failure to possess and rely upon a reasonable basis for objective claims constitutes an unfair and deceptive act or practice."* Note what is absent — any requirement that anyone read the claim, believe it, or buy anything. **Publishing an unsubstantiated objective claim is the violation, complete on its own.** This is exactly how DoNotPay was charged: the FTC's theory was that the company never tested against the claimed benchmark. Zero deceived customers needed to be identified.

**Massachusetts 93A** likewise reaches "unfair or deceptive acts or practices" without requiring proof that a specific consumer was fooled, for AG enforcement.

### Where reliance IS required, or nearly so

**Private securities fraud** (Rule 10b-5 class actions) requires reliance, though there are presumptions.

**Common-law fraud / misrepresentation** requires justifiable reliance and damages.

**93A § 11 private business suits** require a loss of money or property caused by the unfair or deceptive act — so a customer plaintiff effectively needs to show it was misled and harmed.

### Why reliance still changes everything in practice

Look at what actually distinguishes the outcomes in this document:

- **Delphia and Global Predictions** — misleading claims, settled, **$400,000 total**, no admission.
- **Workado** — misleading number, **$0**, plus a reporting leash.
- **Pieces Technologies** — misleading metric to hospitals, **$0**, plus disclosure duties.
- **Presto** — misleading claims in SEC filings, **$0** (broke), delisted.
- **Air AI** — earnings claims relied on by paying small businesses, **$18M judgment** (suspended to $50K), **lifetime industry ban on the owners.**
- **Saniger** — specific claims relied on by investors who wired **$42M** and lost all of it, **criminal indictment**, potential prison.

**The severity gradient tracks money-that-moved-because-of-the-claim almost perfectly.** Reliance is not the element that creates liability; it is the multiplier that converts liability from a corrective order into a financial and criminal catastrophe.

### The practical upshot

A false capability claim on a website with zero customers is already a violation, and the realistic worst case is a corrective order. **The moment a paying customer signs because of that claim, three things switch on at once:** an identifiable victim, a quantified loss, and a private plaintiff with a treble-damages statute. **The single highest-leverage risk reduction available is to not take money against a claim you cannot substantiate** — and it costs nothing but the sentence.

---

## Q2: Does it matter if the seller is a solo founder with no corporate entity (no liability shield)?

**Short answer: it makes it WORSE, not better. In three distinct ways. This is the most commonly misunderstood item in this whole document.**

### Way 1: The corporate shield was never a shield against this in the first place

**Status: CLAIMED** (settled FTC practice; verify with counsel).

Under the FTC Act, an individual is personally liable where the individual **(1) participated directly in the deceptive practice or had authority to control it, and (2) had knowledge of the deceptive conduct** — with "knowledge" satisfied by actual knowledge, reckless indifference, or an awareness of a high probability of deception coupled with intentional avoidance of the truth. **Incorporating, or operating through an LLC, does not insulate an individual from this.** (Sources: Squire Patton Boggs, https://www.squirepattonboggs.com/en/insights/publications/2011/04/ftc-enforcement-against-individuals-legal-standa__ ; Venable, https://www.venable.com/-/media/files/events/2022/02/venable-individual-liability-presentation.pdf)

The record bears this out — **in every FTC AI case in this document, the humans were named:**
- Air AI → **Caleb Maddix, Ryan O'Donnell, Thomas Lancer** (VERIFIED from FTC release)
- Ascend Ecom → **William Basta, Kenneth Leung** (VERIFIED)
- Ecommerce Empire Builders → **Peter Prusinowski** (VERIFIED)
- FBA Machine → **Bratislav Rozenfeld** (VERIFIED)
- Nate → **Albert Saniger**, charged personally and criminally, **after the company was dissolved** (VERIFIED)

**Saniger is the definitive proof.** Nate was a Delaware corporation. It was dissolved in January 2023 through a California Assignment for the Benefit of Creditors. He was indicted **twenty-seven months later**, as a natural person. The entity's death did not carry the liability away with it.

So: a solo founder with no entity is **not meaningfully worse off than an incorporated founder** on the deception question. Both are personally exposed. **The absence of an entity simply removes an illusion, not a protection.**

### Way 2: No entity means there is nothing to absorb the hit, and no one to blame

An entity does provide real protection against ordinary business liabilities — contract disputes, an unpaid vendor, a slip-and-fall. With no entity:
- **Judgments attach to personal assets.** There is no corporate balance sheet to exhaust first.
- **There is no D&O insurance**, because there are no directors and officers. Every legal bill is paid out of pocket, and defense costs in even a losing-for-the-plaintiff case can dwarf the underlying claim.
- **There is no one else to point at.** Presto's founder could gesture at a supplier, a board, executives who chose the terminology. A solo founder wrote the sentence, holds the logs, and knows exactly what the system does. **The knowledge element of individual liability is trivially satisfied when there is only one person.**
- **Personal bankruptcy may not discharge it.** Debts for fraud or willful misrepresentation are generally non-dischargeable in bankruptcy. (CLAIMED — general principle; verify with counsel.)

### Way 3: Being broke reduces the check, not the ban

This is the most important empirical finding on this question, and it comes straight from the record:

- **Air AI:** $18 million judgment, "largely suspended based on the company's and operators' inability to pay." They paid **$50,000**. **And the owners are still personally banned from selling or marketing any business opportunity, from making false claims while selling any goods or services, and from making earnings claims without substantiation.** (VERIFIED)
- **Presto:** $0 penalty because the SEC "considered Respondent's current financial condition." The company was delisted and deregistered anyway. (VERIFIED)

**Inability to pay is a discount on the cash, applied at the end. It does not reduce the injunction, the ban, the disclosure obligations, the compliance-reporting years, or the public record.** For a 20-something founder, the ban and the record are the expensive parts. A $50,000 judgment is survivable at 25. A permanent FTC order in your legal name, discoverable by every future investor, acquirer, university procurement office, and employer, is a different kind of cost — and it is the one the government imposes regardless of your bank balance.

### The one genuine asymmetry in a small founder's favor

**Nobody is going to indict a solo founder over a landing page.** Prosecutorial resources follow dollars. The DOJ charged Saniger because $42 million moved and vanished. Realistically, the tail risks for a pre-revenue solo founder rank like this:

1. **Most likely by far:** a 93A demand letter or a refund/breach dispute from one unhappy institutional customer. Cheap for them to send, expensive for you to answer.
2. **Likely:** public refutation. A university employee, a competitor, or a journalist checks the claim and says so publicly. See 11x — this needed no lawyer at all.
3. **Plausible:** a state AG inquiry, particularly in Massachusetts, where the AG has already published an advisory naming "fully automated when its functions are performed in whole or in part by humans" as deceptive.
4. **Unlikely at small scale:** an FTC action. But note the FTC's 2025-2026 docket is full of small operators, and **7 of the last 8 cases were B2B**.
5. **Very unlikely without investor money:** SEC or DOJ. **This changes the instant you raise a round.** Every dollar of investor money converts capability claims into securities representations, and *that* is the Saniger fact pattern exactly.

**So the honest answer to "does no entity matter?" is: it does not save you from any of the five, and it strips the padding from the first two. The thing that actually reduces exposure is the sentence you publish, not the wrapper you publish it in.**

---

## Q3: What do the enforcement actions have in common? Is there a pattern in WHO gets caught?

### Pattern 1: The claim was numeric or absolute — never merely enthusiastic

Not one action in this document was brought over a company being excited about AI. **Every single charged claim was either a number or an absolute.**

"above 99% success" · "95%+ non-intervention" · "eliminates human order taking" · "98 percent accurate" · "hallucination rate <0.001%" · "automate nearly 100%" · "without human intervention" · "the world's first robot lawyer" · "first regulated AI financial advisor"

**Nobody has ever been charged for "AI-powered." Everybody was charged for a number or an "eliminates"/"first"/"no human."** The FTC's own 1983 statement explains why: the boundary of puffery is whether the claim is one "for which either the Commission or the consumer would expect documentation." A percentage invites documentation. Enthusiasm does not.

### Pattern 2: Someone inside knew and said so, in writing

This is the most consistent and most chilling feature of the record.

- **Nate:** "Nate's 'automation rate' was 'essentially zero'" — Slack, June 11, 2021. (VERIFIED)
- **Presto:** "telling investors Presto AI is running 95%+ accuracy without disclosing AI is doing NONE of the work and all orders are processed by humans" — internal message, January 2023. Plus: don't say "automation rate ... because it infers no supervision which isn't true" — October 2022. The order notes several other senior executives raised the same concern. (VERIFIED)
- **Builder.ai:** the former chief business officer's suit calling the tech "nothing more than smoke and mirrors" — 2019. (CLAIMED)
- **11x:** employees told TechCrunch the real ARR and the real churn. (CLAIMED)
- **Innodata:** a short-seller found it from the outside in a single report. (CLAIMED)

**The internal objection is not a warning that precedes the case. It IS the case.** Regulators do not have to prove your state of mind by inference when a colleague documented it for them. And the objection always exists, because someone always knows. In a solo operation, the equivalent artifact is your own commit history, your own eval runs, your own notes — **contemporaneous records showing you knew the real number.**

There is a perverse implication worth naming: measuring your autonomy rate honestly creates the evidence that convicts you *if* you then publish a different number. It does not create risk if you publish the number you measured. **The danger is never in the measurement; it is in the gap between the measurement and the marketing.**

### Pattern 3: The gap had to be actively concealed, and concealment escalated the charge

The companies that got the worst outcomes did not merely overclaim; they built machinery to keep the claim standing:
- **Saniger:** engineers on standby during demos; a "VIP" investor email list for manual completion; an instruction that automation engineers not report AI status to other employees. → **criminal charge**
- **Presto:** used "automated order completion" and "non-intervention" interchangeably, having internally discussed that the terms would mislead. → charged
- **Builder.ai:** round-tripping and fictitious invoices to make revenue match the story. → **collapse**
- **11x:** kept logos up for months after being told to remove them; counted broken contracts as ARR. → founder out

**The overclaim is rarely fatal by itself. What kills is the second act — the thing you do to keep the first claim alive.** Nate survived the false claim for three years and died in seven months once the concealment was exposed.

### Pattern 4: Press and short sellers act first. Regulators arrive years later.

| Company | Exposure | Enforcement | Gap |
|---|---|---|---|
| Nate | *The Information*, June 2022 | DOJ/SEC, April 2025 | **~34 months** |
| Builder.ai | WSJ, Aug 2019 | Insolvency, May 2025 | **~69 months** |
| Innodata | Wolfpack Research, Feb 2024 | Class action, ongoing | ~1 month to suit |
| 11x | TechCrunch, Mar 2025 | No regulator; CEO out May 2025 | ~2 months to CEO exit |
| Presto | — | SEC order, Jan 2025 | delisted before order |

**Two separate clocks, and the fast one is not the legal one.** The commercial consequence — dead fundraise, dead company, founder out — lands in **weeks to months** and is delivered by journalists, short sellers, and named customers. The legal consequence lands in **years**. A founder who reassures themselves that regulators are slow and small companies are beneath notice is correct and has still missed the actual threat, which is a reporter's email to a "customer."

### Pattern 5: WHO gets caught — the real selection function

Contrary to intuition, it is **not** primarily the biggest or the most obviously fraudulent. Sorting the record, the people who got caught share these traits:

1. **They took money from someone with the standing and motive to complain.** Investors (Nate, Builder.ai, Innodata), small businesses (Air AI, FBA Machine), hospitals (Pieces), subscribers (DoNotPay, Workado). Amazon claimed similar things and faced nothing, because nobody who paid Amazon lost money over Just Walk Out.
2. **They named a third party who could contradict them.** 11x named ZoomInfo. Presto called a supplier's tech "our" technology. **Every claim about someone else is a claim they can refute for free.**
3. **They published a checkable number.** Every single case. The number is the hook that makes an investigation cheap: the FTC's Workado action reduced to one independent test showing 53% versus a claimed 98%.
4. **They were in a hot category during its hype peak.** AI SDRs, AI app builders, AI storefronts, AI legal, AI healthcare. Regulators sweep categories, not companies — Operation AI Comply was explicitly a **sweep**, and the FTC has now filed 13.
5. **They had a disgruntled insider or an activist outsider.** Every case had one.
6. **They kept the claim up after being told it was wrong.** This is the trait that separates a corrective order from a criminal charge.

**The traits that do NOT protect you:** being small (Growth Cave, Workado, Pieces are all small); being B2B (7 of the last 8 FTC cases); being pre-revenue (substantiation violations are complete on publication); having no entity (every case named individuals); being sincere about the roadmap (substantiation must exist *before* dissemination); or a change of administration (Workado, Air AI, Growth Cave, and CMG were all charged under the Ferguson FTC).

### Pattern 6: The remedy is converging on "define your metric and show your method"

The newest orders are not about paying. They are about **permanent, structural honesty obligations**:
- **Pieces:** must disclose the definition of accuracy metrics and the methods used to calculate them.
- **Workado:** no efficacy claim without competent and reliable evidence **at the time it is made**; must retain the evidence; four years of compliance reports; $53,088 per future violation.
- **DoNotPay:** no claim of substituting for a professional service without evidence; must notify past subscribers of the limitations.
- **Growth Cave:** banned from misrepresenting that a product will use AI to enhance profitability, effectiveness, or efficiency.
- **Air AI:** owners banned from earnings claims without adequate substantiation or disclosure.

**Regulators have converged on exactly the discipline a governed-truth product would claim to enforce: state the claim, state the evidence, state the method, keep the receipts, and mark what is measured versus asserted.** The enforcement trend is not an obstacle to that product thesis — it is the market for it. **But that only holds if the product's own public claims meet the standard it sells.** A governance product caught overclaiming its own autonomy is not merely in legal trouble; its entire value proposition inverts. That is a category-specific risk that does not apply to an ordinary SaaS company, and it is asymmetric: the downside is not a fine, it is the permanent loss of the one thing being sold.

---

# WHAT THE RECORD SAYS TO A FOUNDER DECIDING TODAY

Stated as findings, not advice:

1. **No enforcement action in this record was brought against a company for having an incomplete product.** They were brought for describing an incomplete product as a complete one. **Incompleteness is not the liability. The sentence is.**

2. **The substantiation rule means the timing argument fails.** "It will be true soon" is not a defense; the 1984 policy statement requires a reasonable basis **before** dissemination, and *Thompson Medical* was affirmed by the D.C. Circuit with cert denied. This is not a novel or aggressive reading.

3. **The specific sentence pattern at issue — "fully automated" when humans do part of the work — is enumerated as deceptive by the Massachusetts Attorney General**, in the founder's own state, since April 2024.

4. **Selling to institutions is now the FTC's main hunting ground**, not a safe harbor: 7 of the last 8 AI-washing cases were B2B claims.

5. **The cheapest realistic downside is not a regulator. It is one named customer, or one reporter, saying the claim is false** — as ZoomInfo did to 11x with a two-sentence email, costing that founder the CEO job in about eight weeks.

6. **A promise that a student will make their first $1,000 is an earnings claim on a business opportunity**, which is the most-enforced category in this entire document and carries **affirmative disclosure duties independent of truth**. This warrants separate legal review.

7. **There is a version of the strong claim that is both honest and sellable**, and the enforcement record points straight at it: describe the **user's outcome** rather than the **machine's internals** (Amazon's survival), state the **human checkpoint** as a feature rather than hiding it (what Presto and Pieces were ordered to do), and **define any number you publish along with how you measured it** (what Pieces and Workado were ordered to do). The claim that survives contact with a skeptic is the claim that names its own limits.

8. **The one thing the record shows no path back from is taking money against a claim you knew was false when you made it.** That is the line between a settlement and an indictment. Everything else in this document was survivable by someone.

---

# SOURCE INDEX

## Primary sources I retrieved and read directly (VERIFIED)

| Source | URL |
|---|---|
| SEC complaint, *SEC v. Saniger*, 1:25-cv-02937 (S.D.N.Y. Apr. 9, 2025) | https://www.sec.gov/files/litigation/complaints/2025/comp26282.pdf |
| SEC Litigation Release No. 26282 (Apr. 11, 2025) | https://www.sec.gov/enforcement-litigation/litigation-releases/lr-26282 |
| SEC Order, *In re Presto Automation Inc.*, Rel. 33-11352 (Jan. 14, 2025) | https://www.sec.gov/files/litigation/admin/2025/33-11352.pdf |
| SEC Press Release 2024-36, Delphia & Global Predictions (Mar. 18, 2024) | https://www.sec.gov/newsroom/press-releases/2024-36 |
| FTC, "FTC Announces Crackdown on Deceptive AI Claims and Schemes" (Sept. 25, 2024) | https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes |
| FTC, Workado order press release (Apr. 28, 2025) | https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-order-requires-workado-back-artificial-intelligence-detection-claims |
| FTC, Air AI settlement press release (Mar. 24, 2026) | https://www.ftc.gov/news-events/news/press-releases/2026/03/air-ai-its-owners-will-be-banned-marketing-business-opportunities-settle-ftc-charges-company-misled |
| FTC Policy Statement on Deception (Oct. 14, 1983), app. *Cliffdale Associates*, 103 F.T.C. 110 | https://www.ftc.gov/system/files/documents/public_statements/410531/831014deceptionstmt.pdf |
| FTC Policy Statement Regarding Advertising Substantiation (Nov. 23, 1984), app. *Thompson Medical*, 104 F.T.C. 648, aff'd 791 F.2d 189 (D.C. Cir. 1986) | https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation |
| FTC, "Keep your AI claims in check" (Feb. 27, 2023) — **live URL now 404; read via Internet Archive** | https://web.archive.org/web/2024/https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check |
| FTC Air.ai case page | https://www.ftc.gov/legal-library/browse/cases-proceedings/airai |

## Secondary sources (CLAIMED)

| Topic | Source |
|---|---|
| Builder.ai collapse | https://restofworld.org/2025/builderai-ai-apps-downfall/ · https://www.bloomberg.com/news/features/2025-07-30/startup-builder-ai-goes-from-1-5-billion-unicorn-to-bankruptcy · https://en.wikipedia.org/wiki/Builder.ai |
| 11x ARR and logos | https://techcrunch.com/2025/03/24/a16z-and-benchmark-backed-11x-has-been-claiming-customers-it-doesnt-have |
| Saniger not-guilty plea, $250K bond | https://www.mlex.com/mlex/articles/2423455/former-nate-ceo-pleads-not-guilty-to-us-fraud-charges-over-ai-claims |
| Saniger as first AI-disclosure trial test | https://www.quinnemanuel.com/the-firm/publications/client-alert-the-first-real-test-what-saniger-means-for-ai-disclosure-fraud/ |
| FTC 13 AI-washing cases; 7 of last 8 B2B; CMG "Active Listening" | https://www.dlapiper.com/en-us/insights/publications/2026/05/ftc-ai-washing-action-underscores-enforcement-in-business-to-business-context |
| Growth Cave / GrowthBox | https://www.dlapiper.com/en-us/insights/publications/2026/02/ftc-resolves-another-case-involving-ai-washing |
| Agentic AI / productivity claims (FTC Air AI analysis) | https://www.dlapiper.com/en/insights/publications/2025/08/ftcs-latest-ai-washing-case |
| AI securities class actions rising | https://www.dlapiper.com/en-us/insights/publications/2025/09/ai-related-securities-class-action-filings-are-on-the-rise-key-observations |
| Innodata class action complaint | https://www.cohenmilstein.com/wp-content/uploads/2025/02/Innodata-Securities-Class-Action-Complaint.pdf |
| DOJ/SEC AI-washing analysis | https://www.whitecase.com/insight-alert/evolution-ai-washing-enforcement-doj-enters-picture · https://www.hklaw.com/en/insights/publications/2025/07/sec-and-doj-warm-up-to-enforcement-over-ai-washing · https://www.dandodiary.com/2025/04/articles/securities-enforcement/tech-exec-charged-with-ai-washing-related-securities-fraud/ |
| Texas AG / Pieces Technologies | https://www.texasattorneygeneral.gov/news/releases/attorney-general-ken-paxton-reaches-settlement-first-its-kind-healthcare-generative-ai-investigation · https://www.goodwinlaw.com/en/insights/publications/2024/12/alerts-practices-hltc-texas-ag-enters-into-settlement-with-provider-of-gen-ai-tools |
| Massachusetts AG AI advisory (Apr. 16, 2024) | https://www.mass.gov/doc/ago-ai-advisory-41624/download (403 to me) · https://www.orrick.com/en/Insights/2024/04/Massachusetts-Attorney-General-Shares-Artificial-Intelligence-Guidance-What-Businesses-Need-to-Know |
| FTC individual liability standards | https://www.squirepattonboggs.com/en/insights/publications/2011/04/ftc-enforcement-against-individuals-legal-standa__ · https://www.venable.com/-/media/files/events/2022/02/venable-individual-liability-presentation.pdf |
| Amazon Just Walk Out pushback | https://www.axios.com/2024/04/17/amazon-walk-out-store-technology-grocery-expansion |
| FTC AI accuracy policy statement (July 7, 2026) | https://www.federalregister.gov/documents/2026/07/07/2026-13628/policy-statement-concerning-the-suppression-of-accuracy-in-artificial-intelligence-systems (not retrieved) · https://www.consumerfinancemonitor.com/2026/07/14/ftc-takes-aim-at-ai-accuracy/ |

## NOT FOUND / could not verify

- **DOJ SDNY press release on Saniger** — every URL variant returned 403 or a JS-gated shell. The two criminal counts (securities fraud, wire fraud) are consistently reported across Fortune, TechCrunch, Cointelegraph, and multiple law-firm alerts, but I did not read DOJ's own words.
- **Builder.ai revenue restatement magnitude** — sources conflict ($220M→$140M vs. "roughly a quarter of prior estimates"). Unresolved.
- **Settlement dollar figures for Ascend Ecom, Empire Holdings Group, FBA Machine** — settlements confirmed (May/June 2025); amounts not in sources I read.
- **Any EU AI Act fine actually levied for AI capability overclaiming** — none found as of 2026-08-17. Enforcement powers went live Aug. 2, 2026; no penalties on the public record that I could locate.
- **Texas AG and Massachusetts AG primary documents** — both sites blocked my fetches (402/403). Terms are consistent across multiple independent law-firm summaries but the exact advisory wording in § 9.2 item 3 is CLAIMED, not VERIFIED.
- **FTC July 2026 AI accuracy policy statement text** — Federal Register redirected to an anti-bot interstitial, which I did not engage.
- **Any case involving a founder with no corporate entity at all** — NOT FOUND. Every case I located involved at least one corporation or LLC, with individuals named alongside it. The individual-liability doctrine makes the entity's presence largely irrelevant to personal exposure, but I found no direct precedent on a truly unincorporated solo seller.

---

**Closing reminder: this is not legal advice.** It is a sourced summary of public enforcement records. The Massachusetts angle in particular (93A § 11 treble damages, the AG's April 2024 advisory naming "fully automated ... performed in whole or in part by humans") is specific enough to the founder's situation that it deserves an hour with a Massachusetts attorney before any launch claim is published.
