import { describe, it, expect } from "vitest";
import {
  founderMessage, agentMessage, topLevel, repliesTo, pendingApprovals, transcriptFor, newId,
} from "./thread";

describe("the message model", () => {
  it("gives every message a unique id", () => {
    const ids = Array.from({ length: 200 }, () => newId());
    expect(new Set(ids).size).toBe(200);
  });

  it("marks who spoke, so a reply can never be mistaken for the founder", () => {
    expect(founderMessage("#exec", "hi").author).toEqual({ kind: "founder" });
    const a = agentMessage("#exec", "qa-lead", "QA Lead", "on it");
    expect(a.author).toEqual({ kind: "agent", agentId: "qa-lead", title: "QA Lead" });
  });

  it("separates top-level messages from thread replies", () => {
    const root = founderMessage("#eng", "ship it");
    const reply = agentMessage("#eng", "engineering-lead", "Engineering Lead", "yes", { parentId: root.id });
    const other = founderMessage("#product", "different channel");
    const all = [root, reply, other];

    expect(topLevel(all, "#eng").map((m) => m.id)).toEqual([root.id]);
    expect(repliesTo(all, root.id).map((m) => m.id)).toEqual([reply.id]);
    expect(topLevel(all, "#product").map((m) => m.id)).toEqual([other.id]);
  });

  it("surfaces approvals still waiting on the founder", () => {
    const waiting = agentMessage("#growth", "marketing-lead", "Marketing Lead", "ready", {
      approval: { what: "send the launch email", detail: "40 recipients", because: "outbound needs a human", state: "pending" },
    });
    const done = agentMessage("#growth", "marketing-lead", "Marketing Lead", "sent", {
      approval: { what: "earlier email", detail: "", because: "", state: "approved" },
    });
    expect(pendingApprovals([waiting, done]).map((m) => m.id)).toEqual([waiting.id]);
  });

  it("builds a transcript in order, using titles a person would recognise", () => {
    const a = founderMessage("#exec", "first");
    const b = agentMessage("#exec", "chief-of-staff", "Chief of Staff", "second");
    const t = transcriptFor([b, a], "#exec");
    expect(t).toBe("Founder: first\nChief of Staff: second");
  });

  it("caps the transcript so context cannot grow without bound", () => {
    const many = Array.from({ length: 40 }, (_, i) => founderMessage("#exec", `m${i}`));
    expect(transcriptFor(many, "#exec", 5).split("\n")).toHaveLength(5);
  });

  it("keeps channels separate in the transcript", () => {
    const here = founderMessage("#exec", "mine");
    const there = founderMessage("#eng", "theirs");
    expect(transcriptFor([here, there], "#exec")).toBe("Founder: mine");
  });
});
