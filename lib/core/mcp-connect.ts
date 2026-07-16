// ─────────────────────────────────────────────────────────────────────────────
// MCP AS THE UNIVERSAL CONNECTOR (cto.new adoption, founder-approved 2026-07-15).
//
// Instead of bespoke OAuth per service, the connection map's long tail (Sentry, Linear, Notion,
// analytics, CRM, …anything) plugs in as an MCP server: ONE client, ONE governed pipe. Every tool call
// passes governAction (kill switch → decide() floor/tiers → audit ledger) BEFORE any network I/O — an
// agent cannot reach an external system around the governance spine. BYOK holds: the customer's MCP
// server URLs + tokens, their accounts, their ownership.
//
// Transport: MCP streamable-HTTP (JSON-RPC 2.0 "tools/call"). Injectable fetch → unit-tested offline.
// ─────────────────────────────────────────────────────────────────────────────

import { governAction, type GovernOptions } from "@/lib/core/govern";
import type { AgentRole } from "@/lib/engine/types";

export interface McpConnection {
  id: string;
  name: string;
  purpose: string;
  department: AgentRole; // which department consumes it (the acting agent in the policy matrix)
  urlEnv: string; // env var holding the MCP server URL (per-tenant vault later; env first)
  tokenEnv?: string; // optional bearer-token env var
}

// The long tail of the connection map, as MCP plugs — extend freely; "custom" covers any MCP server.
export const MCP_CONNECTIONS: McpConnection[] = [
  { id: "mcp-sentry", name: "Sentry (errors)", purpose: "Incident loop input — errors + issues", department: "engineering", urlEnv: "MCP_SENTRY_URL", tokenEnv: "MCP_SENTRY_TOKEN" },
  { id: "mcp-linear", name: "Linear (tasks)", purpose: "Engineering task tracker", department: "engineering", urlEnv: "MCP_LINEAR_URL", tokenEnv: "MCP_LINEAR_TOKEN" },
  { id: "mcp-notion", name: "Notion (docs)", purpose: "Knowledge + docs the org reads/writes", department: "ops", urlEnv: "MCP_NOTION_URL", tokenEnv: "MCP_NOTION_TOKEN" },
  { id: "mcp-analytics", name: "Analytics", purpose: "Growth loop's ground truth", department: "growth", urlEnv: "MCP_ANALYTICS_URL", tokenEnv: "MCP_ANALYTICS_TOKEN" },
  { id: "mcp-crm", name: "CRM", purpose: "Sales pipeline reads/writes", department: "growth", urlEnv: "MCP_CRM_URL", tokenEnv: "MCP_CRM_TOKEN" },
  { id: "mcp-custom", name: "Custom MCP server", purpose: "Anything else — extensible by design", department: "ops", urlEnv: "MCP_CUSTOM_URL", tokenEnv: "MCP_CUSTOM_TOKEN" },
];

export function mcpStatus(env: Record<string, string | undefined> = process.env): Array<McpConnection & { configured: boolean }> {
  return MCP_CONNECTIONS.map((c) => ({ ...c, configured: Boolean(env[c.urlEnv]) }));
}

export type McpResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string; governed?: "BLOCK" | "QUEUE" };

/**
 * A governed MCP tool call. Governance rules FIRST (no network on BLOCK/QUEUE — a queued call waits for
 * the human like any other gated action), then a JSON-RPC 2.0 tools/call to the connected server.
 */
export async function governedMcpCall(
  conn: McpConnection,
  tool: string,
  args: Record<string, unknown>,
  opts: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined>; govern?: GovernOptions; readOnly?: boolean } = {},
): Promise<McpResult> {
  const env = opts.env ?? process.env;
  const url = env[conn.urlEnv];
  if (!url) return { ok: false, error: `${conn.name} not connected (set ${conn.urlEnv})` };

  // The spine: kill switch → decide() → audit. Reads (caller-declared) are T1 and may auto-run; writes
  // ride the unknown→T2 QUEUE path until a per-tool allowlist promotes them (default-deny).
  const g = governAction(
    { type: opts.readOnly ? "mcp_read" : "mcp_call", agent: conn.department, hasCredential: Boolean(env[conn.tokenEnv ?? ""] ?? url), reversible: opts.readOnly === true, observable: true },
    { ...opts.govern, input: `${conn.id}:${tool} ${JSON.stringify(args).slice(0, 400)}` },
  );
  if (g.decision.verdict !== "AUTO") {
    return { ok: false, error: `governed: ${g.decision.verdict} — ${g.decision.reason}`, governed: g.decision.verdict as "BLOCK" | "QUEUE" };
  }

  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(conn.tokenEnv && env[conn.tokenEnv] ? { authorization: `Bearer ${env[conn.tokenEnv]}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: args } }),
    });
    if (!res.ok) return { ok: false, error: `${conn.name} → HTTP ${res.status}` };
    const body = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (body.error) return { ok: false, error: body.error.message ?? "MCP server error" };
    return { ok: true, result: body.result };
  } catch (e) {
    return { ok: false, error: `network: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
