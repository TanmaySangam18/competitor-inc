import { describe, it, expect } from "vitest";
import { authoriseApproval, isDeployed, isLocalOperator } from "./who";

const req = (url = "http://localhost:3100/api/workspace", headers: Record<string, string> = {}) =>
  new Request(url, { method: "POST", headers });

describe("is this a laptop or a deployment", () => {
  it("recognises the platforms that would make loopback meaningless", () => {
    for (const k of ["VERCEL", "VERCEL_ENV", "AWS_LAMBDA_FUNCTION_NAME", "FLY_APP_NAME", "RENDER", "K_SERVICE"]) {
      expect(isDeployed({ [k]: "1" }), k).toBe(true);
    }
  });

  it("treats a bare environment as local", () => {
    expect(isDeployed({})).toBe(false);
  });
});

describe("loopback is a proof on a laptop and NOTHING on a deployment", () => {
  it("accepts the loopback names locally", () => {
    for (const h of ["http://localhost:3100/x", "http://127.0.0.1:3000/x"]) {
      expect(isLocalOperator(req(h), {}), h).toBe(true);
    }
  });

  it("REFUSES loopback once deployed, which is the whole reason this is safe", () => {
    // On a platform every request arrives from the platform's own proxy and would look local. If this
    // check were missing, anyone on the internet could approve a build.
    expect(isLocalOperator(req("http://localhost:3100/x"), { VERCEL: "1" })).toBe(false);
    expect(isLocalOperator(req("http://127.0.0.1/x"), { VERCEL_ENV: "production" })).toBe(false);
  });

  it("refuses a non-loopback host even locally", () => {
    for (const h of ["http://example.com/x", "http://10.0.0.67:3100/x", "http://localhost.evil.com/x", "http://127.0.0.1.evil.com/x"]) {
      expect(isLocalOperator(req(h), {}), h).toBe(false);
    }
  });
});

describe("the operator secret", () => {
  it("accepts the right secret", async () => {
    const env = { WORKSPACE_APPROVAL_SECRET: "s3cret", VERCEL: "1" };
    const r = await authoriseApproval(req("http://app.example.com/x", { "x-workspace-approval": "s3cret" }), env);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.proof).toBe("operator-secret");
  });

  it("refuses a wrong secret", async () => {
    const env = { WORKSPACE_APPROVAL_SECRET: "s3cret", VERCEL: "1" };
    const r = await authoriseApproval(req("http://app.example.com/x", { "x-workspace-approval": "wrong!" }), env);
    expect(r.ok).toBe(false);
  });

  it("refuses a prefix of the secret, so a length-guess cannot walk it", async () => {
    const env = { WORKSPACE_APPROVAL_SECRET: "s3cret", VERCEL: "1" };
    const r = await authoriseApproval(req("http://app.example.com/x", { "x-workspace-approval": "s3c" }), env);
    expect(r.ok).toBe(false);
  });

  it("an unset secret cannot be satisfied by an empty header", async () => {
    const env = { VERCEL: "1" };
    const r = await authoriseApproval(req("http://app.example.com/x", { "x-workspace-approval": "" }), env);
    expect(r.ok).toBe(false);
  });
});

describe("FAIL CLOSED: an approval from nobody is not an approval", () => {
  it("refuses a deployed request with no session and no secret", async () => {
    const r = await authoriseApproval(req("http://app.example.com/x"), { VERCEL: "1" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toMatch(/loopback proves nothing/i);
      expect(r.reason).toMatch(/Sign in/); // and it says what to do
    }
  });

  it("names what to configure when local and unidentifiable", async () => {
    const r = await authoriseApproval(req("http://10.0.0.67:3100/x"), {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/WORKSPACE_APPROVAL_SECRET/);
  });

  it("lets the local operator through on a laptop, so the workspace still works", async () => {
    const r = await authoriseApproval(req(), {});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.proof).toBe("loopback");
  });

  it("survives a malformed url without throwing", async () => {
    const bad = { url: "not a url", headers: new Headers() } as unknown as Request;
    const r = await authoriseApproval(bad, {});
    expect(r.ok).toBe(false);
  });
});
