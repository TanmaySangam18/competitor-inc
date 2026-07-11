import { describe, it, expect } from "vitest";
import { retrieveRecords, groundOnRecords, type GroundRecord } from "./grounding";

const TICKETS: GroundRecord[] = [
  { id: "t1", text: "Login page throws a 500 when the password has a unicode character" },
  { id: "t2", text: "Billing invoice PDF export is missing the tax line for EU customers" },
  { id: "t3", text: "Onboarding checklist does not save progress between sessions" },
];

describe("Grounding primitive (P4 substrate seed) — the runtime cite-or-abstain contract", () => {
  it("GROUNDING: answers only from retrieved records, and cites real input ids", () => {
    const res = groundOnRecords(TICKETS, "why does the invoice export drop tax?", { label: "your tickets" });
    expect(res.abstained).toBe(false);
    expect(res.citations.length).toBeGreaterThan(0);
    const inputIds = new Set(TICKETS.map((t) => t.id));
    for (const c of res.citations) {
      expect(inputIds.has(c.id)).toBe(true); // never an invented citation
      expect(res.answer).toContain(`[${c.id}]`); // every citation is referenced in the answer
    }
    expect(res.citations[0].id).toBe("t2"); // the most relevant ticket ranks first
  });

  it("ABSTENTION: a no-evidence question says so plainly — never fabricates a citation", () => {
    const res = groundOnRecords(TICKETS, "what is our AWS bill for quantum computing?", { label: "your tickets" });
    expect(res.abstained).toBe(true);
    expect(res.citations).toHaveLength(0);
    expect(res.answer.toLowerCase()).toContain("no supporting record");
  });

  it("ISOLATION is the caller's boundary: it can only ever cite records it was handed", () => {
    const tenantA: GroundRecord[] = [{ id: "a1", text: "Acme roadmap: ship the export feature in Q3" }];
    // grounding over tenant A's records can NEVER surface a tenant-B record — B's rows simply aren't present
    const res = groundOnRecords(tenantA, "what is on the roadmap?");
    expect(res.citations.every((c) => c.id === "a1")).toBe(true);
    // an empty record set (e.g. a tenant with no data) always abstains — never leaks a default
    expect(groundOnRecords([], "anything").abstained).toBe(true);
  });

  it("retrieveRecords ranks by relevance and respects k", () => {
    const hits = retrieveRecords(TICKETS, "onboarding login billing", 2);
    expect(hits).toHaveLength(2);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
  });

  it("an all-stopword / empty query retrieves nothing (no spurious match)", () => {
    expect(retrieveRecords(TICKETS, "how do i")).toHaveLength(0);
    expect(groundOnRecords(TICKETS, "the a an").abstained).toBe(true);
  });

  it("is deterministic — same inputs ⇒ identical result", () => {
    const q = "invoice tax export";
    expect(groundOnRecords(TICKETS, q)).toEqual(groundOnRecords(TICKETS, q));
  });

  it("citations carry a verbatim snippet as proof (a slice of the real record text)", () => {
    const res = groundOnRecords(TICKETS, "login 500 unicode");
    expect(res.citations[0].id).toBe("t1");
    expect(TICKETS[0].text).toContain(res.citations[0].snippet.replace(/…$/, "").trim().slice(0, 20));
  });
});
