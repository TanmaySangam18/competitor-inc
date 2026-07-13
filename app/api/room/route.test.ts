import { describe, it, expect } from "vitest";
import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://x/api/room", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

describe("/api/room — the team room", () => {
  it("convenes a room for a task", async () => {
    const j = await (await post({ task: "build a booking tool for a dog groomer" })).json();
    expect(j.ok).toBe(true);
    expect(j.conversation.turns[0].kind).toBe("open");
    expect(j.conversation.turns.at(-1).kind).toBe("decision");
  });

  it("surfaces an escalation for a high-consequence task", async () => {
    const j = await (await post({ task: "wire a $5000 payment to a vendor" })).json();
    expect(j.conversation.decision).toBe("escalate-to-founder");
  });

  it("400s on a missing task (fail-closed)", async () => {
    const r = await post({});
    expect(r.status).toBe(400);
  });

  it("400s on invalid json", async () => {
    const r = await post("{not json");
    expect(r.status).toBe(400);
  });

  it("400s on an oversized task", async () => {
    const r = await post({ task: "x".repeat(2001) });
    expect(r.status).toBe(400);
  });
});
