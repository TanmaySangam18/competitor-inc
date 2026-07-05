// Phase C — the connector layer. The real external services the agent org can operate, each behind the
// founder's OWN scoped credential (per our onboarding decision: scoped tokens / OAuth-App connect buttons,
// NEVER session takeover). "Connect once, agents operate inside it." Consequential connectors (anything
// outbound) never auto-fire — they route a draft to the human's desk for approval (Phase D). Pure.

export type ConnectorId = "github" | "email" | "ads" | "bluesky" | "mastodon" | "reddit";
export type ConnectorCategory = "build" | "outreach" | "social" | "ads";

export interface Connector {
  id: ConnectorId;
  label: string;
  category: ConnectorCategory;
  capabilityKey: string; // key in capabilities() that reports if it's connected
  connect: string; // how the founder connects it (scoped, revocable)
  consequential: boolean; // outbound → requires approval, never auto-fires
}

export const CONNECTORS: Connector[] = [
  { id: "github", label: "GitHub", category: "build", capabilityKey: "github", connect: "Fine-grained token / GitHub App (per-repo)", consequential: false },
  { id: "email", label: "Email (Resend)", category: "outreach", capabilityKey: "email", connect: "Resend API key + verified from-domain", consequential: true },
  { id: "ads", label: "Ads webhook", category: "ads", capabilityKey: "ads", connect: "Your ad pipeline webhook URL (SSRF-guarded)", consequential: true },
  { id: "bluesky", label: "Bluesky", category: "social", capabilityKey: "bluesky", connect: "App password (AT Protocol)", consequential: true },
  { id: "mastodon", label: "Mastodon", category: "social", capabilityKey: "mastodon", connect: "Instance URL + access token", consequential: true },
  { id: "reddit", label: "Reddit", category: "social", capabilityKey: "reddit", connect: "OAuth app credentials", consequential: true },
];

// Given capabilities() output, report each connector's live status. `caps` is Record<string, boolean>.
export function connectorStatus(caps: Record<string, boolean>): { connector: Connector; connected: boolean }[] {
  return CONNECTORS.map((connector) => ({ connector, connected: !!caps[connector.capabilityKey] }));
}
