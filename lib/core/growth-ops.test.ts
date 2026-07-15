import { describe, it, expect } from "vitest";
import { badgeSnippet, badgeUrl, badgeRequired } from "./badge";
import { connectionStatus, goLiveReadiness, CONNECTIONS } from "./connections";
import { suggestNames, provisionPlan, slugify } from "./domains";

describe("built-with badge", () => {
  it("snippet is honest attribution linking home with a ref", () => {
    const s = badgeSnippet({ productName: "Dog Groomer Booking" });
    expect(s).toContain("Built with competitor");
    expect(s).toContain("ref=built-with");
    expect(badgeUrl("Dog Groomer Booking")).toMatch(/p=dog-groomer-booking/);
  });
  it("required on free/builder, optional on higher tiers", () => {
    expect(badgeRequired("free")).toBe(true);
    expect(badgeRequired("builder")).toBe(true);
    expect(badgeRequired("operator")).toBe(false);
    expect(badgeRequired("concierge")).toBe(false);
  });
});

describe("BYOK connections registry", () => {
  it("splits founder vs customer connections", () => {
    expect(connectionStatus("founder").length).toBeGreaterThan(0);
    expect(connectionStatus("customer").every((c) => c.owner === "customer")).toBe(true);
    expect(CONNECTIONS.find((c) => c.id === "c-model")?.purpose).toMatch(/THEIR AI spend/i);
  });
  it("detects an env-backed connection when set; manual items stay pending", () => {
    delete process.env.CONTROL_SECRET;
    expect(connectionStatus("founder").find((c) => c.id === "control-secret")!.configured).toBe(false);
    process.env.CONTROL_SECRET = "x";
    expect(connectionStatus("founder").find((c) => c.id === "control-secret")!.configured).toBe(true);
    delete process.env.CONTROL_SECRET;
    // a legal/manual item (no env) is never auto-detected as done
    expect(connectionStatus("founder").find((c) => c.id === "legal")!.configured).toBe(false);
  });
  it("goLiveReadiness reports what's still pending", () => {
    const r = goLiveReadiness();
    expect(r.required).toBeGreaterThan(0);
    expect(Array.isArray(r.pending)).toBe(true);
  });
});

describe("legal domain provisioning", () => {
  it("suggests slugged name options", () => {
    const names = suggestNames("Dog Groomer Booking");
    expect(names[0]).toBe("dog-groomer-booking");
    expect(names.length).toBeGreaterThan(1);
  });
  it("defaults to a free platform subdomain (commercial-OK), NOT a free-domain repo", () => {
    const p = provisionPlan("My App");
    expect(p.rail).toBe("platform-subdomain");
    expect(p.address).toBe("my-app.competitor.inc");
    expect(p.legalNote).toMatch(/NOT a free-domain-repo/i);
  });
  it("supports a customer-owned custom registrar", () => {
    const p = provisionPlan("My App", { rail: "custom-registrar" });
    expect(p.rail).toBe("custom-registrar");
    expect(p.legalNote).toMatch(/commercial-OK registrar/i);
  });
  it("slugify is safe", () => {
    expect(slugify("Hello, World!! ")).toBe("hello-world");
  });
});
