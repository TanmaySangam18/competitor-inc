# ADR-0017: The Onboarding Co-pilot — "set it all up for me," with honest hard-stops

## Context
Founder goal (2026-07-19): the company sets ITSELF up — the user taps "OK" a few times, an MCP does
everything in between (deep-link the exact page, pre-fill scopes/names/redirects, detect + store keys,
run OAuth), reporting each step to Slack; hard-stop only at payment/bank. Reaching the SPIRIT of that
goal requires bright lines the agent must not cross — not to add friction, but to protect the customer.

## Decision
lib/core/onboarding.ts is the co-pilot's BRAIN (pure data, no I/O): per-service SetupRecipe of ordered
steps, each tagged AGENT (navigate/pre-fill/detect/connect) or HUMAN. Five+one HUMAN hard-stops, each an
irreducible legal act, secret, or bot-gate: account-create, accept-terms, authenticate(password),
captcha, grant-consent, pay. onboardingPlan(configured) orders by tier, skips connected services, counts
agent work vs human taps. stepReport() is the one-line Slack update the assigned employee posts per step.

Why MORE hard-stops than just payment (the honest expansion of the founder's ask):
- account-create + accept-terms: signup is a binding legal act; competitor.inc's moat is a HUMAN is
  accountable — a bot accepting ToS transfers liability to software.
- captcha: defeating bot-detection violates provider ToS and gets the customer's REAL account banned.
- authenticate/grant-consent: passwords + OAuth authorize clicks are the human's by definition.
Everything else is the agent's job — which is ~half the steps and ALL the friction between taps.

Guarantees enforced by tests: agent steps never pre-fill a secret; every human step carries a valid
hard-stop; agent steps never do; the money step is a HUMAN "pay". OAuth-supported services collapse to
one authorize click (recipe.oauth), reusing the shipped flow (ADR-0010/0011).

## Consequences
This is the plan the (customer-side, consent-gated) browser co-pilot executes and the office reports —
built next as the hands. The agent runs in the CUSTOMER's environment on their consent; competitor.inc
ships the co-pilot, it does not drive screens from our servers. No account creation, CAPTCHA-solving, or
ToS-acceptance by bot — ever.
