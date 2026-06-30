import { describe, it, expect } from "vitest";
import { fetchSiteText } from "./importer";

// These exercise the input + SSRF guards, which fail BEFORE any network call — so no network needed.
describe("fetchSiteText — input + SSRF guards", () => {
  it("rejects a malformed URL", async () => {
    const r = await fetchSiteText("not a url at all %%%");
    expect(r.ok).toBe(false);
  });

  it("blocks localhost / internal hosts (SSRF)", async () => {
    const r = await fetchSiteText("http://localhost:3000/admin");
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("blocks a private IP (SSRF)", async () => {
    const r = await fetchSiteText("http://169.254.169.254/latest/meta-data");
    expect(r.ok).toBe(false);
  });
});
