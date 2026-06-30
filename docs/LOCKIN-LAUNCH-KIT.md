# Lockin — Launch Kit (ready to publish)

**Live app:** https://competitor-inc-zeta.vercel.app/lockin
**What it is:** a dead-simple daily focus app for solo makers — pick your ONE thing, lock in with a
timer, log the win, keep the streak. Free, no login, data stays in the browser.
**Signup:** real capture wired to `/api/interest` (app=`lockin`). Persists once Supabase is configured
in prod; you read signups in the Supabase Table Editor (`interest` table) and get an email per signup.

> **Honesty note:** every post below is drafted and ready — but I do not post them. Publishing to a
> channel is a human action (your accounts / your approval). I will never fabricate a signup; the 10
> real explorers come from one of these going live. Pick one channel, paste, post. ~5 minutes.

---

## How the 10 real signups happen (the only honest path)
1. **Confirm Supabase is live in prod** (so signups persist + you can see them). Apply
   `supabase/migrations/0005_interest.sql` if not already. *(B0 dependency.)*
2. **Pick ONE channel below**, paste the draft, post it. Personal share to ~15 friends/makers is the
   highest-converting (warm > cold, per the GTM playbook).
3. Reply to every comment in the first 2 hours (that's what decides reach on HN/Reddit).
4. Watch the `interest` table fill with real signups. When it hits ~10, that's your green light to
   reach out to the wider set of people.

---

## Distribution order (evidence-based, from the GTM brief)
Warm first → then communities → directories → Product Hunt last.

### 1. Warm DM (highest conversion — send to ~15 maker friends)
> Built a tiny thing this weekend — Lockin. It's one screen: pick your one thing for the day, hit a
> focus timer, log the win, keep a streak. No login, free. Would love 60 seconds of your brain on it:
> https://competitor-inc-zeta.vercel.app/lockin — does the "one thing + streak" loop actually make you
> want to come back tomorrow?

### 2. r/SideProject (430k — "I built this" is welcome here)
> **Title:** I built a one-screen daily focus app for makers — pick your ONE thing, lock in, keep the streak
>
> I kept drowning in 20-item to-do lists and getting nothing meaningful done, so I built the opposite:
> Lockin shows you one screen. You write the single thing that would make today a win, start a 25-min
> focus timer, log what you got done, and it tracks your streak. No login, free, data stays in your
> browser.
>
> Live: https://competitor-inc-zeta.vercel.app/lockin
>
> Genuinely want feedback on one thing: does the streak make you want to come back tomorrow, or is it
> gimmicky? Brutal honesty welcome.

### 3. r/getdisciplined / r/productivity (lead with the idea, not the link — read each sub's rules)
> Lead a comment/post with the *method* ("the one-thing + streak ritual that finally worked for me"),
> share what you learned, and link the tool only if the sub allows it / someone asks. 90% value, 10% ask.

### 4. Show HN (if you want the technical crowd)
> **Title:** Show HN: Lockin – pick your one thing, lock in, keep the streak
>
> **Body:** A single-screen daily focus app for solo makers. No login, no account, no tracking — it's
> one static page with localStorage. Pick the one thing that makes today a win, run a focus timer, log
> wins, keep a streak. Built it because every productivity app I tried did too much. Feedback on the
> core loop welcome. https://competitor-inc-zeta.vercel.app/lockin
>
> *(Post Tue–Thu ~8–10am ET. Reply to every comment in the first 2 hours. Never ask for upvotes.)*

### 5. X / #buildinpublic (your account)
> Made a tiny thing: Lockin 🔒🔥
> one screen. your ONE thing for the day → lock in with a timer → log the win → keep the streak.
> no login. free. that's the whole app.
> https://competitor-inc-zeta.vercel.app/lockin
> what would make you open it again tomorrow?

### 6. LinkedIn (your account)
> I kept confusing "busy" with "productive," so I built the smallest possible antidote: Lockin.
> One screen. One priority. A focus timer. A streak. Nothing else.
> Free, no login: https://competitor-inc-zeta.vercel.app/lockin
> If you're a maker who lives in a 30-tab to-do list — I'd love to know whether one-thing-a-day feels
> freeing or too minimal.

### 7. Directories (SEO + intent traffic — submit later)
BetaList, Uneed, MicroLaunch, Peerlist, StartupFa.me, Fazier. Submit after a couple of the above land.

### 8. Product Hunt — LAST
Only after you've built a small launch-day list from the above. Per the playbook, PH is not a cold
firehose for a no-audience maker.

---

## Reading your results
- Signups: Supabase → Table Editor → `interest` (filter `app = lockin`), or `GET /api/interest?app=lockin`.
- The app itself reports exploration locally (streaks/sessions) but, by design, sends nothing without a
  signup — so the only number that reaches you is real signups.
