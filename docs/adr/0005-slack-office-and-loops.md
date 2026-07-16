# ADR-0005: The Slack office + the autonomous loops (Connect-First Blocks C+D)

## Context
docs/CONNECT-FIRST-RESET.md §3 says Slack is the office: agents deliberate in per-department channels,
the human is @-mentioned ONLY on tier-gated decisions. §4 names the loops that do the org's job:
incident (monitor event → triage → within-tier fix), support (grounded answers exist; escalate on policy
triggers only), finance (read real sources → render → deliver). What existed before this ADR: the raw
Slack transport (lib/engine/slack.ts postToSlack — ungoverned), the org-chart identity/standup layer
(lib/org/slack-org.ts — Block 2 team room, also ungoverned), the governance spine
(lib/core/govern.ts: kill switch → decide()/tier scorer → audit ledger), the inner loop
(lib/engine/org-run.ts) and the outer loop (lib/loop/loop-engine.ts + loop-driver.ts), and grounded
support answering (lib/engine/grounding.ts). ADR-0002's rule stands: WIRE shelf capability, never
duplicate it.

## Decision
1. **`slack_post` is a first-class governed action** (lib/engine/policy.ts). BASE_TIER `T1`: a WRITE,
   but to the customer's OWN opted-in workspace — reversible-ish (the bot can delete its message),
   fully observable (the channel IS the observability surface), zero public blast radius. Following the
   `mcp_read`/`design_draft` pattern, T1 alone is not enough (unknown matrix cells default to
   APPROVE → QUEUE), so the posting departments get explicit matrix `AUTO` cells: engineering, growth,
   marketing, support, finance, ops. ceo/legal/manufacturing stay on the default APPROVE path — they
   have no channel to speak for.
2. **lib/loop/office.ts is the ONE governed routing layer** every loop posts through. Dept → channel id
   from env (`SLACK_CH_ENG`/`_GROWTH`/`_SALES`/`_SUPPORT`/`_FINANCE`/`_DECISIONS`), all falling back to
   `SLACK_LOOP_CHANNEL` (the channel the loop cron already uses). Every post runs
   `governAction` BEFORE any network; keyless (no channel/token) is an honest "not connected" no-op with
   no governance theater — the exact posture of lib/core/mcp-connect.ts. `mirrorDecision` posts to
   #decisions and appends the @-mention ONLY for T2+/queued items (`SLACK_FOUNDER_MEMBER_ID` → real
   `<@U…>` ping; absent → plain "@founder", visible but honestly not a ping). Division of labor:
   slack-org.ts keeps identity/standup composition; engine/slack.ts stays the transport (the office's
   default `post` dep); office.ts owns routing + governance. `sales` maps to the `marketing` agent —
   no sales AgentRole exists and marketing owns outreach in the matrix (same convention as slack-org's
   EXECFN_DEPT).
3. **Incident loop** (lib/loop/incident.ts + app/api/hooks/incident): severity IS the tier —
   low/medium → T1 auto-triage (governed #eng brief + enqueue a "root-cause and fix" org-run through the
   EXISTING inner loop, injected as `deps.enqueueRun`); high → T2 queue (#eng brief + #decisions mirror
   with the mention, nothing auto-runs); critical → T3 halt (same, as BLOCK — a page, not a run). The
   kill switch stops the enqueue too, not just the network. The webhook adapts native and Sentry shapes
   (legacy `{level,message}` + issue-alert `{data:{issue|event}}`; fatal→critical, error→high,
   warning→medium, else low — unknown reads LOW, never invented upward), is auth-gated by a timing-safe
   `x-incident-secret` (same trust model as the Telegram webhook), answers 503 "hook not armed" when
   `INCIDENT_HOOK_SECRET` is unset, and enqueues runs only when a DB and `INCIDENT_RUN_USER_ID` (the
   run owner — org_runs.user_id is NOT NULL) both exist; otherwise it says so.
4. **Finance loop report** (lib/loop/finance-report.ts): renders ONLY numbers handed to it from real
   sources (billing ledger, lib/core/economics.ts rollups). An absent metric prints "not connected" —
   never a zero-pad; margin is computed only when both terms are real; sources are printed or their
   absence is called out. PDF rendering is explicitly DEFERRED (needs a renderer dependency not in the
   stack; a PDF wrapper can wrap renderFinanceReport later without changing any number).
5. **Support escalation policy** (lib/loop/support-escalation.ts): grounded answering stays in
   grounding.ts untouched. `shouldEscalate` encodes the human floor as explicit deterministic triggers —
   legal mention (always), refund mention (money is the human's), 3+ repeat contacts, negative sentiment
   compounding on a repeat. Escalations post to #support WITH the mention (an escalation is by
   definition a human-needed event); non-escalations post nothing.

## Consequences
Everything the loops say in Slack now flows through one governed, audited, kill-switchable path — an
agent cannot reach the workspace around the spine, and a thrown switch silences the office and stops
auto-triage in the same breath. The office runs honestly degraded at every missing key (no Slack → no-op
with reason; no DB/owner → classified but not enqueued; no member id → no fake ping). Known debt, on
purpose: slack-org.ts's postAsAgent and engine/slack.ts callers (cron digest, kickoff, chatops) still
post ungoverned — migrating them onto office.ts/postToDept is the follow-up, one caller at a time.
`INCIDENT_RUN_USER_ID`, the `SLACK_CH_*` ids, `SLACK_FOUNDER_MEMBER_ID`, and `INCIDENT_HOOK_SECRET` are
founder-set env (BYOK holds). The #decisions mirror renders from data pushed to it — wiring the
decision queue/autopilot to CALL mirrorDecision on enqueue is part of the Stream build, not duplicated
here.
