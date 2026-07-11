import { describe, it, expect } from "vitest";
import { COMPETITOR_TOOLS, HUMAN_RESERVED, isReserved, dispatchTool } from "./tools";

describe("governed tool surface — the human-principal gate on every request (system #7)", () => {
  it("exposes the company's tools with required-field contracts", () => {
    const names = COMPETITOR_TOOLS.map((t) => t.name);
    expect(names).toContain("build_and_run_software");
    expect(names).toContain("grounded_query");
    expect(COMPETITOR_TOOLS.find((t) => t.name === "build_and_run_software")?.requires).toContain("goal");
  });

  it("autonomous, low-risk work executes (the org acts)", () => {
    expect(dispatchTool({ name: "build_and_run_software", input: { goal: "a lab study tool" } }).status).toBe("done");
    expect(dispatchTool({ name: "grounded_query", input: { question: "what shipped in Q1?" } }).status).toBe("done");
  });

  it("fails closed on missing input (deny-by-default)", () => {
    const out = dispatchTool({ name: "build_and_run_software", input: {} });
    expect(out.status).toBe("denied");
    expect(out).toMatchObject({ reason: expect.stringContaining("goal") });
    expect(dispatchTool({ name: "grounded_query", input: { question: "  " } }).status).toBe("denied");
  });

  it("unknown tools are denied", () => {
    expect(dispatchTool({ name: "wire_money_now", input: {} }).status).toBe("denied");
  });

  it("HUMAN FLOOR: reserved actions are prepared for approval, NEVER executed autonomously", () => {
    for (const action of HUMAN_RESERVED) {
      const out = dispatchTool({ name: "build_and_run_software", input: { goal: "x" }, requestedAction: action });
      expect(out.status).toBe("approval_required"); // even a valid autonomous tool can't smuggle a reserved action through
      expect(out).toMatchObject({ action });
    }
    expect(isReserved("sign_contract")).toBe(true);
    expect(isReserved("write_code")).toBe(false);
  });

  it("business actions are always DRAFTED for the human, never performed", () => {
    const out = dispatchTool({ name: "prepare_business_action", input: { kind: "contract", details: "pilot with Prof. Rivera's lab" } });
    expect(out.status).toBe("approval_required");
    expect(out).toMatchObject({ action: "contract" });
  });

  it("is deterministic — same request, same outcome", () => {
    const req = { name: "grounded_query", input: { question: "revenue last month?" } };
    expect(dispatchTool(req)).toEqual(dispatchTool(req));
  });
});
