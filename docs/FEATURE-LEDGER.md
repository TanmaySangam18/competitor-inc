# Feature Ledger — everything built or designed in this project (as of 2026-07-01)

Single reference for every feature discussed across the competitor.inc sessions.
Status: ✅ **live** (verified working) · 🟡 **gated** (code done; needs a founder key/account/click) ·
📋 **designed** (doc/proposal only) · 💤 **deferred/on-hold** (deliberate).

## Core engine (validate → build → operate)
| Feature | Status | Notes |
|---|---|---|
| Validation Gate (AI estimate + verdict + confidence) | ✅ | Real-model backed (`model:true` in prod); honest "AI READ" framing |
| **Demand Radar** (real-time cited web demand: HN + StackExchange + GitHub) | ✅ | THE validation mechanism; auto-runs in onboarding + import; `/radar` public page |
| Simulated engine (offline, deterministic, no key needed) | ✅ | Whole product works keyless by design |
| Real model routing (Anthropic / Vercel Gateway / OpenAI-compatible / BYOK) | ✅ | Defaults now Opus 4.8 (strong) + Haiku 4.5 (cheap); thinking-safe parsing |
| Per-agent model tiers (Forge/Apex strong, others cheap) | ✅ | `modelForAgent()` |
| BYOK + Private Mode (user's own key, never persisted server-side) | ✅ | SSRF-guarded base URLs |
| Nightly autonomous shifts (cron, fail-closed CRON_SECRET) | ✅ | Memory (`recall/remember`) + knowledge graph (BKG) for cross-night coherence |
| Continuous re-validation ("Re-test demand") | ✅ | Rate-capped free tier |
| Company import — "Built it. Can't sell it?" on-ramp | ✅ | Site audit (model + simulatedAudit fallback) → Radar → adopt → distribution-first crew |
| Ownership verification for imported products | 🟡 | `/api/import/verify` exists; full verify-before-operate pass pending |
| Self-enrichment panel | ✅ | |
| Coach (grounded-in-your-numbers nudges) | ✅ | |

## Governance & trust (the moat)
| Feature | Status | Notes |
|---|---|---|
| Policy engine (`decide()` five-gate, per-agent matrix, spend caps, kill switch, forbidden floor) | ✅ | Wired into `/api/execute` |
| Approval Inbox (draft → approve → send; nothing consequential auto-runs) | ✅ | Social kinds get "Copy post" |
| Glass Box (every action logged w/ proof: url/build/metric) + one-click undo | ✅ | |
| Rationale Stream ("Why?" on every action) | ✅ | |
| Verifiable-proof standard (`/proof`) + no-fake-proof hard rule | ✅ | Never fabricate signups/revenue/receipts |
| Proven Paying Users (PPU) north-star metric on founder board | ✅ | Replaced vanity signups |
| Server-side auth on `/api/execute` (owner + approval mapping) | ✅ | Guests get `disabled` — honest |
| Security review fixes + redaction + rate limiting + SSRF guards | ✅ | 2026-06-28 |

## Build & execution (Forge)
| Feature | Status | Notes |
|---|---|---|
| Real builds: idea → GitHub repo → Pages → live URL (verify-before-done) | ✅ | Proven end-to-end (Kindred ~100s); `GITHUB_TOKEN` live |
| Forge v2: model-authored multi-file static sites (defensive caps) | ✅ | |
| Pay-to-reveal funnel (free build+watch, blurred link, pay to open) | ✅ | Known ceiling: nudge not hard paywall; v2 = private-until-paid |
| Real deploys via Vercel hook | 🟡 | Needs `VERCEL_DEPLOY_HOOK_URL` |
| Forge → real coding agent (Claude Agent SDK) | 📋 | Roadmap |

## GTM engine
| Feature | Status | Notes |
|---|---|---|
| GTM Plan panel — encoded Sam Blond playbook P1 (concentric-circles ICP, source-quality channels, demand-vs-conversion bottleneck) | ✅ | Sourced, cited; proposal in docs/BLOND-GTM-AGENT.md |
| Gauge (B1) — demand tracker: opps/shift, trend, channel mix, weekly brief | ✅ | History tab |
| Distribution drafts for imported products (trigger cold email 3-touch, X, LinkedIn, Reddit posts) | ✅ | Research-grounded copy, approval-gated |
| Launch blitz (Surge drafts launch posts → inbox) | ✅ | |
| Reddit posting executor (OAuth, approval-gated) | 🟡 | Needs `REDDIT_*` env |
| Bluesky + Mastodon posting executors | 🟡 | Needs `BLUESKY_*`/`MASTODON_*` |
| Twitter/X + LinkedIn auto-post | 💤 | No paid APIs (founder rule) — copy-paste by design |
| Autonomous marketing campaigns (CampaignPanel) | ✅ | Collapsed "Advanced" section |
| Ads deployment (Meta-style agency-on-behalf) | 💤 | Deliberately not built (accounts + F1 caution); OpenMontage verdict: do NOT integrate (AGPL) |
| CRM Architect "Ledger" (P3) + CS lifecycle (first-30-days) | 📋 | Next autonomous build |
| Real send infra + enrichment/trigger data (P4) | 📋 | Gated on go/no-go + accounts |
| Lead Desk (LinkedIn-CSV/IG warm outreach) | 💤 | ON HOLD until paying users |
| NU beachhead (Northeastern-tailored landing/onboarding + warm channels) | 📋 | Locked GTM wedge; next build after gaps close |

## Product surfaces
| Feature | Status | Notes |
|---|---|---|
| Landing (hero, honest-comparison table, Glass Box showcase, interactive demo, pricing, 10K counter) | ✅ | Hick's-Law nav consolidation done |
| Dashboard (onboarding, tabs: Operations/History/Chat/Operate, company switcher, autopilot) | ✅ | |
| The Delegation "Office" (3D crew, live floor chat, per-agent souls) | ✅ | |
| The House (founder HQ: triple-click entry, allow-list, command bar) | ✅ | localhost unlock; deploys need auth |
| Founder board (PPU) + private proof board (`/house/*`) | ✅ | |
| `/live` public board (clickable real-URL proofs) | ✅ | localStorage-scoped; public receipted board at launch |
| Playbooks tab (freemium user resource; every applied playbook added) | ✅ | $3 unlock = "coming soon" 💤 |
| Blog, How-it-works, Terms, Privacy | ✅ | MA governing law; CAN-SPAM consent microcopy |
| `/join` waitlist (referral codes, move-up-5, 10K progress bar, live counter) | ✅ | |
| Demand-test landing pages (`/t/[slug]` + signups) | ✅ | |
| **Lockin** standalone app (`/lockin` — one-thing focus timer + streak) | ✅ | Real signup capture; launch kit drafted; 10-signup goal gated on founder posting |
| Chat co-founder (streaming, queues consequential asks as approvals) | ✅ | |

## Billing & business
| Feature | Status | Notes |
|---|---|---|
| Polar checkout (MoR) + webhook (`/api/billing/polar`, Standard Webhooks verified) | ✅ | Operator $39/mo live |
| Entitlement + soft-wall + founder full-access bypass (customer #1) | ✅ | |
| Post-payment unlock loop verified end-to-end | 🟡 | Needs one live test purchase |
| Founding seats / $299 concierge tier consistency | 🟡 | Founder pricing decision pending |
| Stripe payments | 💤 | Unused (Polar is MoR); payout blocked on F1/OPT |
| Free-tier usage caps (validations/shifts per day) | ✅ | |

## ChatOps & identity
| Feature | Status | Notes |
|---|---|---|
| Telegram interactive approvals (webhook + decisions) | 🟡 | Needs `TELEGRAM_*` tokens |
| Founder email notifications (new signup etc.) | 🟡 | Needs `RESEND_*` |
| **InkBox** (internal name: per-agent identities for ChatOps/email) | 📋 | Name stays internal; roadmap |
| WhatsApp approvals | 📋 | Roadmap |
| Morning summary email | 🟡 | Rides RESEND |

## Infra & tooling
| Feature | Status | Notes |
|---|---|---|
| Setup MCP server (Vercel/Supabase/model tools + `setup_revenue_unlock` + **`stage_connect`/`preflight_connect`** "fill keys, you hit submit") | ✅ | ~/competitor-inc-setup-mcp-server; repaired corrupted deps |
| QA gate (`tsc` + vitest + build + smoke + fuzz) | ✅ | 262 tests |
| Supabase schema (waitlist, demand, feedback, **interest**, companies/approvals RLS) | 🟡 | `interest` migration awaits founder run |
| Auth (Supabase magic-link + Google/GitHub OAuth) | 🟡 | **Keystone gap**: providers/SMTP must be enabled in Supabase dashboard |
| Docs suite (MASTER-PLAN, ROADMAP-V2, REVENUE-RUN, NEXT-BLOCKS, INTEGRATION-AUDIT, QA-REMEDIATION-LOG, FOUNDER-PLAYBOOK, intel/*) | ✅ | |

## Designed-only / rethinks (deliberate)
| Item | Status |
|---|---|
| Validation pillars 1 & 3: Mom-Test conversation designer + costly-commitment ask | 📋 |
| Office vs House two-layer architecture | 📋 |
| v2: private-until-paid, import-on-ramp-as-wedge, self-enrichment++ (ROADMAP-V2) | 📋 post-launch |
| Big-bang surprise launch (never build-in-public) | standing rule |
