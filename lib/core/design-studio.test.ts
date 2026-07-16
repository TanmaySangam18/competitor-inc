import { describe, it, expect, vi } from "vitest";
import { designStudioStatus, requestDeliverable } from "./design-studio";
import { killSwitch } from "@/lib/core/killswitch";

const env = { OPEN_DESIGN_URL: "http://127.0.0.1:4820" };
const req = { kind: "landing" as const, brief: "launch page for Mealory" };

describe("Design Studio — governed access to the Open Design engine", () => {
  it("status is env-truth, not wishes", () => {
    expect(designStudioStatus({}).configured).toBe(false);
    expect(designStudioStatus(env)).toEqual({ configured: true, url: env.OPEN_DESIGN_URL });
  });

  it("not connected → honest error, no network", async () => {
    const f = vi.fn();
    const r = await requestDeliverable(req, { env: {}, fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("an allowed request POSTs the brief and returns the artifact WITH engine provenance", async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ artifact: "artifacts/mealory-landing/index.html" }) })) as unknown as typeof fetch;
    const r = await requestDeliverable(req, { env, fetchImpl: f });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.artifact.ref).toContain("mealory-landing");
      expect(r.artifact.engine).toBe("open-design (Apache-2.0)"); // attribution rides every deliverable
    }
    const [url, init] = (f as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:4820/api/artifacts");
    expect(JSON.parse(String(init.body)).brief).toContain("Mealory");
  });

  it("the kill switch blocks BEFORE any network I/O", async () => {
    killSwitch.engageGlobal();
    try {
      const f = vi.fn();
      const r = await requestDeliverable(req, { env, fetchImpl: f as unknown as typeof fetch });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.governed).toBe("BLOCK");
      expect(f).not.toHaveBeenCalled();
    } finally {
      killSwitch.disengageGlobal();
    }
  });

  it("a daemon reply with no artifact ref is a FAILURE, never a fake deliverable", async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch;
    const r = await requestDeliverable(req, { env, fetchImpl: f });
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toContain("nothing claimed");
  });
});
