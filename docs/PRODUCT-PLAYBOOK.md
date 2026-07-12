# competitor.inc — Product Strategy & UX Playbook

> Canonical product spec (founder-adopted 2026-07-12). Approached cold, from first principles, after a
> competitive teardown. Category: **an autonomous AI team that builds *and operates* real software on a
> customer's behalf, under human governance** — vs. one-shot builders (Lovable, v0, Bolt, Replit Agent),
> autonomous-engineer tools (Devin/Cognition), and human dev shops.

## 1. Product Vision
Deliver the output of a full software team — validated, built, deployed, and kept running — to people who
can't or won't hire one, with proof at every step. Not "generate an app" but "run the company function
that produces and maintains the app." Durable because: (1) it's a **loop, not a transaction** (the value
is operating it over weeks/months); (2) **trust is the product** (verifiable deploys, audit trail,
governed autonomy). *JTBD framing (Christensen/Ulwick): people hire a way to get software shipped + run.*

## 2. Target Users & Jobs-to-be-Done
- Primary — the "over-demanded builder": solo/boutique agency, technical consultant, solo SaaS founder
  with more software demand than headcount.
- Secondary — the "domain-expert non-builder": deep vertical knowledge, can't hire/trust a black box.
- J1: more work than I can build → a team that ships reliably (grow without hiring).
- J2: delegating to AI → see it did the right thing (stake my name/money).
- J3: something breaks/needs a change → handled without me coding (stays alive).
- J4: I hand off control → still catch the decisions that matter (stay accountable).
J2/J4 = differentiated; J1/J3 = where we compete.

## 3. Core Value Proposition
"A software team that ships and keeps running your product — and proves every step. No hires, no black box."
1. End-to-end, not one-shot (validates first, operates after) — vs. Lovable/v0/Bolt.
2. Verifiable by default (real URLs, real tests, full audit trail) — vs. all autonomous agents.
3. Governed autonomy (acts within limits, routes decisions to you, kill switch + caps) — vs. dev shops & raw AI.
Trust + the operate-loop are the structural moats; speed/code-quality commoditize.

## 4. Information Architecture (ruthless simplicity — 5 destinations)
```
Home            → one action: "Describe your software" (+ your projects)
Project         → everything about ONE product
  ├ Overview    → status, live URL, health, what's next
  ├ Activity    → the audit trail (every action, filterable)
  ├ Deployments → versions, verification, rollback
  ├ Requests    → change requests + state
  └ Settings    → agents, policies, spend caps, keys
Inbox           → cross-project decisions/approvals awaiting you
Usage & Billing → credits/plan, spend, invoices
Account         → profile, team, security
```
Hick's Law (few top choices), progressive disclosure (depth inside a project), Miller's Law (one mental
object per product), object-oriented UX (Project is the aggregate root — like Linear/GitHub/Vercel).

## 5. Core Features (by capability)
- A. Intake & Validation — describe input, feasibility/demand check, scope confirmation (de-risk; the aha).
- B. Build & Deploy — automated build, CI + verification, **live URL** (the activation event).
- C. Operate & Iterate — change requests, monitoring/auto-fix, product memory (the differentiator; retention).
- D. Govern & Trust — approval inbox, audit trail, policies, spend caps + kill switch, verifiable receipts (the moat).
- E. Account & Commerce — usage credits/wallet, auth, billing, team access (table stakes).

## 6. Feature Prioritization (MoSCoW)
- Must: describe→validate→build→live URL; Activity/audit trail; Approval Inbox; auth; billing; caps + kill switch.
- Should: change requests; verification wall; product memory; monitoring/auto-fix; rollback.
- Could: growth/support agents (metered); shared substrate; integrations; command palette.
- Won't (now): public API/platform; enterprise compliance (SOC2/ISO); native mobile; standalone "chat-with-data" copilots.
The single most valuable note: **we are over-built. The ideal product is ~5 screens and one loop.**

## 7. Terminology & Naming (Jakob's Law — match existing mental models)
| Bespoke | Industry-standard |
|---|---|
| The Glass Box | Activity / Audit trail |
| "Run tonight's shift" / Shift | Run / Work cycle |
| Crew | Team / Agents |
| Cockpit | Dashboard / Workspace |
| Change Desk | Requests / Change requests |
| Blitz | Accelerate (or cut) |
| Soul / Agent Directive | Agent policies / Settings |
| Company Brain | Knowledge / Memory |
| Receipts | Proof / Verified results |
| The Living Org / MACHINA | internal codenames — never surfaced |
Product name "competitor.inc" stays (strong, ownable). Agent codenames (Apex/Forge/…) retired for real
software-company titles (CEO, CTO, Product Manager, Software Engineer, Product Designer, QA Engineer,
DevOps Engineer, Marketing Manager, Customer Support).

## 8. User Flows
- Activation: Home → describe → validation read → approve scope → watch build → **live URL** → account/pay at the reveal.
- Operate loop: Project → request a change → review plan + cost → approve → build → verify → live → logged.
- Governance: decision exceeding policy → Inbox with full context → approve/reject in one action → logged w/ receipt.

## 9. Design System
Monochrome-forward with a single restrained accent (Linear/Vercel/GitHub norm). **No-scroll cockpit for
primary workspaces — one viewport, panels scroll internally.** One primary action per screen; keyboard-first
(⌘K); real-time status; honest empty/error states (never fake progress). WCAG 2.2 AA: status never by color
alone (icon + text), contrast, visible focus, honor prefers-reduced-motion. Responsive: desktop-first for
build/config; mobile-first for Inbox + monitoring (approve + check-alive from a phone = a real JTBD).

## 10. Data Model
```
Account 1─* Project ; Project 1─* Run ; Run 1─* Activity
Project 1─* Deployment ; Project 1─* ChangeRequest ; Account 1─* Decision (→Inbox)
Project 1─1 ProductMemory ; Account 1─1 Wallet ; Agent *─* Project (each has a Policy)
Activity 1─? Receipt (verifiable proof)
```
`Receipt` and `Decision` are first-class schema objects — trust is structural, not cosmetic.

## 11. Success Metrics
North Star: **Active Operated Products** — products with a verified deploy/change in the trailing 30 days.
AARRR: activation (% reaching a live URL, time-to-first-deploy); retention (% with a verified change in 30d);
revenue (MRR, NRR, credits/paying acct); referral; **guardrail = verification rate (→100%)**. Commercial
health: Proven Paying Users (paid ∩ verified receipt).

## 12. Competitive Differentiators
- vs one-shot builders → we operate it too (validate before, maintain after).
- vs autonomous engineers → whole-company loop, human-governed.
- vs dev shops → always-on, cheaper, transparent (audit trail + receipts).
- vs ops copilots → we produce the software itself.
Defend: the operate loop (recurring value) + verifiable trust/governance. Both compound; model quality doesn't.

## 13. Future Roadmap
- P1 Build & Prove: describe→validate→build→live URL→audit→approvals→billing. Exit: strangers pay, verified live product.
- P2 Operate: change requests, verification wall, product memory, monitoring, rollback. Exit: products stay alive.
- P3 Grow & Compound: metered growth/support agents, shared substrate. Exit: NRR > 100%.
- P4 Platform & Enterprise: public API + SOC2/ISO (revenue-gated). Exit: third parties integrate; enterprise contracts.

### One-line takeaway
Build the smallest honest loop — describe → build → live URL → prove it → operate it — in ~5 screens,
one accent, audit trail + approval inbox as first-class citizens. Everything else waits.
