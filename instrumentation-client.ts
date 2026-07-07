// Sentry (browser) — FAIL-SOFT: inert unless NEXT_PUBLIC_SENTRY_DSN is provisioned. Session Replay is OFF by
// default (privacy + cost); flip the sample rates up after provisioning if you want it.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// Instruments App Router client-side navigations (no-op without a DSN).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
