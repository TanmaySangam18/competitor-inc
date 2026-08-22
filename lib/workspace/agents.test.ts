import { describe, it, expect } from "vitest";
import {
  allAgents, getAgent, agentsInChannel, agentPersona, mentionedAgents, routeMessage, handleOf, HOUSE_RULES,
} from "./agents";
import { ROLES, getRole, orgSize } from "@/lib/org/organization";
import { FLOOR } from "@/lib/core/hard-stops";

describe("every org role becomes someone you can talk to", () => {
  it("exposes all of them, with no gaps", () => {
    expect(allAgents()).toHaveLength(orgSize());
    for (const a of allAgents()) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.handle).toBe(`@${a.id}`);
      expect(a.channel).toMatch(/^#/);
      expect(a.departmentName.length).toBeGreaterThan(0);
    }
  });

  it("gives every agent a unique handle, because two colleagues cannot share a name", () => {
    const handles = allAgents().map((a) => a.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it("resolves an unknown id to undefined rather than inventing a colleague", () => {
    expect(getAgent("chief-vibes-officer")).toBeUndefined();
  });

  it("puts every agent in exactly one channel that exists", () => {
    for (const a of allAgents()) expect(agentsInChannel(a.channel).map((x) => x.id)).toContain(a.id);
  });
});

describe("the persona is DERIVED from the role, so it cannot drift from the org chart", () => {
  const designer = getRole("product-designer")!;

  it("carries the role's own mandate, job and responsibilities", () => {
    const p = agentPersona(designer);
    expect(p).toContain(designer.title);
    expect(p).toContain(designer.mandate);
    expect(p).toContain(designer.jobDescription);
    for (const r of designer.responsibilities) expect(p).toContain(r);
  });

  it("tells the agent when to escalate, in the role's own words", () => {
    expect(agentPersona(designer)).toContain(designer.escalatesWhen);
  });

  it("names the reporting line, so an agent knows who its lead is", () => {
    const boss = getRole(designer.reportsTo!)!;
    expect(agentPersona(designer)).toContain(boss.title);
  });

  it("tells the single root it answers to the founder", () => {
    const root = ROLES.find((r) => r.reportsTo === null)!;
    expect(agentPersona(root)).toMatch(/report to the founder directly/i);
  });

  it("carries every house rule into all 56, not just a favoured few", () => {
    for (const role of ROLES) {
      const p = agentPersona(role);
      for (const rule of HOUSE_RULES) expect(p, role.id).toContain(rule);
    }
  });

  it("states the six hard-stops inside the prompt itself", () => {
    // A rail the model never sees is not a rail. This is the anti-drift tripwire for the persona.
    const p = agentPersona(designer);
    for (const stop of FLOOR) expect(p).toContain(stop);
  });

  it("forbids inventing numbers and states the real revenue, in every persona", () => {
    for (const role of ROLES) {
      const p = agentPersona(role);
      expect(p, role.id).toMatch(/\$0 settled revenue and zero customers/);
      expect(p, role.id).toMatch(/Never state a number/);
    }
  });

  it("separates verified context from the persona, and includes it when given", () => {
    const p = agentPersona(designer, "coverage is 81.6%");
    expect(p).toMatch(/VERIFIED FACTS/);
    expect(p).toContain("coverage is 81.6%");
    expect(agentPersona(designer)).not.toMatch(/VERIFIED FACTS/);
  });

  it("names the founder-only actions when the role has them", () => {
    const withStops = ROLES.find((r) => r.humanApprovalFor.length > 0)!;
    const p = agentPersona(withStops);
    expect(p).toMatch(/FOUNDER'S SIGN-OFF/);
    for (const a of withStops.humanApprovalFor) expect(p).toContain(a);
  });
});

describe("@mentions", () => {
  it("finds a real colleague by handle", () => {
    expect(mentionedAgents("hey @product-designer can you look at this").map((a) => a.id)).toEqual(["product-designer"]);
  });

  it("ignores a handle that is not a colleague instead of guessing", () => {
    expect(mentionedAgents("@nobody-here please help")).toEqual([]);
  });

  it("is case-insensitive and de-duplicates", () => {
    const found = mentionedAgents("@Product-Designer and @product-designer");
    expect(found).toHaveLength(1);
  });

  it("finds several", () => {
    const ids = mentionedAgents("@product-designer @qa-lead both please").map((a) => a.id);
    expect(ids).toContain("product-designer");
    expect(ids).toContain("qa-lead");
  });
});

describe("routing: who answers when", () => {
  it("gives an explicit mention priority over the channel lead", () => {
    // Being answered by someone other than the person you addressed is the worst behaviour a chat
    // system can have, so this is asserted rather than left to chance.
    const r = routeMessage("@product-designer thoughts?", "#exec")!;
    expect(r.agent.id).toBe("product-designer");
    expect(r.why).toBe("addressed by name");
  });

  it("routes an unaddressed message to the channel's lead", () => {
    const r = routeMessage("what should we do about the landing page?", "#product")!;
    expect(r.agent.id).toBe("head-of-product");
    expect(r.why).toMatch(/leads/i);
  });

  it("finds someone for every real channel", () => {
    for (const ch of new Set(ROLES.map((r) => r.channel))) {
      expect(routeMessage("hello", ch), ch).not.toBeNull();
    }
  });

  it("returns null for a channel nobody is in, rather than picking at random", () => {
    expect(routeMessage("hello", "#does-not-exist")).toBeNull();
  });

  it("handleOf is the inverse of the id", () => {
    expect(handleOf("qa-lead")).toBe("@qa-lead");
  });
});
