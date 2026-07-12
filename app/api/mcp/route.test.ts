import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

const call = (method: string, params?: unknown, id: number | string = 1) =>
  POST(new Request("http://x/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) }));

describe("/api/mcp — the MCP transport", () => {
  it("GET advertises the transport + tools", async () => {
    const j = await (await GET()).json();
    expect(j.transport).toBe("mcp");
    expect(j.tools).toContain("build_and_run_software");
  });

  it("initialize returns server info", async () => {
    const j = await (await call("initialize")).json();
    expect(j.result.serverInfo.name).toBe("competitor.inc");
  });

  it("tools/list returns every tool with an inputSchema", async () => {
    const j = await (await call("tools/list")).json();
    expect(j.result.tools.length).toBe(4);
    const build = j.result.tools.find((t: { name: string }) => t.name === "build_and_run_software");
    expect(build.inputSchema.required).toContain("goal");
  });

  it("tools/call runs a governed tool", async () => {
    const j = await (await call("tools/call", { name: "build_and_run_software", arguments: { goal: "a booking tool" } })).json();
    expect(j.result.isError).toBeFalsy();
    expect(j.result.content[0].text).toMatch(/build_and_run_software/);
  });

  it("tools/call denies a missing required field (fail-closed)", async () => {
    const j = await (await call("tools/call", { name: "build_and_run_software", arguments: {} })).json();
    expect(j.result.isError).toBe(true);
    expect(j.result.content[0].text).toMatch(/missing required/);
  });

  it("tools/call routes a human-reserved action to approval, never executes", async () => {
    const j = await (await call("tools/call", { name: "operate_product", arguments: { productId: "p1" }, requestedAction: "move_money" })).json();
    expect(j.result.content[0].text).toMatch(/approval|will NOT/i);
  });

  it("unknown method → JSON-RPC -32601", async () => {
    const j = await (await call("frobnicate")).json();
    expect(j.error.code).toBe(-32601);
  });
});
