// Next.js instrumentation hook — loads the Sentry runtime config per environment. Fail-soft: the config
// files no-op when no DSN is set, so this is inert until Sentry is provisioned.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Captures errors thrown in React Server Components / route handlers (no-op without a DSN).
export { captureRequestError as onRequestError } from "@sentry/nextjs";
