# ADR-0029: Hands with a floor

**Date:** 2026-08-11 · **Status:** accepted · **Driver:** founder asked whether competitor.inc could
match OpenClaw's capabilities, and whether customers could choose which hard-stops apply.

## Context

OpenClaw (MIT, ~145k stars, formerly Clawdbot) is a self-hosted agent runtime that executes real
actions: shell, files, browser control, messaging. It is the reference point for "an agent with hands."

Reading our own code produced an uncomfortable finding: **we had no hands at all.**
`BrowserTransport` had been defined in `lib/core/browser-driver.ts` since ADR-0019, and the only
implementation in the repository was a Vitest mock. `onboarding-runner.ts` contained the complete
decision logic (govern → drive → detect → report, resumable, hard-stop aware) and drove nothing.
Nothing anywhere executed a shell command at runtime; `cli-script.ts` only *generates a string* for a
human to paste. The brain shipped in ADR-0017. The hands were a typed hole.

Playwright `^1.61.1` was already a devDependency (used by `scripts/qa-ui-audit.mjs`) and is Apache-2.0,
so it clears the license shield. Real hands cost zero new packages.

## Decision

### 1. A real transport, running on the user's machine

`scripts/hands.mjs` implements `BrowserTransport` over Playwright as a local CLI speaking NDJSON on
stdin/stdout. It is a local process, not an API route, because competitor.inc never drives a screen from
our servers. `onboarding-runner.ts` needed no changes: it already spoke this interface.

### 2. The six hard-stops enforced at the last inch

Our floor already existed upstream (policy.ts) and mid-stack (the runner refuses to drive a human step,
and refuses an agent step that carries a `hardStop`). This adds the third layer: **immediately before
touching a real screen, the hand inspects what it is about to touch and refuses if it is one of the
six.** The refusal does not depend on anything upstream being correct, so a confused planner, a
mislabelled recipe, or a hostile page cannot get a forbidden action performed.

`lib/core/hard-stops.ts` is the source of truth. Because the local runner cannot import TypeScript, the
patterns exist twice, in `scripts/hands-guard.mjs`. **A test reads both files and asserts the pattern
blocks are character-identical**, then runs ten targets through both implementations demanding identical
verdicts. Drift fails the build.

### 3. Customer choice as a ratchet, not a dial

The founder asked whether customers could choose which hard-stops apply. **No, and the reason is the
moat:** if a customer can disable "never accept terms on your behalf," the product guarantees nothing,
and the answer to a university security office's question ("what cannot happen?") becomes "it depends
how they configured it." That fails the review we need to pass, and it inverts liability.

So customers get three real choices, none of which weakens the floor:

- **Add stops** (`additionalStops`), purely additive. Their own policy tightens.
- **Choose the handoff mode per stop**: `pause` (default), `takeover` (hand over the live screen),
  `queue` (batch approval later), `skip` (abandon and mark the connection unavailable, honestly).
  The stop always happens; only the route back to a human varies. There is deliberately no `proceed`
  mode, and a test asserts that.
- **Choose the escalation recipient**: founder, a named approver, or a Slack channel.

`CustomerPolicy` has no field that removes a floor stop, and a test feeds a deliberately hostile policy
carrying `disable: ["pay","authenticate"]`, `allowPayments: true`, `floor: []` and proves a payment
target is still stopped.

## Two things the tests forced, worth recording

**A password input is stopped on its `type`, not its label.** A button reading "Continue" above an
`input[type=password]` is still authentication.

**"Create App" is deliberately NOT stopped.** Creating a Slack *app* is not creating an *account*.
Without that distinction the guard would refuse the very flow it exists to drive, which is how safety
features get switched off in practice.

## A defect the audit log caught in our own transport

The first live run logged `fill-miss` for a field that did not exist, while the op returned `ok: true`.
Nothing was typed, yet the brain would have marked the step done: a transport teaching the planner a
lie, which is the exact failure this company exists to prevent. `opFill` now reports `filled` and
`missed`, and an all-miss returns `ok: false` with "Nothing was typed."

## Verified live, against real websites

Navigated `example.com`; `detect` returned true for present text and false for absent text; a fill with
no matching field correctly failed rather than claiming success; navigation to `github.com/login` was
allowed (looking is fine); and a fill on that page was refused with
`hard-stop (authenticate) … "login" … This one is yours.` Refusals for `javascript:`, `file:///etc/passwd`,
and a GitHub token as a fill value all fire without a browser. Every command and refusal is appended to
`hands-audit.log` (gitignored: it carries real URLs and field names).

## Consequences

We can now say something OpenClaw structurally cannot: **the agents have hands, and there are six things
those hands will not do, in every deployment, by construction.** That is a product claim rather than a
copied feature.

## Follow-ups

- Slice 3: a governed shell capability. OpenClaw runs arbitrary shell; ours should run an **allowlist**
  with every invocation on the audit ledger.
- Wire `CustomerPolicy` into `/connect` so the handoff choice is a real setting rather than a type.
- The `takeover` and `queue` handoff modes are honoured in the verdict but need UI to be usable.
- Evaluate OpenClaw itself as an alternative transport behind the same interface, LICENSE verified from
  the repository and a NOTICE entry added, once there is revenue and a reason.
