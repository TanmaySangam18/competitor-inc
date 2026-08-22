import { describe, it, expect } from "vitest";
import { channels, getChannel, defaultChannel } from "./channels";
import { ROLES, DEPARTMENTS } from "@/lib/org/organization";

describe("channels are derived from the org, never configured twice", () => {
  it("has exactly the channels the roles actually report into", () => {
    const fromRoles = new Set(ROLES.map((r) => r.channel));
    expect(new Set(channels().map((c) => c.id))).toEqual(fromRoles);
  });

  it("counts real members in each", () => {
    let total = 0;
    for (const c of channels()) {
      expect(c.memberCount).toBeGreaterThan(0);
      total += c.memberCount;
    }
    expect(total).toBe(ROLES.length); // every agent lands in exactly one channel
  });

  it("gives every channel a lead who can answer", () => {
    for (const c of channels()) expect(c.lead, c.id).not.toBeNull();
  });

  it("carries the department mission as the channel purpose", () => {
    for (const c of channels()) {
      const dept = DEPARTMENTS.find((d) => d.id === c.departmentId)!;
      expect(c.purpose).toBe(dept.mission);
    }
  });

  it("accepts a channel name with or without the hash", () => {
    expect(getChannel("#eng")?.id).toBe("#eng");
    expect(getChannel("eng")?.id).toBe("#eng");
    expect(getChannel("nope")).toBeUndefined();
  });

  it("opens in the executive channel by default", () => {
    expect(defaultChannel().id).toBe("#exec");
  });
});
