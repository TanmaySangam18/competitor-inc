import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

function post(body: unknown) {
  return new Request("http://x/api/plan", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/plan", () => {
  it("GET returns the capability descriptor", async () => {
    const j = await (await GET()).json();
    expect(j.ok).toBe(true);
    expect(j.capability).toBe("plan");
  });

  it("POST a goal → a coordinated plan", async () => {
    const res = await POST(post({ goal: "a booking tool for a dog groomer" }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.plan.tasks.length).toBeGreaterThan(0);
    expect(j.plan.chain.length).toBe(j.plan.tasks.length);
  });

  it("POST rejects empty, oversized, or non-JSON with 400", async () => {
    expect((await POST(post({ goal: "" }))).status).toBe(400);
    expect((await POST(post({ goal: "x".repeat(501) }))).status).toBe(400);
    expect((await POST(post("not json"))).status).toBe(400);
  });
});
