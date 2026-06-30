import { describe, it, expect } from "vitest";
import { redactText, redactUrl } from "./redact";

describe("redactText — mask who, keep the proof", () => {
  it("masks an email to first-char + domain", () => {
    expect(redactText("sent to alice@acme.com")).toBe("sent to a***@acme.com");
  });
  it("masks secret/token shapes", () => {
    expect(redactText("charge sk_live_abcd1234efgh")).toBe("charge [secret]");
    expect(redactText("auth Bearer abcdef123456ghijkl")).toBe("auth [secret]");
  });
  it("leaves ordinary proof text untouched", () => {
    expect(redactText("Shipped the MVP — build passed")).toBe("Shipped the MVP — build passed");
  });
  it("handles empty/nullish", () => {
    expect(redactText("")).toBe("");
    expect(redactText(undefined)).toBe("");
  });
});

describe("redactUrl — keep the link, scrub the query/hash", () => {
  it("drops query + hash where PII hides, keeps origin + path", () => {
    expect(redactUrl("https://app.example.com/r/abc?email=a@b.com#user=42")).toBe("https://app.example.com/r/abc");
  });
  it("keeps a clean url intact", () => {
    expect(redactUrl("https://github.com/acme/mvp")).toBe("https://github.com/acme/mvp");
  });
  it("falls back to text redaction on a non-url", () => {
    expect(redactUrl("not a url a@b.com")).toBe("not a url a***@b.com");
  });
});
