# competitor.inc — Launch Kit (copy-paste)

_Purpose: shrink the founder's launch to three actions + hitting publish. All copy is honest — no
fabricated metrics, no "trusted by N founders" (we have none yet). The angle is the live demo + the
contrarian honesty: an AI co-founder that will tell you NOT to build. Written by the AI exec team;
the founder publishes (identity + voice = yours)._

---

## 0. Flip to live (the 3 founder actions) — ~15 min

1. **Run the pending migrations** (Supabase → SQL editor, in order — all idempotent):
   `0016_landing_demo_events` · `0017_scorecard_and_digests` · `0018_business_wallet` ·
   `0019_demo_cta_event`. (Files in `supabase/migrations/`. 0019 finalizes the events type CHECK.)
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
