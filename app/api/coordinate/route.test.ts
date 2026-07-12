import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

function post(body: unknown) {
  return new Request("http://x/api/coordinate", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/coordinate", () => {
  it("GET returns the capability descriptor", async () => {
    const j = await (await GET()).json();
    expect(j.ok).toBe(true);
    expect(j.capability).toBe("coordinate");
  });

  it("POST a goal → plan + one decision per task + summary", async () => {
    const res = await POST(post({ goal: "a booking tool for a dog groomer" }));
    expect(res.status).toBe(200);
    const { coordination: c } = await res.json();
    expect(c.plan.tasks.length).toBeGreaterThan(0);
    expect(c.decisions.length).toBe(c.plan.tasks.length);
    expect(c.summary.proceed + c.summary.escalate).toBe(c.summary.tasks);
  });

  it("POST rejects empty, oversized, or non-JSON with 400", async () => {
    expect((await POST(post({ goal: "" }))).status).toBe(400);
    expect((await POST(post({ goal: "x".repeat(501) }))).status).toBe(400);
    expect((await POST(post("not json"))).status).toBe(400);
  });
});
