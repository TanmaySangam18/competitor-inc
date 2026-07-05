# Playbook — Interaction QA (every control works forwards AND backwards)

_Standing discipline for competitor.inc. Grounded in Nielsen's usability heuristics (#1 "visibility of
system status", #3 "user control & freedom" — every action has a clear, reversible response) and the
idempotency/reversible-state principle. Sister to our agent-action reversibility (`lib/engine/reversibility.ts`);
this one is for the **UI**._

## The rule
Automated QA (`npm run qa` = tsc + tests + build + smoke) proves the code compiles and the APIs don't
5xx. It does **not** prove a button does the right thing when a human taps it. So every interactive
control is verified by hand (or in the browser preview) on two axes:

1. **Forward** — tapping it does what it says, and the UI visibly reflects the new state (Nielsen #1).
2. **Backward** — the inverse returns to the prior state cleanly (Nielsen #3): a toggle toggles back,
   an "open" closes, "sign in" ⇄ "sign out", "approve" is reflected and the queue updates, a nav
   push has a working back. No dead ends, no stale screens.

Plus, for every control:
- **Hover / focus** — selectable things light up on hover and show a visible focus ring (keyboard).
- **Disabled/again** — tapping a busy/disabled control is a no-op (no double-submit); tapping an
  already-done action doesn't duplicate or corrupt state.
- **After it fires** — the surrounding screen updates (no "I clicked and nothing happened").

## The checklist (per screen)
For each screen, list every control and check all boxes:

| Control | Forward works | Backward/again returns to prior | Hover+focus | No stale screen |
|---|---|---|---|---|

## Priority flows (audit these first)
- **Auth:** sign in ⇄ **sign out** (must return to a clean logged-out home — this was broken:
  `useAuth.signOut` cleared the session but never navigated; fixed 2026-07-04 to reload `/`).
- **Nav / links:** every nav + footer link opens; browser back returns.
- **Approval Inbox:** approve / reject reflects immediately and removes the item; autopilot pause/resume.
- **Delegation:** send-to-crew shows the message + reply; agent picker switches; man/woman toggle persists.
- **Landing demo:** run validation → verdict → "keep this crew"; sample chips re-run.
- **Toggles/menus:** settings switches, tabs, expand/collapse — each flips back.

## How to verify (no guessing)
Use the browser preview: `preview_start` → click the control → `preview_snapshot`/`preview_screenshot`
→ click again / the inverse → confirm the state returned. Check `preview_console_logs` for errors on
each interaction. A control isn't "done" until both directions are observed.

## Success metric
Zero "I tapped it and nothing happened" reports. Every control has an observed forward + backward pass
recorded before a UI change ships.
