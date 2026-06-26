# Playbook — GTM research & niche validation (competitor.inc's *own* go-to-market)

> Closes a real gap: the product's Validation Gate validates a *customer's* idea, but nothing validated
> **competitor.inc's own** niche/positioning. This is that workflow. Beachhead is **locked**:
> **first-time / student & new-grad founders** (a WHO, not a vertical — see [POSITIONING.md](POSITIONING.md)).
> Playbooks: Crossing the Chasm (beachhead), Bullseye/Traction (channels), Sean Ellis 40% (PMF),
> 7 Powers (counter-position).

## 1 · The ICP, sharply
- **Who:** someone building their *first* real company — students, new grads, career-switchers, indie
  first-timers. Often technical-enough-to-try but never shipped/sold before.
- **Job-to-be-done:** "Tell me the truth about my idea before I waste my savings — then help me actually
  build and run it, without me getting fleeced or losing control."
- **Why us for them:** validate-first + proof (Glass Box) + 0% + human-in-control lands hardest on people
  who've never done it. Incumbents (Polsia, Result) chase broad/experienced operators — the first-timer is
  underserved.
- **Where they gather:** campus orgs + **NU IDEA/Sherman**, r/startups, r/SaaS, IndieHackers, student
  Discords/Slacks, build-in-public X/TikTok, hackathons, accelerator waitlists.

## 2 · Channel hypotheses (Bullseye — test ~5, keep the 1–2 that convert)
Founder-led short-form (the honesty-reveal reels) · campus + accelerator networks (warm) · comparison/SEO
("honest alternative to [broad tool]") · founder DMs to first-timers in the communities above · one tiny
gated paid test. Measure cost per signup→activated.

## 3 · The niche PMF gate (Sean Ellis 40%)
Survey *first-time-founder* users only: "How would you feel if you could no longer use competitor.inc?"
**≥40% "very disappointed" within this segment → PMF in the niche; scale.** <40% → fix the product/message
*for this ICP* before spending.

## 4 · The metric that defines validation (leverage ratio)
At the milestones (2,000 waitlist + ~$10K MRR), measure **what % of the work the agents did vs the founder.**
≤~20% human = the autonomy thesis is validated. (Instrument from day one — see [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md).)

## 5 · The weekly loop
Reuse the **competitor-watch job** ([intel/polsia-watch.md](intel/polsia-watch.md)) + a weekly niche review:
new first-timer signups by channel, signup→activated→paid, the 40% reading, and the leverage ratio. Kill
losing channels; double down on winners.

## 6 · Who runs it
- **Now:** Apex (strategy) + Quant (instrumentation) own it manually; the daily job feeds competitor intel.
- **Later (post-launch build):** a dedicated **"Scout"** research role (extend the `AGENTS` map in
  `lib/roomie/types.ts` + `lib/roomie/delegation.ts`) that runs niche + competitor research and reports —
  approval-gated like every other agent.

**Honest note:** this validates *our* niche; it's separate from the user-facing Validation Gate. Keep them
distinct in code + copy so we never conflate "we validated our market" with "we validated a customer's idea."
