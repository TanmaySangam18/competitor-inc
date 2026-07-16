# ADR-0007: The Stream — one conversational surface replaces the dashboard cockpit (Block A)

## Context
docs/CONNECT-FIRST-RESET.md §2: the product's only operating surface is ONE conversational thread
per company — named agents' real work as turns, artifacts inline, a single pinned decision block for
the rare thing that needs the human. The human is an OVERSEER ("You're overseeing", never "You're
driving" — the Bloome distinction). The metric-hero cockpit + its 6 tabs were the opposite shape:
six cameras pointed at the same company state. ADR-0002 cleaned the repo to 0 unreachable and left a
shelf register with the standing rule "anything the Stream build doesn't wire, it kills."

(Numbering note: the task brief called this ADR-0003, but 0003 was already taken by the coworker
move and parallel lanes on main claimed 0004–0006 — this is 0007.)

## Decision
`components/stream/` is the new operating surface, rendered by `app/dashboard/page.tsx` when
`company.status === "operating"`:

- **Stream.tsx** — header band (name/rename + goal chip + "YOU'RE OVERSEEING" pill + kill switch +
  honest settled revenue **$0** — no revenue field exists on the client engine yet; the number is
  code-commented to bind to verified receipts only and never move without one) · compact mono action
  row (Run shift / Re-test / Accelerate, waitlist-gate lock preserved) · filter chips
  (ALL / NEEDS ME / DONE, client-side) · the thread (latest ~40 ledger entries, oldest→newest).
- **DecisionBlock.tsx** — the pinned decision block, heaviest border on the page (1.5px near-black);
  one item per pending approval; Approve/Hold via `resolveApproval`; social/video drafts stay
  COPY-FIRST and spend approvals keep the trial-credits honesty note (both inherited from
  ApprovalCard). Disappears entirely when the queue is empty.
- **StreamTurn.tsx** — a real activity as a conversational turn: mono initials avatar, persona name +
  label, night N, action, artifact strip with RECEIPT chip + VIEW ↗ for live URLs. The ActivityRow
  paywall mask is preserved exactly: a proof equal to the locked live URL renders masked, never as a
  link. Honest undo (reversibility classifier) and "why?" (rationaleFor) on every turn.
- **ProductCard.tsx** — the money moment as a special pinned artifact turn; entitled / locked /
  building states preserved exactly (incl. FoundingMember while Operator checkout isn't live and the
  $199/mo unlock link).
- **AskBar.tsx** — a REAL input on the engine's existing chat path (kind:"chat" + org-soul, streamed,
  x-approval → the pinned block). No dead controls.
- **GoalChip / RenameTitle** — moved from the page, monochrome; behavior unchanged.
- Style: monochrome only; `rise` stagger keyframe added to globals.css with a reduced-motion guard.

## Killed (same commit; git history is the archive)
In-file (app/dashboard/page.tsx, 1033 → ~514 lines): `Operating`, `WorkspacePanel` (the 6-tab
workspace), `CockpitTabBar`, `AuditTicker`, `MetricHero`, `ApprovalsBand`, `WorkBars`, `NightTrends`,
`useCountUp`, the SEC_TABS index, `OPERATE_ENABLED`.

Files deleted (unreachable after the cockpit died, verified by scripts/audit-inventory.mjs → 0
unreachable):
- components/GTMPanel.tsx · components/GrowthPanel.tsx · components/CampaignPanel.tsx ·
  components/CoachCard.tsx · components/MorningBrief.tsx (the Sell/Brief tabs)
- components/AttributionPanel.tsx · components/PixelSnippet.tsx (GrowthPanel cascade)
- components/dashboard/CrewBoard.tsx (Team) · components/dashboard/TeamRoomTab.tsx (Chat) ·
  components/dashboard/BrainTab.tsx (Knowledge) · components/dashboard/OperateTab.tsx (EOS rocks/issues)
- components/dashboard/ActivityRow.tsx · components/dashboard/ApprovalCard.tsx ·
  components/dashboard/BarChart.tsx (replaced by StreamTurn/DecisionBlock)
- components/dashboard/MandateCard.tsx · components/dashboard/Stat.tsx ·
  components/dashboard/agentStyle.ts (cascades)
- lib/engine/ledger.ts (netSpend — OperateTab-only)
- lib/engine/campaign.ts + campaign.test.ts · lib/engine/coach.ts + coach.test.ts (became test-only
  when their panels died; the Stream doesn't wire them → killed per the ADR-0002 standing rule)

## Consequences
- One surface answers "what happened / what needs me / did it pay" — the tab paradigm is gone from
  the operating state; validation/onboarding paths are untouched.
- The mandate SIGNING surface (MandateCard) died with the Chat tab. This degrades SAFE: mandates-db
  falls back to UNSIGNED and customer-mandate decides deny-by-default, so consequential acts queue
  for approval instead of auto-running. The mandate data layer + /api/mandate are intact; re-home the
  signature in /connect (Block B).
- The pixel install snippet + attribution readout (PixelSnippet/AttributionPanel) lost their surface;
  the pixel API + revenue_events remain. The growth loop's feed items re-home them (Block D).
- Operate (rocks/issues) lost its UI; the engine functions remain and the /api surface is untouched.
- The morning brief is gone from the dashboard per the reset (§5: Brief → digest via Slack/email later).
- localStorage side-thread for AskBar is capped (24 turns) — the ledger stays the record of truth.
