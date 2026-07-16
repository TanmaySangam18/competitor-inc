# CONNECT-FIRST RESET — the platform is connections + a decision feed, not a dashboard

Founder direction (2026-07-15): *"You connect your company's accounts once. The AI builds, runs,
improves, and scales the company. The user oversees the business instead of operating it."*
The product should feel like hiring an autonomous executive team, not like software you manage.
Reference posture: Bloome's agents-as-teammates-in-conversation — but ours actually OPERATES the business.

## Why the dashboard paradigm is structurally wrong for this

Every tab is another camera pointed at the same company state (proof: the "Needs your OK" band and
the Team board's "Awaiting your yes" column are the same queue, rendered twice). A dashboard assumes
the human drives. Our thesis is the opposite: the org drives; the human signs. Therefore the product
surface must be shaped like an INBOX + a LEDGER, not like an instrument panel.

## 1 · THE CONNECTION MAP — everything a software company runs on

Onboarding = connecting these. Each is BYOK (customer's account, customer's ownership — the standing
model). Tiered by when the company actually needs it; the org runs degraded-but-honest with any subset,
and ASKS for the next connection only when a task truly needs it.

**T0 · The brain + hands (day one, required)**
1. AI model key (Anthropic / OpenAI / Groq) — cognition
2. GitHub (repos, Actions) — where software gets built
3. Vercel (or Cloudflare Pages) — where software runs
4. Database: Supabase / Neon (per-product data, RLS isolation)

**T1 · The voice (first week — the company becomes conversational)**
5. Slack workspace (the OFFICE: agents deliberate in channels 24/7; the human is @-tagged only on real decisions)
6. Email domain sending: Google Workspace or Resend/Postmark (support@, reports, receipts)
7. Domain registrar (Cloudflare / Namecheap / Vercel Domains) — legal domains only (standing rule)

**T2 · The money (before the first sale)**
8. Stripe (or Polar as MoR) — charging customers
9. Banking/accounting readout: Mercury / QuickBooks / Stripe Tax (finance agents' ground truth; READ + report, never move funds — T3 human-only floor stands)

**T3 · The senses (as the business grows)**
10. Analytics: our first-party pixel (exists) + optional GA4/PostHog
11. Error/uptime: Sentry + a ping monitor (incident loop input)
12. Customer support inbox: shared mailbox or Plain/Intercom (support agents answer; escalate on policy)
13. CRM: Attio/HubSpot — or our own substrate table first (sales agents' pipeline)
14. Calendar: Cal.com (sales agents book real meetings — already decided in the sales stack)
15. Social: Bluesky / Mastodon / X / LinkedIn (marketing agents post to the customer's OWN opted-in audience — never scraped graphs)
16. Ads (optional, capped): Google/Meta — spend caps + tier gates apply
17. Cloudflare (DNS/CDN/WAF) where not covered by the registrar

Registry lives in `lib/core/connections.ts` (exists — extend from ~6 to this full map, each with:
scopes needed, what the org can do without it, which department consumes it, and the honest
degradation line shown when absent).

## 2 · THE PRODUCT — three surfaces, total

1. **/connect — the onboarding and the "settings."** A single page: the connection map as a checklist
   with live status (green = connected, grey = not yet + "what unlocks"). Connecting T0 starts the company.
   Nothing else to configure. (Exists as a status page; becomes THE front door.)
2. **The Feed — the only operating surface.** One reverse-chron stream per company: decisions awaiting
   signature (the ONLY interrupts), completed-work notices ("bug fixed, tested, deployed — here's the
   diff + the receipt"), and delivered artifacts (the finance PDF, the weekly report). Filter: All ·
   Needs me · Done. The settled-revenue number sits at top (the one metric). Everything the 6 tabs
   showed becomes either a Slack conversation (process) or a feed item (outcome).
3. **The website — explains, simply.** What happens after you connect, in plain terms + the live
   /benchmark proof. No feature tour of pages that no longer exist.

The human's day: read the feed (or just Slack) · sign what's queued · everything else already happened.

## 3 · WHERE THE WORK LIVES — Slack is the office

- Channels per department (#eng, #growth, #sales, #support, #finance) + #decisions (mirrors the queue).
- Agents talk to EACH OTHER there (deliberation engine, task #72 — this reset makes it the spine, not a feature).
- The human is @-mentioned ONLY on tier-gated decisions (money, contracts, launches, deletion) — the
  same `decide()` floor that already governs everything.
- No Slack connected? The feed alone carries everything (email digest optional). Honest fallback.

## 4 · THE AUTONOMOUS LOOPS (the org's job, per the examples)

- **Incident loop:** Sentry/monitor event → eng agents triage in #eng → root-cause → if within tier:
  fix → regression wall → staging → deploy → feed item "fixed + receipt". Above tier: one @-mention.
- **Support loop:** inbound mail → support agent answers from the product's grounded data (cite-or-abstain,
  exists) → escalates on policy triggers only.
- **Finance loop:** on request or monthly — read Stripe/Mercury, render the PDF report, deliver to the feed + email.
- **Growth loop:** experiments proposed → capped spend auto-runs / over-cap queues → results to the feed. (Engine exists.)
- **Sales loop:** source (Explee) → qualify → sequence → Cal.com booking → human joins the call. (Stack decided.)
- **Always-on:** the daily org-run cron becomes a denser scheduler (hourly ticks + event-driven webhooks);
  "24/7" is honest as event-driven + scheduled, not a marketing fiction about continuous inference.

## 5 · WHAT THIS KILLS (delete forever, when greenlit)

- The dashboard-as-cockpit: all 6 tabs. Activity→the feed · Brief→the morning digest (Slack/email + feed
  item) · Team→#channels in Slack · Sell→the growth/sales loops' feed items · Chat→Slack (or feed reply
  box as keyless fallback) · Knowledge→"why?" link on every feed item (same rationale data).
- The engine's "hit Run" button — replaced by the scheduler. The human never operates; they oversee.

## 6 · HONEST STATUS (what exists vs what's new)

Already real: policy gates/tiers/kill switch/audit ledger · decision queue + /decisions (DB-backed) ·
Slack + Telegram webhooks · build→deploy→verify pipeline + change desk + regression wall · grounded
support answers · growth engine + pixel · connections registry (seed) · benchmark. 
NEW builds: the Feed surface · connection-map expansion + OAuth flows per service · Slack channel-per-dept
+ agent-to-agent deliberation (#72) · incident + finance + support loops wired to real webhooks · the scheduler.
Sequence: Block A the Feed (replaces dashboard) → B connection map + degraded-mode asks → C Slack office →
D the loops (incident, finance, support) → E website simplification.

## 7 · THE ONE DECISION

This deletes the dashboard the founder has been iterating on all week. Greenlight = "reset: go" and
Block A starts; the Metric-hero cockpit ships its parts to the feed (hero number → feed header;
approvals band → the interrupts; ticker → the feed itself).
