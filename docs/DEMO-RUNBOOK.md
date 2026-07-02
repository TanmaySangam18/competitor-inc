# Demo Runbook — networking event (2026-07-02)

Everything below runs **offline-first from your laptop**. No accounts, no sign-in, no cloud needed —
the product's simulated engine + localStorage architecture is the whole trick. Live site is the backup.

## Before you leave (10 minutes, tonight)

1. `cd ~/competitor-inc && npm run dev` → open http://localhost:3000 → confirm it loads. Leave the
   terminal command in your shell history so it's one ↑-Enter at the event.
2. **Optional but great (your 2%):** put your Anthropic key in `.env.local` →
   `MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=sk-ant-…` → restart dev. Chat + validation then run
   on REAL Claude (Opus 4.8/Haiku 4.5 routing) instead of the simulated engine. Demo works fine
   without it — the simulated engine is honest about being an estimate.
3. Charge the laptop. Set up phone hotspot (only the Demand Radar needs internet — everything else is offline).
4. Do one full dry run of the 5-minute script below. Twice is better.
5. Reset for a clean slate before the event: DevTools → Application → Local Storage → clear
   `localhost:3000` (fresh onboarding beats stale demo data).

## The 5-minute script

| Min | Do | Say |
|---|---|---|
| 0:00 | Landing page → click **Play the film** (#film) | Say nothing. Let the 45s film do the pitch. It plays offline. |
| 0:50 | Nav → **Compare** | "We don't claim we're better — we scored it, with receipts. Every competitor cell is their founder's own public words." Flip the **weights toggle**: +60% → +97%. "Around 75% better, depending on what you weight — and here are the two rows they beat us on." (Showing the losses is what makes people believe the wins.) |
| 1:45 | Nav → **Meet your co-founder** → type a real idea (e.g. "an app that matches student founders with technical co-founders at Northeastern") | "Everyone else builds first. We validate first." |
| 2:00 | **Demand Radar auto-runs** (needs hotspot) | "This is live — Hacker News, StackExchange, GitHub, right now. Every source is clickable. Try that with any other AI-company tool." Click a source link. |
| 2:45 | Validation Gate → **Approve build** | "And if the signal were weak, it would tell me *don't build* — that's the product." |
| 3:00 | Operations tab: Glass Box, **Approval Inbox** (approve one, show Copy-post on a social draft), GTM plan panel, "Why?" rationale on an activity | "It runs nightly. But nothing consequential — no spend, no outreach, no deploy — happens without my yes. Every action is logged with proof. One-click undo." |
| 4:00 | **Run tonight's shift** → watch activities land → History tab → **Demand tracker** | "The north star isn't signups — it's demand evidence and receipts." |
| 4:30 | Back to dashboard → **"Built it. Can't sell it?"** panel → paste any live site (their startup's, if they have one!) | "And if you already built something on Replit or Bolt that isn't selling — paste it. The crew's whole job becomes getting it customers." ← *This is the killer close with founder audiences: audit THEIR site live.* |

## If someone pushes back

- **"75% better? Says who?"** → /compare: "Fair question — the number is computed from that table, live. Change the weights yourself. Every competitor data point is their founder on camera or on Product Hunt; sources are linked. And we show the rows they win."
- **"Is that revenue real?"** → "We don't show fake numbers anywhere — that's the founding rule. The proof standard is at /proof: real repo, real URL, real metric, or we say 'estimate'."
- **"What's the AI?"** → "Claude — Opus 4.8 for the engineering/CEO agents, Haiku for the lighter roles. Swappable by design; bring your own key if you want."
- **"How is this different from Polsia?"** → "They run your company while you sleep. We wake you up before you waste your savings — validation-first, human-governed, receipts for everything. And it's on the compare page, with citations."

## Failure modes & fallbacks

| Problem | Fallback |
|---|---|
| Event WiFi dead + hotspot dead | Everything except Radar still works offline. Say: "Radar scans live sources, so it needs signal — here's the validation gate it feeds" and continue. |
| Laptop dies / dev server breaks | Live site: **https://competitor-inc-zeta.vercel.app** — identical demo (film, /compare, dashboard all deployed). |
| Someone wants to try it themselves | Hand them the live URL. Free, no signup (guest mode). |
| Radar scan slow on hotspot | It broadens queries progressively — narrate: "it's crawling three sources live" — worst case ~10s. |

## What NOT to say (the honesty lines that protect you)

- Never quote a revenue/user number we don't have. We have 3 waitlist signups; say "pre-launch" if asked.
- Don't say "world's first" anything. Say: "the AI co-founder that proves it before it builds it."
- The film + compare page contain only claims that are true of the shipped product — stay inside them and you can't be caught out.
