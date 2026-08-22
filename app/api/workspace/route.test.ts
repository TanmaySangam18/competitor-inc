import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/workspace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));

describe("GET describes the workspace without doing anything", () => {
  it("lists the real channels and the honest model state", async () => {
    const d = await (await GET()).json();
    expect(d.ok).toBe(true);
    expect(d.channels.length).toBeGreaterThan(5);
    expect(typeof d.modelConfigured).toBe("boolean");
    for (const c of d.channels) {
      expect(c.id).toMatch(/^#/);
      expect(c.members).toBeGreaterThan(0);
      expect(c.lead).toBeTruthy(); // no channel where nobody can answer
    }
  });
});

describe("input validation, before anything is spent", () => {
  it("rejects non-json", async () => {
    const res = await POST(new Request("http://localhost/api/workspace", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });

  it("rejects empty text", async () => {
    expect((await post({ text: "   ", channel: "#exec" })).status).toBe(400);
  });

  it("rejects text over the cap, so one message cannot blow the context budget", async () => {
    expect((await post({ text: "x".repeat(4001), channel: "#exec" })).status).toBe(400);
  });

  it("rejects a channel that does not exist rather than picking one", async () => {
    const res = await post({ text: "hello", channel: "#not-a-channel" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no channel/);
  });

  it("defaults to the executive channel when none is given", async () => {
    const d = await (await post({ text: "hello" })).json();
    expect(d.ok).toBe(true);
    expect(d.speaker.id).toBe("chief-of-staff");
  });
});

describe("routing, over the wire", () => {
  it("sends an unaddressed product question to the product lead", async () => {
    const d = await (await post({ text: "what should we build next?", channel: "#product" })).json();
    expect(d.speaker.id).toBe("head-of-product");
    expect(d.speaker.why).toMatch(/leads/i);
  });

  it("honours an @mention over the channel lead", async () => {
    const d = await (await post({ text: "@product-designer can you soften the canvas?", channel: "#exec" })).json();
    expect(d.speaker.id).toBe("product-designer");
    expect(d.speaker.title).toBe("Product Designer");
    expect(d.speaker.why).toBe("addressed by name");
  });

  it("names the speaker in every reply, so a message is never anonymous", async () => {
    for (const ch of ["#exec", "#eng", "#growth", "#finance", "#quality", "#ops", "#knowledge", "#product"]) {
      const d = await (await post({ text: "status?", channel: ch })).json();
      expect(d.ok, ch).toBe(true);
      expect(d.speaker.title, ch).toBeTruthy();
      expect(d.speaker.handle, ch).toMatch(/^@/);
    }
  });
});

describe("THE HONESTY CONTRACT: no model means no words, not invented words", () => {
  it("returns a null reply and says why, rather than simulating a colleague", async () => {
    // The test environment has no model key. That is the condition being asserted: a company whose
    // whole thesis is verifiable output must not fabricate an employee's answer to look alive.
    const d = await (await post({ text: "what is our revenue?", channel: "#finance" })).json();
    expect(d.ok).toBe(true);
    if (!d.modelConfigured) {
      expect(d.reply).toBeNull();
      expect(d.note).toMatch(/No model key is configured/);
      expect(d.note).toMatch(/will invent a reply/);
    }
  });

  it("never returns a reply and a note claiming no model at the same time", async () => {
    const d = await (await post({ text: "hello", channel: "#exec" })).json();
    if (d.reply) expect(d.note ?? "").not.toMatch(/No model key/);
  });
});
