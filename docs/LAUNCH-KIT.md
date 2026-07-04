# competitor.inc — Go-to-Market (Launch Kit + Ad Campaign)

_One doc: **Part I — Launch Kit** (the ~15-min launch, copy-paste posts) and **Part II — Full Campaign**
(the $0 organic engine + the paid-ready ad set). All copy is honest — no fabricated metrics, no "trusted
by N founders" (we have none yet). The angle is the live demo + the contrarian honesty: an AI co-founder
that will tell you NOT to build. Written by the AI exec team; the founder publishes (identity + voice = yours)._

# PART I — LAUNCH KIT

---

## 0. Flip to live (the 3 founder actions) — ~15 min

1. **Run the pending migrations** — one paste: open `supabase/migrations/LAUNCH_BUNDLE_0016-0020.sql`,
   copy all, run it in Supabase → SQL editor. It bundles `0016_landing_demo_events` ·
   `0017_scorecard_and_digests` · `0018_business_wallet` · `0019_demo_cta_event` (finalizes the events
   type CHECK) · `0020_build_in_public_consent`, in order, all idempotent (safe to re-run).
2. **Open crawling:** set `NEXT_PUBLIC_SITE_PUBLIC=1` in Vercel env → redeploy. (robots flips from
   Disallow-all to allow; the sitemap/FAQ/canonical work starts indexing.)
3. **Publish one post** below (start with Show HN or the niche subreddit — warmest, highest-intent).

Verify after: fire the hero demo on the live site, then check `/house/board` → Landing Funnel shows
`landed → ran demo` climbing, and a `demo_verdict` POST persists.

Free tier is live-safe today (validation is free forever). Paid flip waits on OPT — separate.

---

## 1. Positioning (the one-liner)
**competitor.inc — the AI co-founder that validates your idea before it builds it, and tells you the
honest truth: build it, tweak it, or kill it.** Watch a crew of five validate your idea live — no
signup. Every action logged with proof; nothing spends a dollar or sends a message without your yes.

---

## 2. Show HN
**Title:** `Show HN: An AI co-founder that will tell you NOT to build your idea`

**Body:**
> Most "AI builds your startup" tools rush you to a landing page and a bill. I wanted the opposite: a
> co-founder that validates demand first and is willing to say "kill it."
>
> You type an idea and a crew of five agents runs four demand experiments, scores them, and gives an
> honest verdict — strong / mixed / weak — with the reasoning. It's live on the homepage with no signup;
> the demo runs a deterministic engine in your browser so you can try it before trusting anything.
>
> The parts I care about: every action is logged with a cost and a proof artifact (a URL that resolves,
> a build result, a real metric) — no hallucinated "done." Anything consequential (spend, deploy,
> outreach) waits in an approval inbox. There's a Business Wallet so agents can only spend money you've
> funded, within caps you set, fully logged and attributable. And an honest-undo: it only offers "undo"
> where a real reversal exists, and says "can't recall" where it doesn't.
>
> It's free to validate. Feedback welcome — especially where the verdicts feel wrong.

_Then engage every comment for the first 3–4 hours (HN rewards founder presence)._

---

## 3. Product Hunt
- **Tagline:** `The AI co-founder that validates before it builds — and tells you the truth`
- **Description:** `Type your idea, watch a crew of five validate it live (no signup). Honest verdict with proof for every action, an approval inbox for anything consequential, and a business wallet that only spends what you fund. Free to validate.`
- **First maker comment:** lead with the contrarian bit — "most AI builders optimize for shipping fast; we optimize for telling you the truth, including 'don't build this.' The demo runs on the homepage with no signup — try to break the verdicts and tell me where they're wrong."

---

## 4. Reddit (r/SideProject or r/startups — read the rules, contribute first)
**Title:** `I built an AI co-founder that tells you NOT to build your idea — free demo, no signup`

**Body:**
> First-time founders (me included) waste months building things nobody wanted. So I built the tool I
> needed: you type an idea, a crew validates demand with real tests, and it gives an honest verdict —
> including "kill it." It's on the homepage, no signup, runs live.
>
> Not trying to sell — genuinely want feedback on whether the verdicts are useful or BS. Roast it.

_No links in the title; drop the link in a comment if the sub requires it. Reply to everyone._

---

## 5. X launch thread (6 posts)
1. Most "AI builds your startup" tools rush you to a bill. I built the opposite: an AI co-founder that validates demand first — and will tell you to kill the idea. Live demo, no signup 👇
2. Type an idea → a crew of five runs 4 demand experiments → an honest verdict (strong/mixed/weak) with the reasoning. It runs in your browser. Try to break it.
3. The honesty is the product. Every action is logged with a cost + a proof artifact — a URL that resolves, a real metric. No hallucinated "done."
4. Anything that spends money or posts publicly waits in an approval inbox. A Business Wallet means agents only spend what you fund, within your caps, fully logged. You stay the founder.
5. It even ships an honest "undo" — it only offers undo where a real rollback exists, and says "can't recall" for a sent email. No fake buttons.
6. Free to validate. If the verdict on your idea feels wrong, reply with the idea + what it said — I'll dig in. [link]

