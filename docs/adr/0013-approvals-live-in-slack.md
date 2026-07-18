# ADR-0013: Approvals live in Slack; the website only demonstrates

## Context
Founder (2026-07-18): "I do not want anything visible on the website: the approval should be asked for
the respective employee on Slack and that agent employee should be replying yes or no — in any
department. Except for a demo of how the same would work on Slack, playing automatically."

## Decision
- The Stream's DecisionBlock has NO approve/hold/copy buttons. Each queued item renders as a Slack-style
  ask answered by the RIGHT approver per governance: department lane → the dept lead (ADR-0012 rails);
  founder floor → "You (founder)" in #decisions. In the keyless sandbox those replies are SIMULATED on a
  timer (labeled "simulated reply — in the real product this happens in your Slack") and the engine
  proceeds — visitors watch the model, they never click approvals on the web.
- SlackThreadMock is now the AUTO-PLAYING demo: plays message-by-message (typing indicator) the moment
  it scrolls into view, replay affordance, reduced-motion renders instantly; thread now opens with the
  ADR-0012 moment (writer asks, lead replies yes with the rails named). Honesty caption unchanged.
- Real-Slack wiring path unchanged: office.ts mirrorDecision posts founder-floor items to #decisions;
  the deliberation engine (#72) later carries real lead replies. Nothing on the web gains approval UI.

## Consequences
The web is watch-only end to end; Slack is the single approval surface (demo = simulation, labeled).
Kill switch stays on the web header — stopping is an oversight right, not an approval.
