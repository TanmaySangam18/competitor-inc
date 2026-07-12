import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

function post(body: unknown) {
  return new Request("http://x/api/deliberate", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/deliberate", () => {
  it("GET returns the capability descriptor", async () => {
    const j = await (await GET()).json();
    expect(j.ok).toBe(true);
    expect(j.capability).toBe("deliberate");
  });

  it("POST a task → a governed Decision Record", async () => {
    const res = await POST(post({ task: "launch a paid ads campaign for $2000" }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.record.decision).toBe("escalate-to-founder"); // money → the floor
    expect(j.record.participants.length).toBeGreaterThanOrEqual(2);
    expect(j.record.simulated).toBe(true); // no reasoner wired yet — honest flag
  });

  it("POST rejects empty, oversized, or non-JSON with 400", async () => {
    expect((await POST(post({ task: "" }))).status).toBe(400);
    expect((await POST(post({ task: "x".repeat(501) }))).status).toBe(400);
    expect((await POST(post("not json"))).status).toBe(400);
  });
});
