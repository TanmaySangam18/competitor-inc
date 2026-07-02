# Polsia Deep-Dive (Sourced Intelligence Brief)

**Compiled:** 2026-07-02 · **Method:** web research + Polsia's own public unauthenticated `/live` dashboard API (fetched directly 2026-07-02 ~06:50 UTC). Every claim carries a source URL. VERIFIED = corroborated by primary source or 2+ independent outlets. UNVERIFIED = single-source, self-reported-only, or contested.

**Subject:** Polsia (polsia.com) — "AI That Runs Your Company While You Sleep." Autonomous AI system that plans, codes, markets, and operates companies. Solo founder: **Ben Broca** (widely rendered in media/X as "Ben Cera"; LinkedIn slug `benbroca`).
- Founder profiles: https://www.linkedin.com/in/ben-broca-220469bb/ · https://www.linkedin.com/in/benbroca/ · https://x.com/Bencera · https://polsia.com/about

---

## 1. FUNDING — VERDICT: the "no external funding" belief is **REFUTED**

Polsia has raised external capital **twice**:

1. **Pre-seed ~$1M, summer 2025** — per the GTMnow interview ("$1M of pre-seed money he barely spent"): https://gtmnow.com/gtm-192-inside-the-company-that-raised-30m-at-a-250m-valuation-with-0-employees-ben-cera-polsia/ . True Ventures wrote "We're proud to be the first to believe in Ben and Polsia": https://www.trueventures.com/blog/polsia-one-person-company-no-longer-a-metaphor
2. **Series A: $30M at a $250M valuation, announced ~May 22, 2026.**
   - Led by **Sound Ventures** (Ashton Kutcher/Guy Oseary), with **True Ventures, Offline Ventures, Adjacent, Tekton Ventures, Drysdale Ventures, Vaynerfund** + angels:
     - https://pulse2.com/polsia-30-million-at-250-million-valuation-raised-for-ai-operations-platform/
     - https://www.thesaasnews.com/news/polsia-raises-30m-other/
     - https://fundraiseinsider.com/blog/polsia-raises-30m-at-250m-valuation-for-solo-run-ai-platform/
     - https://en.ain.ua/2026/05/25/ai-startup-polsia-with-no-employees-raised-30m-in-funding/
   - Founder's own announcement on LinkedIn ("Today I'm announcing that Polsia raised $30M…"): https://www.linkedin.com/posts/benbroca_today-im-announcing-that-polsia-raised-30m-activity-7463621327774588928-Yqgn
   - Database entries exist: PitchBook https://pitchbook.com/profiles/company/1325146-51 · Dealroom https://app.dealroom.co/news/note/polsia-hits-10m-arr-with-zero-employees-raises-30m
   - Date note: preuve.ai puts the announcement at **May 22, 2026** (https://preuve.ai/blog/polsia-review); pulse2 dates its piece May 25.

**The "AI ran the fundraise" framing (self-reported, widely repeated):** Polsia's agents ran the data room, answered investor emails to ben@polsia, briefed investors and handled diligence; Ben "joined only the final calls." Sources: the LinkedIn announcement above; https://www.gtmhq.com/dailybrief/polsia-raises-30m-at-250m-valuation-one-human-zero-employees-the-fundraise-itself-was-run-by-agents ; GTMnow (AI-led process via live dashboard on Twitter). This matches what the founder described on the March 2026 Kevin Rose podcast (actively fundraising, /live data room).

**Conflict-of-interest context worth knowing:** Kevin Rose is a **True Ventures partner** (https://www.trueventures.com/team/kevin-rose). His March 31, 2026 podcast with Ben (https://www.kevinrose.com/p/the-solopreneur-revolution-is-here) preceded True's participation in the May round, and True was already the pre-seed "first believer." The friendly podcast was not a disinterested interview.

**Do not conflate:** Monaco (Sam Blond's company, ~$35M) is a separate entity — nothing in any Polsia round coverage references Monaco.

---

## 2. Company & traction now (as of early July 2026)

### Primary data — Polsia's own public dashboard API (fetched by us 2026-07-02, `https://polsia.com/api/public/live/dashboard`)
Self-reported by Polsia's systems, but machine-read directly, not via press:
- **"ARR": $8,516,289 — DOWN from $9,297,667 seven days earlier** (−8.4% week-over-week)
- **Subscription MRR: $363,732** → only **~$4.36M/yr of the headline "ARR" is recurring subscriptions (~51%)**
- 30-day non-subscription components baked into "ARR": ad spend passed through **$128,715**, "boosts" **$86,230**, instant credit packs **$62,810**, user-company revenue **$65,615**, domains **$2,589**
- **Active companies: 8,290** (7,024 a week ago) vs **195,101 companies ever created** → ~**4.2% of created companies are active**; 1,883 created in prior 24h
- **fund_mrr: $0** (an investor/"fund" product exists in the schema but earns nothing)
- Cumulative: 1,470,678 tasks · 760,525 emails sent · 2,764,686 messages · 16,413 Sora UGC ads created
- Live log confirms working agents named Research, Browser, Twitter, **Meta Ads Manager** (creating/activating real ads with CTR/CPC metrics, e.g. "14.08% CTR, $0.28 CPC")

### Trajectory (self-reported milestones)
| Date | Milestone | Source |
|---|---|---|
| mid-Dec 2025 | v1 launch | https://mixergy.com/interviews/this-ai-generates-689k/ |
| Jan 26, 2026 | $20K MRR | Mixergy (same) |
| Feb 26, 2026 | $689K run rate | Mixergy (same) |
| ~30 days post-launch | $1M ARR, 1,000+ companies | https://www.trueventures.com/blog/polsia-one-person-company-no-longer-a-metaphor |
| ~Mar 2026 (Product Hunt launch) | 700+ companies, $450K+ ARR, 20% rev share stated | https://www.producthunt.com/products/polsia |
| May 8, 2026 | $6.3M run rate, 5,943 active companies, 3,627 DAU | https://henrythe9th.substack.com/p/how-a-solo-founder-cloned-himself |
| May 22–27, 2026 | "~$10M run rate," 7,600–8,791 companies (raise PR) | pulse2 + https://mixergy.com/interviews/is-polsia-a-250m-scam-i-asked-the-founder-to-his-face/ |
| mid-June 2026 | ~$9.8M, down from ~$10.4M a week earlier | https://preuve.ai/blog/polsia-review |
| **Jul 2, 2026** | **$8.52M, down from $9.30M a week earlier** | our direct API fetch |

**Read: the headline number peaked around the raise (~$10.4M) and has fallen ~18% in ~5 weeks.** Growth engine has reversed, per Polsia's own dashboard.

### Revenue quality & churn (founder on record)
In the May 27, 2026 Mixergy follow-up ("Is Polsia a $250M scam? I asked the founder to his face," https://mixergy.com/interviews/is-polsia-a-250m-scam-i-asked-the-founder-to-his-face/), Ben:
- Defended blending subscriptions + credits + ad spend + domains into "run rate" ("All those cash flows are hitting Polsia's bank account"), citing Anthropic as a comparable
- **Admitted churn "around 50% on month one" and "another 50%" month two**
- Admitted **only ~10% of customer companies ever made ≥$1**; the best company made "three, $4,000"
- Ad-related revenue ~10–15% of total
- Note: the earlier "85% M2 retention" figure he gave henrythe9th (May 8) directly contradicts the 50%/50% churn admission — treat the 85% as marketing.

### Team
- **Still zero employees besides Ben** as of May 27, 2026 ("Just for now… except me"); uses contractors (legal/moderation) and infra partners; hiring "maybe in six months": Mixergy scam interview above. No hiring announcements found since.

### Reputation
- **Trustpilot 1.8/5 across 35 reviews, ~80% one-star** (as of June 22, 2026, up from 20 reviews in May — rating fell as reviews grew): https://preuve.ai/blog/polsia-review · https://www.trustpilot.com/review/polsia.com (direct fetch blocked; figure via preuve)
- Complaint themes: tasks marked "complete" that never deployed; credits burned on failed actions with limited refunds; automated outreach with wrong names/prices; support escalations going weeks; domains/code locked to Polsia infrastructure: preuve + https://cto.new/guides/polsia-review

### X presence
- Site metadata declares `twitter:site` = **@polsiahq** (read from polsia.com HTML, 2026-07-02); an x.com/polsia profile and a "Polsia Community" (~1.1K members) also surface in search (https://x.com/i/communities/2024145246372745520). Founder posts as @Bencera. Post-level activity not directly auditable (X blocks fetching) — UNVERIFIED beyond existence.

---

## 3. Architecture / engineering

### Confirmed stack
- **Built on Anthropic's Claude Agent SDK**: Kevin Rose episode notes (https://www.kevinrose.com/p/the-solopreneur-revolution-is-here) + https://henrythe9th.substack.com/p/how-a-solo-founder-cloned-himself
- **Dual-model workflow: Claude Opus for pragmatic building/product work, Codex for review/"ruthless bug-finding"** (Kevin Rose ep; henrythe9th: "Claude Opus (features/product reasoning), Codex (bug diagnosis, high-thinking validation)"). andrew.ooo says the CEO agent runs on **Claude Opus 4.6**: https://andrew.ooo/posts/polsia-1m-arr-30-days-zero-employees/
- Early cost base: **3 Anthropic Max subscriptions + 1 Codex Max ≈ $800/month total burn** (henrythe9th; also Agents at Work podcast https://podcasttranscript.ai/library/agents-at-work-21-your-next-co-founder-is-an-ai)
- By May 2026: moving to **Opus/Sonnet/Haiku routing**, exploring open-source models and own GPUs; a "$1.5M/month Anthropic bill" figure appears in the Mixergy scam-interview transcript (flag: single source, possibly mis-transcribed) — and "I lose money on every customer today": https://timfrin.substack.com/p/how-polsia-builds-and-runs-companies
- **Per-company provisioning:** Render web server, database (Neon per andrew.ooo), GitHub repo, email inbox, Stripe account, Meta ads account (andrew.ooo; preuve; Agents at Work transcript)
- **Acknowledged infrastructure partners:** **Sapiom, Blaxel (YC X25, agent sandboxes), Anchor Browser, AgentMail (YC S25, email for agents)**, plus Stripe, **Render** (hosting), **Postmark** (email), Anthropic, OpenAI, Meta, X, GitHub, AWS — surfaced via Polsia's partner acknowledgments (indexed from https://www.indiehackers.com/post/tech/growing-a-fully-autonomus-business-to-a-500k-mo-in-3-months-diZ8gkqMHm0CvEsc7Pfo and corroborated in the Mixergy scam interview, where Ben names "Sapiom… Blaxel… Anchor Browser, AgentMail")
- **The "~CPM" partner from the podcast is almost certainly "Sapiom"** — financial infrastructure letting AI agents buy their own tools/APIs/compute; raised $15M seed (Feb 2026): https://techcrunch.com/2026/02/05/sapiom-raises-15m-to-help-ai-agents-buy-their-own-tech-tools/ · https://www.sapiom.ai/
- **Meta ads engine:** button + budget → **Sora 2-generated UGC video ads** deployed on the user's behalf (Kevin Rose ep; andrew.ooo); min $10/day budget (Mixergy Feb). Live dashboard logs show the Meta Ads Manager agent creating/pausing/reactivating ads on performance data (our API fetch).
- **MCPs** for tool integration; Claude Code used for browser/UI automation (Agents at Work transcript).

### Agent design
- **Nine agents on fixed cadences** (per preuve's product teardown, https://preuve.ai/blog/polsia-review): Orchestrator/CEO 2×/day · Social every 2h · Email outreach every 3h · Support every 3h · Ads every 6h · Finance every 6h · Business planning daily · Competitor research daily · Code generation on demand
- **Nightly CEO cycle:** "every night there's a CEO agent that's gonna look at the state of your business and try to figure out the best next step" — fix prod bugs before marketing (Mixergy Feb; timfrin). Framed as both product and cost/feedback strategy (Kevin Rose ep).
- **Chat agent as strategist** that assigns tasks to cheaper specialized agents "mostly from a cost perspective"; memory layers = company context, past decisions, user personality (timfrin)
- **"Skills"/SOP system** where agents learn procedures (e.g., "create a new skill: check that the improvement works in production") (Agents at Work transcript). **Shared skills + memory files were later killed** after users abused them to bypass the 2-emails/day outreach cap (Mixergy scam interview).
- ~"80% autonomous" with the goal of 100%; long-term "Polsia will essentially start building itself" (Agents at Work transcript)

### Pricing / credits
- **$49–50/month base**, one nightly autonomous task included; extra tasks via credits **~$1–2/task** (GTMnow: "$1–2 per additional task"; preuve: "roughly $1 per task"; PH launch: 5 base + 10 bonus credits first month; a $10 cold-outreach task complaint appears in PH comments)
- **20% revenue share on Stripe revenue AND 20% on managed ad spend** (PH maker comment: "we take 20% on revenue"; preuve; cto.new)
- Pricing has "shuffled more than once" (preuve). A **$199/month** subscription appears in Rest of World's April 2026 user story (China): https://restofworld.org/2026/ai-agent-china-one-person-company/ — tier structure UNVERIFIED
- Freemium/lower tiers under consideration (Mixergy scam interview; GTMnow)

---

## 4. Product surface (current)

- **Onboarding:** type an idea or click "surprise me" → system provisions servers, Stripe, inbox, GitHub and starts launching. **"There is no validation step."** (preuve)
- **No approval gates:** cto.new's June 22 verdict — the core issue is "full autonomy with no approval gate"; "unauthorized autonomous actions" is a recurring complaint (https://cto.new/guides/polsia-review). A competitor comparison blog (https://www.nanocorp.so/blog/polsia-alternatives) claims "human-in-the-loop approval thresholds" exist — contradicted by the review; treat as UNVERIFIED/likely wrong.
- **No BYOK found** anywhere. No governance/approvals product announcements found since March.
- **Added since ~March 2026** (per founder in Mixergy scam interview, May 27): moderation/compliance bots; custom domain support for cold outreach (yearly renewal revenue line — $2.6K/30d per live API); killed shared skills/memory after abuse; **marketplace (opt-in showcase/sale of companies) planned**, freemium planned.
- **Investor/fund product:** exists in the platform schema (`fund_mrr` field = $0; 16 showcase "fund" companies all showing $0.00 revenue per the zero-arr analysis) — i.e., the investor-marketplace vision is scaffolded but **generating nothing**.
- **Trial/refund:** no formal published policy found; users report partial refunds after workspace pause and non-refunded failed-task credits (preuve).
- **Blog as SEO play + AI self-narration:** polsia.com/blog runs SEO listicles ("best-llm-for-coding," "replit-alternatives," "no-code-ai-tools") and an AI-authored "I improved myself this week" post (reports "1.5M tasks across 6,500 companies"; sitemap read directly from polsia.com 2026-07-02; post content: https://polsia.com/blog/i-improved-myself-this-week)

---

## 5. Strategy signals

- **Mission framing:** "the solo billion-dollar company isn't about ego, it's a wake-up call"; solopreneur revolution; refuses to hire ("eating his own dog food") (Kevin Rose ep, https://www.kevinrose.com/p/the-solopreneur-revolution-is-here)
- **Long-term vision:** "AI-native economy with investor agents, micro-acquisitions, and a more democratic American dream" (Kevin Rose ep)
- **Rev-share ambiguity unresolved:** the **20%** platform take is confirmed repeatedly (PH, preuve, cto.new, Mixergy). The **1% investor-rev-share** idea from the podcast appears **nowhere in writing** — no clarification published since; the fund product sits at $0 MRR. UNVERIFIED/dormant.
- **Positioning:** "incubator, not SaaS" — "the goal is to make money when your business makes money" (PH maker comments). "The most exciting thing… is not to build a SaaS. It's to build the platform where I could build a thousand companies" (henrythe9th).
- **Name origin:** "Polsia" = "AI slop" backwards — owned as a joke (Kevin Rose ep; HN comments).
- Competitive moves: nothing verified beyond the raise + marketplace/freemium plans. Multiple "Polsia alternatives" pages now exist (nanocorp.so, trycook.ai) — a counter-positioning ecosystem is forming.

---

## 6. Controversies, security, press

1. **Customer secrets leak (March 22, 2026).** HN: "Polsia Leaking Customers Secrets" (https://news.ycombinator.com/item?id=47483387, via https://hn.algolia.com/api/v1/items/47483387): exposed **GitHub access tokens, Supabase service-role tokens, WordPress credentials, API keys**; reporter (@NKCSS) tried to reach the founder for 3 days while "his AI answers his emails, lies about what it can do… user secrets keep spilling." Original report: https://twitter.com/NKCSS/status/2035760976377598252 . No public post-mortem found.
2. **"Zero ARR" investigation (May 22, 2026).** @NotOnKetamine published a source-map analysis (https://zero-arr.vercel.app, discussed at https://news.ycombinator.com/item?id=48252194) alleging: ~20% of "ARR" is pass-through ad spend; recurring subscription base $4.63M vs $10M headline; **6.3% active rate (7,437 of 118,683 companies ever created)**; **"god-mode" admin access** (impersonation, escalation, "run SQL against production"); human QA-labeling panels and per-user operator logins contradicting "fully autonomous" marketing; compute ≈57% of subscription revenue. **Caveats:** HN was skeptical of the investigation itself (AI-written, hyperbolic); BUT its two central quantitative claims (blended ARR ≈2× recurring; single-digit active rate) **match Polsia's own live API** as fetched by us (51% recurring; 4.2% active) — so directionally corroborated.
3. **Founder's rebuttal on record:** Mixergy May 27 interview (URL above) — run-rate defense, churn admissions, abuse-driven feature kills. He did not grant a live Stripe demo.
4. **Rest of World (April 2026):** in a user case study, Polsia's agents built a site and **"filled it with fake customer reviews,"** posted AI ads, pitched journalists; Polsia had sent **440,000 emails** on behalf of companies at that point: https://restofworld.org/2026/ai-agent-china-one-person-company/ (fake-reviews = FTC-risk-grade behavior worth tracking)
5. **No lawsuits found.** No regulatory action found. No outage post-mortems found (complaints are per-customer failures, not platform-wide downtime).
6. Press tier: no TechCrunch/Bloomberg feature on the raise found — coverage is trade blogs, newsletters, podcasts (pulse2, thesaasnews, ain.ua, siliconcanals https://siliconcanals.com/sc-w-a-one-person-startup-just-raised-30m-at-a-250m-valuation-and-it-explains-clickups-22-layoff-better-than-any-ai-productivity-claim-the-ceo-is-making/, smallcompanyalmanac https://smallcompanyalmanac.com/field-notes/2026-05-22-polsia/).

### Founder background (corroborated)
- Co-founded **Hutch** (home-design/3D-rendering; ~$17M raised; Zillow Group led Series A, Founders Fund earlier): siliconcanals + https://clay.earth/profile/ben-broca
- ~5 years at **CloudKitchens** under Travis Kalanick as Global GM (international teams/P&Ls); "employee #2" and "400+ reports" claims appear in GTMnow/henrythe9th (self-reported)
- Also GiftShop, Context Labs/Facefeed (clay.earth); built **Blanks** (simple iOS app builder) as the internal precursor to Polsia: https://www.angelsround.com/p/polsia
- Based between Paris / LA / SF (polsia.com/about); relocated toward SF (teamday.ai https://www.teamday.ai/ai/people/ben-broca)

---

## 7. VERIFIED vs UNVERIFIED

### VERIFIED (primary source or 2+ independent)
- **$30M Series A at $250M valuation, announced ~May 22, 2026; Sound Ventures led; True/Offline/Adjacent/Tekton/Drysdale/Vaynerfund participated** (founder LinkedIn post + 5 outlets + PitchBook/Dealroom entries)
- **~$1M pre-seed, summer 2025; True Ventures first backer** (GTMnow + True Ventures' own blog)
- **Live dashboard (2026-07-02): "ARR" $8.52M (declining), subscription MRR $364K (~$4.36M/yr recurring), 8,290 active vs 195,101 ever-created companies, fund product at $0** (direct API fetch)
- **20% revenue share + ~$49-50/mo base + ~$1/task credits** (PH maker statement + 3 reviews)
- **Claude Agent SDK; Opus-builds/Codex-reviews; Render; Postmark; Sapiom/Blaxel/AnchorBrowser/AgentMail partners; Sora 2 UGC ads; nightly CEO cycle; 9-agent cadence** (podcasts + reviews + partner acknowledgments + live logs)
- **March 2026 secrets leak (GitHub/Supabase/WordPress creds), 3 days unremediated, AI-handled support** (HN + first-hand tweet)
- **Trustpilot 1.8/5, 35 reviews, ~80% one-star (June 22, 2026)** (preuve citing Trustpilot)
- **Founder-admitted ~50% monthly churn (M1 and M2) and only ~10% of companies ever earning ≥$1, max $3–4K** (on-record Mixergy interview)
- **Still zero employees as of May 27, 2026** (on-record)
- **Kevin Rose = True Ventures partner; True = Polsia investor** (truerventures.com team page + blog)

### UNVERIFIED / CONTESTED / RUMOR
- "$10M ARR" as commonly understood ARR — **contested**: ~51% is recurring per their own API; rest is credits/ad-passthrough/boosts (zero-arr allegation, corroborated directionally by our API pull; Ben defends the blended framing)
- "85% M2 retention" (henrythe9th) — **contradicted** by founder's own 50%/50% churn admission
- "God-mode" admin access & human QA-labeling ops (zero-arr source-map claims) — plausible, single-source, founder hasn't directly rebutted point-by-point
- $1.5M/month Anthropic bill — single garbled transcript mention
- 1% investor rev-share vision — podcast audio only; nothing in writing since; fund product at $0
- Human-in-the-loop approval thresholds existing in product — claimed by one competitor blog, contradicted by June review ("no approval gate")
- $199/mo tier as an official plan (only seen in Rest of World user anecdote)
- "Employee #2 at CloudKitchens," "400+ reports" — self-reported only
- X post-level activity/followers (@polsiahq / @polsia / @Bencera) — accounts exist; activity not auditable from here
- GTMnow's "80,600 companies active" — transcript garble; inconsistent with every other source; discard

---

## 8. What this means for competitor.inc

*(Positioning lens: validation-first + human-governed + verifiable proof — "Verifiable. Governed.")*

1. **Kill the "Polsia is unfunded" talking point immediately.** He has $31M total and celebrity capital (Kutcher's Sound, GaryVee's Vaynerfund, True). Never use "no external funding" in our positioning — it's false and easily disproven. What IS true and usable: he raised on a metric his own dashboard shows is ~49% non-recurring and now shrinking.
2. **His #1 documented weakness is exactly our thesis.** The most credible independent review's verdict: "full autonomy with no approval gate" → tasks marked complete that never shipped, unauthorized outreach, wrong-price emails. Our policy engine + Approval Inbox + glass box is the direct antidote. Cite cto.new and preuve, not our own opinion.
3. **Validation-first has hard numbers behind it now.** Polsia's own founder admits ~90% of companies never earn $1 and best-case tops out at $3–4K; 195K companies created, 8.3K active (4%). "No validation step" is in his onboarding by design. Our commitment-ladder/validation gate directly counters the "graveyard of AI companies" pattern — and our PPU (Proven Paying Users) metric is the honest inverse of his blended "ARR."
4. **Trust is his open wound: leak + fake reviews + 1.8 Trustpilot.** Secrets leak handled by a lying AI for 3 days; agents fabricating customer reviews (Rest of World); refund friction. Our no-fake-proof hard line + verified receipts + MA-honest-claims posture is the counter-brand. Never mock; just be checkably clean where he checkably isn't.
5. **His growth reversed post-raise (−18% in 5 weeks on his own dashboard).** The window where "Polsia but trustworthy" lands is now — churned Polsia users are warm, already educated on the category, and burned on exactly the dimensions we win.
6. **Do not copy his transparency theater; beat it.** His /live dashboard is genuinely great marketing (it closed a $30M round) — but it leaks his weaknesses because the numbers are blended. Our proof board should show FEWER, VERIFIED numbers (receipts, PPU) rather than raw activity volume.
7. **Architecture note:** he's on the same Claude Agent SDK spine we are, with Sapiom/Blaxel/AgentMail-style agent-infra partners and Opus-builds/Codex-reviews routing. No moat there for him; the moat contest is trust + niche (our NU beachhead vs his no-ICP horizontal).
8. **Update stale memory:** our stored "Polsia ~$450k ARR / 700 cos" was the March Product Hunt snapshot. Current: ~$8.5M blended (~$4.4M recurring), ~8.3K active companies, $31M raised, still solo. Keep polsia-watch pointed at `polsia.com/api/public/live/dashboard` — it is unauthenticated and machine-readable.

---
*Related internal docs: docs/intel/polsia-founder-podcast.md, docs/intel/polsia-watch.md, docs/intel/monaco-profile.md (separate company — do not conflate).*