---

## 6. After you post (what the crew does automatically)
- Bluesky + Mastodon get a policy-checked heartbeat post from our own accounts (zero founder effort).
- Watch `/house/board` → **Landing Funnel**: it names the biggest drop-off step so we fix the right thing.
- I'll run the growth review off that data and propose the next experiment — no need to ask.

## Do NOT
- Don't claim user counts, revenue, or testimonials we don't have. The live demo + the honesty IS the pitch.
- Don't post the paid tier as the hook pre-OPT — lead with free validation.

---
---

# PART II — FULL CAMPAIGN ($0 organic + paid-ready set)

_Honest frame: **generating** creative + copy + targeting is $0. **Running paid ads** is not — Meta/
Google/X charge per impression. So this is (A) a complete $0 organic/earned campaign we can run today,
and (B) a paid-ready ad set loaded and waiting for the moment there's budget + OPT. AI (Groq, free)
writes the copy; creative is SVG/CC0 (no Montage, no license). No fabricated metrics._

## Core message (everything ladders to this)
**An AI co-founder that validates your idea before it builds it — and will tell you NOT to build.**
Proof over promises: live demo, no signup; every action logged with a receipt; your money only spent
on your yes.

**Hooks (A/B these across channels):**
- "Most AI builders rush you to a bill. This one tells you to kill the idea."
- "Watch an AI crew validate your startup idea — live, no signup."
- "It logs a receipt for every action. No hallucinated 'done.'"
- "Your AI co-founder can spend money — only what you fund, only on your yes."

## A) The $0 campaign (organic + earned — run this now)
1. **Owned (built, $0 forever):** SEO playbooks + FAQ rich results + sitemap → compounding search; the
   build-in-public auto-posts (Bluesky/Mastodon) → a live proof stream; the landing demo itself.
2. **Earned (launch moments — Part I above):** Show HN, Product Hunt, r/SideProject + r/startups, X thread.
3. **The GitHub $0 play:** GitHub is a free discovery engine for founder/dev tools. We don't open-source
   the product (proprietary); we ship a small **open-source lead magnet** that links back —
   `idea-validator` CLI/Action (scores an idea on the user's own Groq key) and `startup-playbooks` (our
   public playbooks as MIT markdown). Rich README + demo GIF + GitHub topics + `awesome-list` PRs +
   Marketplace listing. All $0, all compounding.
4. **Community (earned, $0):** answer real questions where our verdict is the value (Indie Hackers,
   r/startups, Discords). Contribute first, link last — never spam.

## B) The paid-ready ad set (loaded — spend when OPT + budget land)
AI generates/tests/iterates these on the **funnel we already instrument** (landed → ran demo → verdict
→ CTA → signup), spending strictly inside the Wallet's `ads` budget + approval. First test: small X +
Reddit-ads budget targeting founders (our ICP), NOT broad Meta/consumer.

**Ad variants (headline · primary · CTA):**
1. `Your AI co-founder will tell you not to build it` · "Type your idea, watch a crew of five validate it live — no signup. Honest verdict with a receipt for every action." · **Try the demo**
2. `Validate before you build` · "Most first-time founders build for months, then find nobody wanted it. Get an honest verdict in 60 seconds — free." · **See your verdict**
3. `An AI that spends only what you fund` · "Agents that build your startup — inside your caps, on your yes, every dollar logged. You stay the founder." · **Watch it work**
4. `Proof, not promises` · "Every action our AI takes ships with a receipt — a live URL, a real metric. No hallucinated progress." · **Try it free**

**Targeting:** first-time / indie / student founders; YC, Indie Hackers, no-code, startup subreddits;
lookalikes off signups once we have them. **Exclude** existing users.

**Creative:** monochrome "paper & ink" static ads produced as SVG (brand-matched, $0, no Montage).
Test 3 creatives × 2 hooks; kill losers at 48h on **cost-per-demo_start** (the funnel's top real metric),
never impressions.

## Measurement (already live)
`/house/board` → Landing Funnel (step conversion). Judge on cost-per-demo_start + demo→signup, not clicks.
The growth loop closes each ad "experiment" with an honest verdict and proposes the next.

## Sequence
1. Now ($0): launch (Part I) → GitHub lead-magnet → SEO/build-in-public compounding.
2. After first organic signals + OPT + a small budget: turn on the paid-ready set, one channel, small.
3. Scale only the channel that beats cost-per-demo_start. Demand-first, always.
