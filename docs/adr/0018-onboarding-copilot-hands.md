# ADR-0018: The onboarding co-pilot's hands — governed browser runner

## Context
ADR-0017 built the co-pilot's brain (per-service plan). The hands execute it: drive the browser, enforce
the six hard-stops, report to Slack. The physical browser backend is large customer-side software; the
DECIDE-and-ENFORCE spine is what makes it safe and is buildable + testable now.

## Decision
lib/core/onboarding-runner.ts drives a plan step by step behind an injectable BrowserDriver (navigate /
fill / detect), so the same runner works behind any backend (extension / Playwright / claude-in-chrome)
and is tested offline with a fake. Four invariants enforced in code, not by politeness:
1. CONSENT gates everything (consent:false ⇒ the driver is never touched).
2. GOVERNANCE FIRST — every agent step passes governAction (new browser_setup class, T1, engineering
   AUTO) before the driver; non-AUTO halts.
3. HARD-STOP FLOOR — human steps are never driven; a defensive guard also refuses any AGENT step that
   carries a hardStop (mislabel protection). The run PAUSES and hands the tap to the human, one at a time.
4. NO SECRETS — the driver only ever receives a step's prefill (secret-free by ADR-0017 tests).
Runs are resumable (call again after each human tap); detect() gates auto-advance so nothing is reported
"connected" without a real signal.

## Consequences
This is the reusable governed core. NEXT (customer-side app, not this repo's server): the real
BrowserDriver backend + the consent UI + an /api route that streams step reports to the office. The
backend runs on the CUSTOMER's machine on their consent; competitor.inc never drives screens from our
servers. Hard-stops (account-create/accept-terms/authenticate/captcha/grant-consent/pay) stay bright
lines — the runner structurally cannot cross them.
