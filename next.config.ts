import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Deploy-freshness stamp: frozen at build time, read by /api/version. Works for git-connected AND
  // git-metadata-free deploys (unlike VERCEL_GIT_COMMIT_SHA) — the House board compares it to "now"
  // so a silently-blocked deploy pipeline (the Vercel seatBlock incident) is visible, not quiet.
  env: { BUILD_STAMP: String(Date.now()) },
  async headers() {
    return [
      // Everything except /decisions keeps the blanket clickjacking DENY.
      { source: "/((?!decisions$).*)", headers: securityHeaders },
      // /decisions (the Executive Inbox) is embedded by the coworker desktop app. XFO has no allow-list,
      // so this one path swaps DENY for a TIGHT CSP frame-ancestors: self + the coworker's local app
      // origin only (apps serve at <slug>.apps.localhost:3210). Every other header stays identical.
      {
        source: "/decisions",
        headers: [
          ...securityHeaders.filter((h) => h.key !== "X-Frame-Options"),
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' http://executive-inbox.apps.localhost:3210" },
        ],
      },
    ];
  },
  // Site simplification (ADR-0009, 2026-07-18): the legacy marketing layer around the ADR-0008 keepers
  // was removed. Every killed page redirects permanently to the keeper that answers its question —
  // never a 404 left behind. /demo (the pre-0008 alias for the killed /build demo) folds to / too.
  async redirects() {
    return [
      { source: "/demo", destination: "/", permanent: true },
      { source: "/build", destination: "/", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:slug", destination: "/", permanent: true },
      { source: "/compare", destination: "/", permanent: true },
      { source: "/founder", destination: "/", permanent: true },
      { source: "/how-it-works", destination: "/#how", permanent: true },
      { source: "/integrations", destination: "/connect", permanent: true },
      { source: "/nu", destination: "/", permanent: true },
      { source: "/playbooks", destination: "/", permanent: true },
      { source: "/playbooks/:slug", destination: "/", permanent: true },
      { source: "/proof", destination: "/benchmark", permanent: true },
      { source: "/radar", destination: "/score", permanent: true },
      { source: "/sell", destination: "/", permanent: true },
    ];
  },
  // Clean URLs for the standalone static apps we launch (served from public/<app>/index.html).
  async rewrites() {
    return [
      { source: "/lockin", destination: "/lockin/index.html" },
      { source: "/lockin/", destination: "/lockin/index.html" },
    ];
  },
};

// Wrap with Sentry's build config. SAFE + inert without provisioning: source-map upload auto-skips when
// SENTRY_AUTH_TOKEN is absent, and the runtime SDK is disabled without a DSN. `silent` keeps the build quiet.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // org/project/authToken come from env when you provision Sentry; without them, upload is skipped.
});
