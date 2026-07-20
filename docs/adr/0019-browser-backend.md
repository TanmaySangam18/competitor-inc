# ADR-0019: The browser backend — the physical hands

## Context
ADR-0018 built the governed runner behind an injectable BrowserDriver. This provides a real driver: the
piece that actually talks to a screen. The physical automation (Chrome extension via CDP / Playwright /
claude-in-chrome) is environment-specific and runs customer-side; the reusable, testable part is the
driver that speaks a typed command protocol over one injected transport.

## Decision
lib/core/browser-driver.ts: makeBrowserDriver(transport) returns a BrowserDriver that emits
navigate/fill/detect over a BrowserTransport (the one seam a real backend implements). Two boundary
guards, enforced here as defense in depth (the plan already promises them):
1. NO SECRETS — fill() refuses any value matching credential shapes (sk-/xoxb-/ghp_/stripe/AWS/JWT/PEM/
   long opaque runs) BEFORE it reaches the transport. Verified: every real recipe prefill passes (labels,
   scopes, "copy: …" instructions are not secrets); real token shapes are caught.
2. SAFE NAVIGATION — navigate() allows only http(s) or same-app relative paths; refuses
   javascript:/data:/file: (a hostile page can't steer the driver to a dangerous scheme).
detect() returns true only on an explicit detected signal (no false "connected").

## Consequences
The runner's hands are now real behind any transport. NEXT (customer-side app, not this server repo):
implement a BrowserTransport as a Chrome extension (CDP) or Playwright bridge on the user's machine +
the consent UI + a route streaming step reports to the office. Servers never drive screens. The six
hard-stops remain structurally uncrossable across runner + driver.
