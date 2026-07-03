> ⚠️ **STALE SNAPSHOT (2026-07-03).** Describes the killed "$99 Founding seat" + LemonSqueezy checkout as current UI. Live pricing = $0 / $39 Operator / $299 Founder / $499 Sprint on **Polar** — see [PATH-TO-10K.md](PATH-TO-10K.md); feature truth: [FEATURE-LEDGER.md](FEATURE-LEDGER.md).

# Stress-test — "tap every word," map the pipeline, find the gaps (2026-06-27)

> Method (the playbook the founder asked for): a **content inventory + information-architecture audit**
> layered with **Nielsen heuristics** — esp. *match between system & the real world* (do the words mean what
> they say?) and *visibility of system status* (does the user see what's real vs simulated?). Run as 3
> read-only audits over `lib/engine`, `app/`, `app/api`, and `docs/`. Items marked **[fixed S1]** shipped in
> commit `be169fa`; the rest are tracked below.

## 1 · The pipeline — every step, what it does, does it connect?
| Step | Where | Word/CTA | What it actually does | Coherent? |
|---|---|---|---|---|
| Land | `app/page.tsx` | "Start with a free validation" → /dashboard | opens the validation gate | ✅ |
| Capture | `app/join` | "Claim a Founding seat — $99" / waitlist | LemonSqueezy checkout (if URL set) else waitlist | ✅ |
| Validate | `useEngine.decideValidate` | runs the gate → verdict | free, capped 3/day; labeled "AI estimate" | ✅ honest |
| **Build** | `useEngine.decideBuild` | "Approve build" → /delegation | ships a sim MVP ($0.42) | ⚠️ **free today; will be Operator-gated (S3)** |
| Operate | `useEngine.runShift` | "Run tonight's shift" | sim/real shift; capped 12/day | ✅ (cap, not plan) |
| Spend | approval card | "Scale ad spend to $N/day" | **[fixed S1]** queued to the user's OWN ad account; nothing spent unless connected | ✅ now honest |
| Demand test | `app/t/[slug]` | public landing + email capture | persists to Supabase | ✅ (+ branding **[fixed S1]**) |

## 2 · Confirmed logic gaps (the founder's flags — all real)
1. **Ad-spend "where's the money?"** — *was:* approving $1000 instantly added "$1000 spent" to the ledger even with no ad account connected (nothing actually spent). That's the Polsia "fake done" failure. **[fixed S1]**: spend approvals no longer inflate the ledger or claim spend; copy now names the funding source (your own connected ad account; simulated until connected).
2. **No build paywall** — `decideBuild` has zero entitlement check; `createPaymentLink` exists but is never called. Pricing copy implies Operator gates build, but the app doesn't enforce it. → **S3**: LemonSqueezy Operator $39/mo gate (validate free, pay to build).
3. **Email is single-recipient only** (`sendEmail`/Resend); no bulk, and Resend's ToS bans cold email. → **S4**: agent-drafted, personalized, **approval-gated B2B** cold outreach sent via the user's *own* warmed infra (Predictable-Revenue playbook) — never a blast. Plus a compliant warm-waitlist path.
4. **`/t/<slug>` had no branding** — fully white-label. **[fixed S1]**: subtle "Powered by competitor.inc" footer.
5. **Misleading landing mockup** — "Ran $20 demand test on Meta" implied a Meta integration we don't have. **[fixed S1]** → "on your connected ad account".

## 3 · Copy ↔ reality matrix (what to keep honest)
| Claim | Reality | Action |
|---|---|---|
| "No revenue share / no lock-in / export anytime" | true (no rev-share code; localStorage+Supabase export) | ✅ keep |
| "Never charged for failed work" | true (undo refunds; failed = credited) | ✅ keep |
| "Validation free forever" | true (3/day free cap) | ✅ keep |
| Validation = "AI estimate" | true (model/sim estimate, not live traffic) | ✅ keep until real demand-traffic loop |
| Operator = "build-the-winner agent team" | build is currently free | → **S3** makes it true (gate build) |
| Glass Box / Approval Inbox "Operator" | free today | → align after S3 (they're part of the gated build/operate) |

## 4 · Planned but NOT implemented (prioritized roadmap)
**Launch-critical-ish (gate the full "agents take over" + $10K story):**
1. **Real demand-test TRAFFIC loop** — capture scaffold exists (`/t`, `/api/demand`); the traffic driver (ads/SEO/organic) does not → validation stays "AI estimate."
2. **Build paywall** → **S3 (in progress).**
3. **Model-reasoned dynamic crew** — `lib/engine/crew.ts` is a deterministic keyword matcher, not a model call. (Works, but not the "reasons about your idea" promise.)
4. **Forge real coding (Claude Agent SDK)** — current build = GitHub repo create + verify; not sandboxed build→test→PR. "Builds real products" isn't literally true yet.

**High-impact post-launch:**
5. Studio/annual pricing (biggest single lever on the $10K math).
6. ChatOps / text-your-agents (Telegram) — teaser only.
7. pgvector memory — built + wired, **not verified** with real data; outcome-learning loop (the moat) not shipped.

**Medium / deferred:**
8. Playbooks $3 unlock + entitlements (static free only today).
9. External observability sink (LangSmith/Langfuse) — local `withTrace` only.
10. Framework roster (static list, no curation loop) · JD-mining (not built).
11. Operate layer (built; can freeze with `NEXT_PUBLIC_OPERATE=0` for a lean launch).

## 5 · Verdict
The product is **honest and coherent for a validate-first launch** — the worst gap (the ad-spend "fake spend")
is fixed, and the words now mostly match the system. The remaining gaps are **feature depth, not lies**: the
"agents take over / it builds real products / real demand verdict" story needs items 1, 3, 4 to be *literally*
true. None block a metered, waitlist-first launch; they're the Week-1→12 build order behind the 90-day plan.
