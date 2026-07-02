import { describe, it, expect } from "vitest";
import { tenantNamespace, namespacedResource, isolationContract, repoFromUrl } from "./hosting";

describe("tenantNamespace — stable + distinct per tenant", () => {
  it("is stable for the same identity (idempotent re-runs)", () => {
    expect(tenantNamespace({ companyId: "co_1" })).toBe(tenantNamespace({ companyId: "co_1" }));
  });
  it("differs across tenants (no shared namespace)", () => {
    expect(tenantNamespace({ companyId: "co_1" })).not.toBe(tenantNamespace({ companyId: "co_2" }));
  });
  it("prefers companyId, falls back to ownerEmail, empty when neither", () => {
    expect(tenantNamespace({ ownerEmail: "a@x.com" })).not.toBe("");
    expect(tenantNamespace({})).toBe("");
  });
  it("is case-insensitive on the seed", () => {
    expect(tenantNamespace({ ownerEmail: "A@X.com" })).toBe(tenantNamespace({ ownerEmail: "a@x.com" }));
  });
});

describe("namespacedResource — two tenants can't collide", () => {
  it("suffixes the base with the tenant namespace", () => {
    const r = namespacedResource("my-app", { companyId: "co_1" });
    expect(r.startsWith("my-app-")).toBe(true);
  });
  it("gives DISTINCT repos for the same idea across tenants", () => {
    expect(namespacedResource("my-app", { companyId: "co_1" })).not.toBe(namespacedResource("my-app", { companyId: "co_2" }));
  });
  it("returns the bare base when there's no tenant identity (offline/sim parity)", () => {
    expect(namespacedResource("my-app", {})).toBe("my-app");
  });
  it("stays within GitHub's repo-name limit", () => {
    const long = "x".repeat(200);
    expect(namespacedResource(long, { companyId: "co_1" }).length).toBeLessThanOrEqual(100);
  });
});

describe("isolationContract — the Governed guarantees are explicit", () => {
  it("names the per-tenant + eject guarantees", () => {
    const c = isolationContract().join(" ").toLowerCase();
    expect(c).toMatch(/per-tenant/);
    expect(c).toMatch(/eject|own/);
  });
});

describe("repoFromUrl — recovering the owned repo from a shipped URL", () => {
  it("derives owner/name from GitHub Pages project URLs", () => {
    expect(repoFromUrl("https://kindred.github.io/kindred-mvp/")).toBe("kindred/kindred-mvp");
  });
  it("derives from github.com repo URLs", () => {
    expect(repoFromUrl("https://github.com/acme/site")).toBe("acme/site");
  });
  it("handles user-pages roots", () => {
    expect(repoFromUrl("https://kindred.github.io/")).toBe("kindred/kindred.github.io");
  });
  it("returns null for external/imported URLs (row must not render)", () => {
    expect(repoFromUrl("https://lockin.example.com/")).toBeNull();
    expect(repoFromUrl("http://kindred.github.io/x/")).toBeNull();
    expect(repoFromUrl("not a url")).toBeNull();
  });
});
