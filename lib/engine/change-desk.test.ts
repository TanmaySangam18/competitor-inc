import { describe, it, expect, vi } from "vitest";
import { planChange, changeAdr, runChange, type ChangeDeps } from "./change-desk";
import { architectureDoc, adrDoc, emptyMemory, type ProductMemory } from "@/lib/org/product-memory";
import type { SupabaseClient } from "@supabase/supabase-js";

const NOW = Date.UTC(2026, 6, 11);
const client = {} as SupabaseClient;

const memoryWith = (product: string): ProductMemory => ({
  product,
  docs: [
    architectureDoc(product, "a notes app that answers questions about my notes", NOW),
    adrDoc(1, "Ground answers on stored notes", { context: "c", decision: "Retrieve then answer, cite note ids", consequences: "k" }, NOW),
  ],
});

describe("Change Desk (R9) — changes compound, they don't rebuild", () => {
  it("planChange frames the request as a CONTINUATION and carries the recall", () => {
    const plan = planChange(memoryWith("notes-app"), "add tags to notes");
    expect(plan.changeGoal).toContain("do NOT rebuild");
    expect(plan.changeGoal).toContain("add tags to notes");
    expect(plan.recall).toContain("CONTINUING an existing product");
    expect(plan.recall).toContain("ADR-1"); // prior decision is recalled
  });

  it("changeAdr records the next ordinal with the request in its context", () => {
    const adr = changeAdr(memoryWith("notes-app"), "add tags to notes", NOW);
    expect(adr.seq).toBe(2); // memory already has ADR-1
    expect(adr.body).toContain("add tags to notes");
    expect(adr.title).toContain("Change: add tags to notes");
  });

  it("runChange: dispatches the build WITH recall, then records the ADR", async () => {
    const dispatch = vi.fn(async (o: { goal: string; recall?: string }) => {
      expect(o.recall).toContain("CONTINUING an existing product"); // recall reached the builder
      expect(o.goal).toContain("add tags");
      return { url: "https://github.com/x/notes-app", repo: "x/notes-app" };
    });
    const saveDoc = vi.fn(async () => {});
    const deps: ChangeDeps = { loadMemory: async () => memoryWith("notes-app"), dispatch, saveDoc, now: () => NOW };
    const res = await runChange({ client, userId: "u", companyId: "c", product: "notes-app", request: "add tags", token: "t" }, deps);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.repo).toBe("x/notes-app");
      expect(res.adrSeq).toBe(2);
      expect(res.memoryRecorded).toBe(true);
    }
    expect(dispatch).toHaveBeenCalledOnce();
    expect(saveDoc).toHaveBeenCalledOnce();
  });

  it("a FIRST change to a product with no memory still works (recall empty, ADR-1)", async () => {
    const dispatch = vi.fn(async (o: { recall?: string }) => {
      expect(o.recall ?? "").toBe(""); // nothing to recall on a fresh product
      return { url: "https://github.com/x/app", repo: "x/app" };
    });
    const deps: ChangeDeps = { loadMemory: async () => emptyMemory("app"), dispatch, saveDoc: async () => {}, now: () => NOW };
    const res = await runChange({ client, userId: "u", companyId: "c", product: "app", request: "add dark mode", token: "t" }, deps);
    expect(res.ok && res.adrSeq).toBe(1);
  });

  it("a failed build does NOT record an ADR (we only log decisions that shipped)", async () => {
    const saveDoc = vi.fn(async () => {});
    const deps: ChangeDeps = { loadMemory: async () => memoryWith("p"), dispatch: async () => ({ error: "create-repo → HTTP 401" }), saveDoc, now: () => NOW };
    const res = await runChange({ client, userId: "u", companyId: "c", product: "p", request: "x", token: "t" }, deps);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("401");
    expect(saveDoc).not.toHaveBeenCalled();
  });

  it("a shipped build with a flaky memory write still succeeds (memoryRecorded=false)", async () => {
    const deps: ChangeDeps = {
      loadMemory: async () => memoryWith("p"),
      dispatch: async () => ({ url: "https://github.com/x/p", repo: "x/p" }),
      saveDoc: async () => { throw new Error("db down"); },
      now: () => NOW,
    };
    const res = await runChange({ client, userId: "u", companyId: "c", product: "p", request: "x", token: "t" }, deps);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.memoryRecorded).toBe(false);
  });

  it("rejects an empty request / empty product (no wasted build)", async () => {
    const dispatch = vi.fn();
    const deps: ChangeDeps = { loadMemory: async () => emptyMemory("p"), dispatch, saveDoc: async () => {}, now: () => NOW };
    expect((await runChange({ client, userId: "u", companyId: "c", product: "p", request: "  ", token: "t" }, deps)).ok).toBe(false);
    expect((await runChange({ client, userId: "u", companyId: "c", product: "", request: "x", token: "t" }, deps)).ok).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
