import { describe, it, expect } from "vitest";
import { normalizeHost, ownershipToken, txtContainsToken } from "./ownership";

describe("normalizeHost — bare host from any input", () => {
  it("strips scheme, path, and www", () => {
    expect(normalizeHost("https://www.acme.com/pricing")).toBe("acme.com");
    expect(normalizeHost("acme.com")).toBe("acme.com");
    expect(normalizeHost("HTTP://Acme.io")).toBe("acme.io");
  });
  it("keeps subdomains other than www", () => {
    expect(normalizeHost("https://app.acme.com")).toBe("app.acme.com");
  });
  it("rejects non-hosts", () => {
    expect(normalizeHost("not a domain")).toBeNull();
    expect(normalizeHost("localhost")).toBeNull(); // no public TLD
    expect(normalizeHost("")).toBeNull();
  });
});

describe("ownershipToken — deterministic, per-(subject,host), un-guessable", () => {
  it("is stable for the same subject+host", () => {
    const a = ownershipToken("founder@x.com", "acme.com");
    const b = ownershipToken("founder@x.com", "https://www.acme.com");
    expect(a).toBe(b);
    expect(a.startsWith("competitor-inc-verify=")).toBe(true);
  });
  it("differs by subject and by host (can't claim another's domain)", () => {
    expect(ownershipToken("a@x.com", "acme.com")).not.toBe(ownershipToken("b@x.com", "acme.com"));
    expect(ownershipToken("a@x.com", "acme.com")).not.toBe(ownershipToken("a@x.com", "other.com"));
  });
  it("returns empty for junk input", () => {
    expect(ownershipToken("", "acme.com")).toBe("");
    expect(ownershipToken("a@x.com", "not a domain")).toBe("");
  });
});

describe("txtContainsToken — match across chunked DNS records", () => {
  const token = ownershipToken("founder@x.com", "acme.com");
  it("finds the token in a chunked TXT record", () => {
    expect(txtContainsToken([["some-other=1"], [token]], token)).toBe(true);
    expect(txtContainsToken([[token.slice(0, 10), token.slice(10)]], token)).toBe(true); // re-joined chunks
  });
  it("is false when absent or token empty", () => {
    expect(txtContainsToken([["nope"]], token)).toBe(false);
    expect(txtContainsToken([[token]], "")).toBe(false);
  });
});
