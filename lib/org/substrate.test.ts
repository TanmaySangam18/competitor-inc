import { describe, it, expect } from "vitest";
import { emptySubstrate, attachProduct, contribute, sharedContext, groundOnSubstrate } from "./substrate";
import type { GroundRecord } from "@/lib/engine/grounding";

const crm: GroundRecord[] = [
  { id: "cust-1", text: "Acme Corp — enterprise plan, renews in March, main contact Dana" },
  { id: "cust-2", text: "Beexcept LLC — trial, churned after the billing export bug" },
];
const helpdesk: GroundRecord[] = [
  { id: "tkt-1", text: "Dana at Acme asked about SSO — promised a follow-up by Friday" },
];

describe("substrate (P4) — the shared company graph products compound on", () => {
  it("COMPOUNDING: a 2nd product grounds on the 1st product's data the moment it joins", () => {
    let s = emptySubstrate("owner-acme-vendor");
    s = contribute(s, "crm", crm); // product 1 fills the graph
    s = attachProduct(s, "helpdesk"); // product 2 joins — inherits everything, starts full not empty
    const ctx = sharedContext(s, "helpdesk");
    expect(ctx.records).toHaveLength(2); // helpdesk sees CRM's records immediately
    expect(ctx.siblings).toEqual(["crm"]); // shares identity + data with its sibling
    // and it can actually answer from the shared graph
    const ans = groundOnSubstrate(s, "when does Acme renew?");
    expect(ans.abstained).toBe(false);
    expect(ans.citations.some((c) => c.id === "cust-1")).toBe(true);
  });

  it("the graph GROWS as products contribute; dedupes on record id", () => {
    let s = contribute(emptySubstrate("o"), "crm", crm);
    s = contribute(s, "helpdesk", helpdesk); // adds a new fact
    expect(s.records).toHaveLength(3);
    s = contribute(s, "crm", crm); // re-contribute same → no duplicates
    expect(s.records).toHaveLength(3);
    expect(s.products).toEqual(["crm", "helpdesk"]);
  });

  it("ISOLATION by construction: one customer's substrate can never surface another's data", () => {
    const a = contribute(emptySubstrate("owner-a"), "crm", crm);
    const b = contribute(emptySubstrate("owner-b"), "notes", [{ id: "n-1", text: "owner B secret roadmap" }]);
    // grounding owner-a's substrate for owner-b's unique term finds NOTHING — B's data isn't in A's graph
    expect(groundOnSubstrate(a, "roadmap secret").abstained).toBe(true);
    // and each only ever cites its own
    expect(groundOnSubstrate(a, "Acme renew").citations.every((c) => c.id.startsWith("cust"))).toBe(true);
    expect(groundOnSubstrate(b, "roadmap").citations.every((c) => c.id === "n-1")).toBe(true);
  });

  it("ABSTAINS honestly when the shared graph has no answer (never fabricates)", () => {
    const s = contribute(emptySubstrate("o"), "crm", crm);
    const ans = groundOnSubstrate(s, "what is our AWS quantum budget?");
    expect(ans.abstained).toBe(true);
    expect(ans.citations).toHaveLength(0);
    expect(ans.answer.toLowerCase()).toContain("company data"); // names whose graph it looked in
  });

  it("attach is idempotent; siblings exclude self", () => {
    let s = attachProduct(emptySubstrate("o"), "crm");
    s = attachProduct(s, "crm");
    expect(s.products).toEqual(["crm"]);
    expect(sharedContext(s, "crm").siblings).toEqual([]);
  });
});
