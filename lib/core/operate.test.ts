import { describe, it, expect } from "vitest";
import { triageTicket, ticketToSignal, improve, type Ticket, type Signal } from "./operate";

const tkt = (type: Ticket["type"]): Ticket => ({ id: "t", type, body: `a ${type} report` });

describe("operate — end-user ticket triage", () => {
  it("routes each ticket type correctly, with the right autonomy", () => {
    expect(triageTicket(tkt("info"))).toMatchObject({ route: "answer", autonomy: "auto" });
    expect(triageTicket(tkt("bug"))).toMatchObject({ route: "fix", autonomy: "auto" });
    expect(triageTicket(tkt("feature"))).toMatchObject({ route: "owner-decision", autonomy: "approve" });
    expect(triageTicket(tkt("billing"))).toMatchObject({ route: "human-escalate", autonomy: "block" });
    expect(triageTicket(tkt("abuse"))).toMatchObject({ route: "drop", autonomy: "block" });
  });

  it("turns a bug ticket into a high-severity error signal", () => {
    const s = ticketToSignal(tkt("bug"));
    expect(s.kind).toBe("error");
    expect(s.severity).toBe(4);
  });
});

describe("operate — the governed improvement loop", () => {
  const sig = (kind: Signal["kind"], severity: Signal["severity"]): Signal => ({ kind, severity, detail: `${kind} @${severity}` });

  it("auto-runs small reversible fixes, escalates big ones", () => {
    const c = improve({ product: "p", signals: [sig("perf", 2), sig("error", 5)] });
    const byTask = Object.fromEntries(c.actions.map((a) => [a.signal.detail, a.lane]));
    expect(byTask["perf @2"]).toBe("auto");
    expect(byTask["error @5"]).toBe("owner-approval");
  });

  it("always sends security changes to the owner", () => {
    expect(improve({ product: "p", signals: [sig("security", 1)] }).actions[0].lane).toBe("owner-approval");
  });

  it("regulated products send EVERYTHING to the owner (tight gate)", () => {
    const c = improve({ product: "p", signals: [sig("perf", 1), sig("usage", 2)], regulated: true });
    expect(c.actions.every((a) => a.lane === "owner-approval")).toBe(true);
  });

  it("diagnoses severity-first and reports honestly", () => {
    const c = improve({ product: "p", signals: [sig("usage", 1), sig("error", 5)] });
    expect(c.diagnosed[0].severity).toBe(5);
    expect(c.report).toMatch(/verified before done/);
  });
});
