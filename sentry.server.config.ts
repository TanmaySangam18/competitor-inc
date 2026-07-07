// Sentry (server runtime) — FAIL-SOFT: inert unless a DSN is provisioned (via `vercel integration add sentry`,
// which sets SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN). No DSN → enabled:false → zero network, zero overhead.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  sendDefaultPii: false, // privacy-first: never ship user PII to the error tracker by default
});
