# ADR-0008 · The Viktor-structure marketing layer (workforce pages + Live moves to Slack)

Date: 2026-07-18 · Status: accepted

## Context

Founder directive (2026-07-18): the public website becomes a **showcase + discovery layer**, and the
operational experience ("Competitor Live") moves into Slack — the office (ADR-0005) is where the
company is watched working, not a web dashboard. For structure, we studied viktor.com's marketing
site and are borrowing its **structural ideas only** — no copied text, no copied visuals, our
branding and our honesty floor throughout. The ideas borrowed:

- one big promise per section, one relentless CTA repeated;
- an early **counted** proof strip, and case-study-format receipts later;
- a numbered 3-step "how it works";
- a capability showcase and a "works while you sleep" proactive framing;
- workspace-native positioning ("no new app to learn") — which for us is literally true: the office
  is Slack;
- comparison → FAQ → big final CTA, in that order.

What we do NOT borrow: their numbers, their claims, their copy. Our honesty floor
([[crack-audit-and-no-fake-proof]], ADR-0006) is unchanged and non-negotiable: no invented metrics,
users, logos, or testimonials; $0 settled revenue shown proudly; simulation results always labeled
"proven in simulation."

## Decision

**1 · `app/page.tsx` restructured** into the borrowed flow, monochrome brutalist (white / #0a0a0a /
hairlines / mono uppercase labels / square inversion-hover buttons / heavy display, no color, no
emoji): hero ("Start free", honest BYOK trust line) → counted proof strip → three steps (kept from
ADR-0006) → workforce showcase → Competitor-Live-in-Slack → receipts → the honest comparison (kept) →
FAQ → final CTA → footer.

**Every number on the page is computed at render, never authored:**
- failure drills (`passed/total`) — `runFailureDrills()` (lib/sim/failure-drills.ts; the test suite
  enforces 6/6);
- safety gate (`passed/checks.length`) — `readiness()` (lib/core/readiness.ts; tests enforce 8/8);
- workforce counts — `orgSize()` / `DEPARTMENTS.length` (lib/org/organization.ts);
- $0 settled revenue — the standing hardcoded honesty-floor figure (ADR-0006 rule: only ever updated
  from real settled receipts).

The receipts section renders the six drill results as case cards (real computed output, labeled
"simulation") because **no customer case studies exist yet and we don't invent any**. The claimed
"2 live builds · $0.13/build" numbers were checked and found unverifiable as receipts in this repo
(the ~$0.13 figure is a cost *cap estimate* in lib/engine/house-trial.ts, not a measured receipt) —
so they are **not** claimed anywhere.

**2 · The Slack CTA is one honest switch** — `lib/core/slack-invite.ts`: `slackInviteUrl(env)` reads
`NEXT_PUBLIC_SLACK_INVITE_URL` (documented in .env.example, non-sensitive); `liveCta(env)` returns
`{ href, label, live }` — the real invite labeled "Join the Slack" when configured, else `/join` (the
waitlist) labeled "Get your Slack invite." Every "Join the Slack" button on the site renders from it;
no dead links, no fake doors. Tested for both states.

**3 · `app/live/page.tsx` displaced.** The old page rendered the visitor's own localStorage demo data
as a "live board" — retired with the Live→Slack move. The new page is a single clean "Competitor Live
now lives in Slack" showcase: what each channel shows (#engineering deliberation, #decisions as the
human's queue, department channels), the shared monochrome Slack-thread mock (CSS, captioned
"illustrative, not a production message log"), and the `liveCta()` CTA. No dead functionality kept.

**4 · `app/org/page.tsx` rebuilt as the visual hierarchy:** THE HUMAN on top (the only human — signs
money, contracts, launches) → the Chief of Staff (validateOrg's single root) → the 8 departments as
expandable cards → all roles nested by their **real reporting edges** (a department's top nodes are
its roles managed from outside it — this preserves cross-department lines like Support → Customer
Success Manager). Everything derives from lib/org/organization.ts; counts are never hardcoded. The
expand/collapse lives in a small client island (components/OrgChart.tsx); deep links (/org#engineering)
auto-expand.

**5 · `app/org/[id]/page.tsx` (new)** — one statically generated page per role
(`generateStaticParams` from ROLES, `dynamicParams=false`): mandate + JD **verbatim from code**,
responsibilities, KPIs (with the counter-metric note), the human line (escalation + always-human
acts), the SOP where one exists in lib/org/sops.ts (labeled "Standard operating procedure"; for roles
without one, an "Illustrative workflow" derived from responsibilities and labeled as derived),
collaborators from the real tree (manager + direct reports + department peers), and "Tools it uses" =
CONNECTION_MAP entries whose `department` matches the role's execution function plus the model key —
framed honestly as *what the platform wires for that department*, not a usage log.

**6 · Shared chrome** — components/SiteHeader.tsx + SiteFooter.tsx (Home · Workforce · Live in Slack ·
Proof · Connect · Services · notices + the badge) used by /, /org, /org/[id], /live. The Slack-thread
mock (components/SlackThreadMock.tsx) is shared by / and /live; its message content is written from
the real role rules (who reviews, who certifies, what is Tier 3) and captioned as an illustration.

## Consequences

- The landing runs `runFailureDrills()` + `readiness()` at render (statically, at build). If a drill
  ever fails, the page **shows the failure** (e.g. 5/6) — the proof strip is honest by construction,
  and `npm run qa` fails first anyway (the tests assert 6/6 and 8/8).
- 56 role pages are statically generated. Adding/removing a role in organization.ts automatically
  adds/removes its page, its org-chart node, and every derived count — the site cannot drift from the
  org model.
- The old /live localStorage board is gone; /proof still links to /live, which now correctly explains
  the Slack office. The Stream (/dashboard) remains the app surface — the site stays showcase-only.
- `NEXT_PUBLIC_SLACK_INVITE_URL` must be set **non-sensitive** on Vercel when the workspace opens
  (the standing inlining gotcha); until then every Slack CTA routes to /join honestly.
- Smoke sweep extended: /org/chief-of-staff and /org/data-steward (an SOP-bearing leaf) must return 200.
