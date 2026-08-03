// lib/core/connect-rail.ts — THE 30-MINUTE COMPANY (ADR-0027).
//
// Founder directive 2026-08-02: the ENTIRE connect stack becomes one guided flow inside /connect —
// no tab-hopping to provider dashboards, every service one of three in-place patterns, the whole
// company set up in a timed, receipted ~30 minutes. This module is the rail's pure model: which
// method each connection uses, the inline guidance shown in the modal, the honest time estimate,
// and the security posture stated per step. The UI renders this; it never invents its own copy.
//
// The one thing that stays on a provider page, deliberately: OAUTH CONSENT. Approval screens must
// live on the provider's own domain — that is the security model, and consent is one of the six
// human hard-stops. Done as a popup-and-return, it feels internal; swallowing it would be phishing.

import { CONNECTIONS, connectionStatus, type Owner } from "./connections";

export type ConnectMethod =
  | "oauth-popup" // provider consent in a popup opened from /connect; token returns via redirect
  | "manifest-link" // one-click pre-filled app creation (Slack manifest), then paste the issued token
  | "paste-in-place" // key/token pasted into the /connect modal, straight into the encrypted vault
  | "human-legal"; // entity, insurance, DSO letters — tracked, never automated

export interface RailStep {
  connectionId: string; // must exist in CONNECTIONS
  method: ConnectMethod;
  estMinutes: number; // honest median for a first-time user, provider account already existing
  inlineGuide: string[]; // the modal's step lines — complete enough that no docs hunt is needed
  securityNote: string; // what we store, how, and how to fire us — shown IN the modal
}

const VAULT_NOTE = "Stored encrypted at rest in your vault; never in our code or logs. Revoke any time on this page; deauthorize on the provider's page to be thorough.";

export const CONNECT_RAIL: RailStep[] = [
  {
    connectionId: "ai-model", method: "paste-in-place", estMinutes: 4,
    inlineGuide: [
      "Open your provider's console (Groq is free: console.groq.com) and create an API key.",
      "Paste it here. That's the whole step.",
      "The org starts thinking on the next heartbeat; you'll see it in the Stream.",
    ],
    securityNote: VAULT_NOTE,
  },
  {
    connectionId: "github", method: "paste-in-place", estMinutes: 5,
    inlineGuide: [
      "GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.",
      "Repository access: all repositories the org may build in. Permissions: contents, pull requests, actions (read/write).",
      "Paste the token here.",
    ],
    securityNote: VAULT_NOTE,
  },
  {
    connectionId: "hosting", method: "paste-in-place", estMinutes: 4,
    inlineGuide: [
      "Vercel → Account Settings → Tokens → Create.",
      "Scope: the team the org deploys to. Expiry: 1 year (you'll rotate from this page).",
      "Paste it here.",
    ],
    securityNote: VAULT_NOTE,
  },
  {
    connectionId: "slack", method: "manifest-link", estMinutes: 6,
    inlineGuide: [
      "Click the one-click link — Slack opens with the app fully pre-configured from our manifest (scopes, name, everything).",
      "Click Create, then Install to Workspace, then Allow (that consent screen is Slack's own page, by design).",
      "Copy the Bot Token (xoxb-…) and the Signing Secret from the app page into the two fields here.",
    ],
    securityNote: VAULT_NOTE + " The manifest asks for the minimum scopes the office needs; nothing hidden.",
  },
  {
    connectionId: "email-sending", method: "paste-in-place", estMinutes: 6,
    inlineGuide: [
      "Your email provider (AgentMail/Resend) → create an API key.",
      "Paste it here; we show the DNS records to add at your registrar (the one genuinely external step, and it's copy-paste).",
      "Verification usually lands within minutes; status flips green here when it does.",
    ],
    securityNote: VAULT_NOTE,
  },
  {
    connectionId: "payments", method: "paste-in-place", estMinutes: 5,
    inlineGuide: [
      "Polar → Settings → create an access token; create your products if you haven't (we show the exact tier config to mirror).",
      "Paste the token + webhook secret here.",
      "Money OUT stays human forever — this connection only lets the org see and reconcile, never move funds.",
    ],
    securityNote: VAULT_NOTE + " Funds custody never changes: your account, your money, our read-only reconciliation.",
  },
];

/** Steps not on the rail (legal/manual T2-T3 items) remain tracked on /connect but outside the 30-minute clock. */
export function railPlan(owner: Owner = "customer", env: Record<string, string | undefined> = process.env) {
  const status = connectionStatus(undefined, env);
  const steps = CONNECT_RAIL.map((step) => {
    const conn = status.find((c) => c.id === step.connectionId);
    return {
      ...step,
      name: conn?.name ?? step.connectionId,
      tier: conn?.tier ?? "T0",
      required: conn?.required ?? false,
      configured: conn?.configured ?? false,
    };
  });
  const remaining = steps.filter((s) => !s.configured);
  const minutesRemaining = remaining.reduce((m, s) => m + s.estMinutes, 0);
  return {
    steps,
    minutesRemaining,
    done: remaining.length === 0,
    claim: `${minutesRemaining} minutes of guided setup remaining — measured estimate, not a promise; the page times the real number.`,
  };
}

// ── Slack one-click manifest ─────────────────────────────────────────────────
/** The full Slack app config, pre-baked: the user clicks, Slack builds the app, nothing to configure. */
export function slackAppManifest(siteUrl: string) {
  return {
    display_information: {
      name: "competitor.inc office",
      description: "Your AI company's office: digests, escalations, approvals. Governed; every action audited.",
      background_color: "#0f0f0f",
    },
    features: {
      bot_user: { display_name: "competitor-inc", always_online: true },
    },
    oauth_config: {
      scopes: { bot: ["chat:write", "channels:read", "app_mentions:read", "im:write"] },
    },
    settings: {
      event_subscriptions: {
        request_url: `${siteUrl.replace(/\/$/, "")}/api/slack/events`,
        bot_events: ["app_mention", "message.im"],
      },
      interactivity: { is_enabled: true, request_url: `${siteUrl.replace(/\/$/, "")}/api/slack/interact` },
      org_deploy_enabled: false,
      socket_mode_enabled: false,
    },
  };
}

/** The one-click URL: opens Slack's app-creation page with our manifest pre-loaded. */
export function slackManifestUrl(siteUrl: string): string {
  const manifest = JSON.stringify(slackAppManifest(siteUrl));
  return `https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(manifest)}`;
}
