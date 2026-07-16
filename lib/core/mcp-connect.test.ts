import { describe, it, expect, vi } from "vitest";
import { MCP_CONNECTIONS, mcpStatus, governedMcpCall } from "./mcp-connect";
import { killSwitch } from "@/lib/core/killswitch";

const sentry = MCP_CONNECTIONS[0];
const env = { MCP_SENTRY_URL: "https://mcp.example/sentry", MCP_SENTRY_TOKEN: "tok" };

const okFetch = (result: unknown) =>
  vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result }) })) as unknown as typeof fetch;

describe("MCP as the universal connector (governed pipe)", () => {
  it("status reflects configuration from env, not wishes", () => {
    const s = mcpStatus(env);
    expect(s.find((c) => c.id === "mcp-sentry")?.configured).toBe(true);
    expect(s.find((c) => c.id === "mcp-linear")?.configured).toBe(false);
  });

  it("unconnected server → honest error, no network", async () => {
    const f = vi.fn();
    const r = await governedMcpCall(sentry, "list_issues", {}, { env: {}, fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("a READ passes governance (T1 auto), sends JSON-RPC tools/call with the bearer token", async () => {
    const f = okFetch({ content: [{ type: "text", text: "3 issues" }] });
    const r = await governedMcpCall(sentry, "list_issues", { project: "x" }, { env, fetchImpl: f, readOnly: true });
    expect(r.ok).toBe(true);
    const [url, init] = (f as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(env.MCP_SENTRY_URL);
    const body = JSON.parse(String(init.body));
    expect(body.method).toBe("tools/call");
    expect(body.params).toEqual({ name: "list_issues", arguments: { project: "x" } });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok");
  });

  it("a WRITE queues for the human (default-deny) — no network fires", async () => {
    const f = vi.fn();
    const r = await governedMcpCall(sentry, "create_issue", { title: "x" }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.governed).toBe("QUEUE");
    expect(f).not.toHaveBeenCalled();
  });

  it("the kill switch stops MCP calls BEFORE any network I/O (the spine holds)", async () => {
    killSwitch.engageGlobal();
    try {
      const f = vi.fn();
      const r = await governedMcpCall(sentry, "list_issues", {}, { env, fetchImpl: f as unknown as typeof fetch, readOnly: true });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.governed).toBe("BLOCK");
      expect(f).not.toHaveBeenCalled(); // governance first, network never
    } finally {
      killSwitch.disengageGlobal();
    }
  });

  it("server-side JSON-RPC error surfaces honestly", async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, error: { message: "unknown tool" } }) })) as unknown as typeof fetch;
    const r = await governedMcpCall(sentry, "nope", {}, { env, fetchImpl: f, readOnly: true });
    expect(r).toMatchObject({ ok: false, error: "unknown tool" });
  });
});
