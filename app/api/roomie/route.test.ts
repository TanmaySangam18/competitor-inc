import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

function post(body: unknown) {
  return new Request("http://localhost/api/roomie", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const company = {
  id: "c1",
  name: "X",
  slug: "x",
  idea: "an idea",
  createdAt: 0,
  status: "operating",
  night: 0,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
};

describe("/api/roomie route", () => {
  it("GET returns a status payload", async () => {
    const data = await (await GET()).json();
    expect(data.ok).toBe(true);
    expect(typeof data.realModelConfigured).toBe("boolean");
  });

  it("400 on invalid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/roomie", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });

  it("400 on unknown kind", async () => {
    expect((await POST(post({ kind: "nope" }))).status).toBe(400);
  });

  it("400 on validate with no idea", async () => {
    expect((await POST(post({ kind: "validate" }))).status).toBe(400);
  });

  it("validate returns a validation", async () => {
    const res = await POST(post({ kind: "validate", idea: "a meal planner" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(["strong", "weak", "mixed"]).toContain(data.validation.verdict);
    expect(data.validation.experiments).toHaveLength(4);
  });

  it("shift returns activities + approvals", async () => {
    const data = await (await POST(post({ kind: "shift", company }))).json();
    expect(Array.isArray(data.activities)).toBe(true);
    expect(Array.isArray(data.approvals)).toBe(true);
  });

  it("chat streams a non-empty text reply", async () => {
    const res = await POST(post({ kind: "chat", company: { name: "X", idea: "an idea" }, message: "hello" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("400 on chat with empty message", async () => {
    expect((await POST(post({ kind: "chat", company: { name: "X", idea: "i" }, message: "  " }))).status).toBe(400);
  });
});
