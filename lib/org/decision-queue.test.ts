import { describe, it, expect } from "vitest";
import { emptyQueue, enqueue, executiveView, applyVerdict, resubmit, fromToolOutcome } from "./decision-queue";
import { draftInvoice, draftContract, reviseArtifact } from "./executive-desks";
import { dispatchTool } from "@/lib/mcp/tools";

const T0 = 1_800_000_000_000;

describe("Day One — the executive's decision queue (approve / reject / modify)", () => {
  it("the desks draft real artifacts: finance an invoice, legal a contract — nothing sent or signed", () => {
    const inv = draftInvoice({ customer: "Rivera Lab", invoiceNumber: "INV-001", dueDate: "2026-08-01", lines: [{ description: "Study tool build", amountCents: 100000 }, { description: "Monthly operation", amountCents: 50000 }] });
    expect(inv.kind).toBe("invoice");
    expect(inv.preparedBy).toBe("finance-controller");
    expect(inv.artifact).toContain("TOTAL: $1500.00");
    expect(inv.artifact).toContain("DRAFT");
    const con = draftContract({ counterparty: "Rivera Lab", purpose: "pilot software build + operation", termMonths: 3, valueCents: 300000, keyTerms: ["data never leaves the lab's machines", "either party may terminate with 14 days notice"] });
    expect(con.preparedBy).toBe("legal-compliance-analyst");
    expect(con.artifact).toContain("only a human signature can execute it");
  });

  it("the full loop: draft → queue → approve/reject/modify → revise → resubmit → approve", () => {
    let q = emptyQueue();
    q = enqueue(q, draftContract({ counterparty: "Rivera Lab", purpose: "pilot", termMonths: 3, keyTerms: ["local-only data"] }), { now: T0, id: "d1" });
    q = enqueue(q, draftInvoice({ customer: "Rivera Lab", invoiceNumber: "INV-001", dueDate: "2026-08-01", lines: [{ description: "pilot", amountCents: 100000 }] }), { now: T0 + 1, id: "d2" });

    // the executive opens the coworker: two concise pending decisions, oldest first
    const view = executiveView(q);
    expect(view.map((i) => i.id)).toEqual(["d1", "d2"]);

    // MODIFY the contract: send it back with a note
    const mod = applyVerdict(q, "d1", { verb: "modify", note: "make the term 6 months, not 3" }, { now: T0 + 2 });
    expect(mod.outcome.kind).toBe("revise");
    q = mod.state;
    expect(executiveView(q).map((i) => i.id)).toEqual(["d2"]); // revising items leave the pending view

    // the desk revises and resubmits — history + revision counter intact
    const item = q.items.find((i) => i.id === "d1")!;
    q = resubmit(q, "d1", reviseArtifact(item.artifact, "make the term 6 months, not 3", item.revision), { now: T0 + 3 });
    const back = q.items.find((i) => i.id === "d1")!;
    expect(back.status).toBe("pending");
    expect(back.revision).toBe(1);
    expect(back.artifact).toContain("AMENDMENT (revision 1)");

    // APPROVE the revised contract; REJECT the invoice
    const ok = applyVerdict(q, "d1", { verb: "approve" }, { now: T0 + 4 });
    expect(ok.outcome.kind).toBe("executable"); // executable ≠ executed — the mandate+policy gate still stands
    q = ok.state;
    const no = applyVerdict(q, "d2", { verb: "reject", reason: "bill after the pilot ships" }, { now: T0 + 5 });
    expect(no.outcome.kind).toBe("closed");
    q = no.state;

    // the queue is empty; the audit trail holds every touch
    expect(executiveView(q)).toHaveLength(0);
    expect(q.items.find((i) => i.id === "d1")!.history.map((h) => h.event)).toEqual([
      "prepared by legal-compliance-analyst",
      "modify requested: make the term 6 months, not 3",
      "revision 1 resubmitted",
      "approved by principal",
    ]);
  });

  it("no double-verdicts: a closed decision refuses further verbs", () => {
    let q = enqueue(emptyQueue(), draftInvoice({ customer: "X", invoiceNumber: "I-1", dueDate: "2026-08-01", lines: [{ description: "a", amountCents: 100 }] }), { now: T0, id: "d1" });
    q = applyVerdict(q, "d1", { verb: "reject" }, { now: T0 + 1 }).state;
    expect(applyVerdict(q, "d1", { verb: "approve" }, { now: T0 + 2 }).outcome.kind).toBe("error");
    expect(applyVerdict(q, "missing", { verb: "approve" }, { now: T0 + 2 }).outcome.kind).toBe("error");
  });

  it("the governed tool gate feeds the queue: a reserved action becomes a pending decision", () => {
    const outcome = dispatchTool({ name: "build_and_run_software", input: { goal: "x" }, requestedAction: "sign_contract" });
    const input = fromToolOutcome(outcome, { now: T0, id: "d9" });
    expect(input).not.toBeNull();
    expect(input!.kind).toBe("contract");
    const q = enqueue(emptyQueue(), input!, { now: T0, id: "d9" });
    expect(executiveView(q)).toHaveLength(1);
    // and a non-reserved outcome produces NO queue item (autonomous work never bothers the principal)
    expect(fromToolOutcome(dispatchTool({ name: "grounded_query", input: { question: "q" } }), { now: T0, id: "x" })).toBeNull();
  });
});
