import { describe, it, expect } from "vitest";
import { rowToProductDoc, rowsToMemory } from "./product-memory-db";

describe("product-memory-db mappers (fail-safe)", () => {
  it("null/empty rows → empty memory (a build with no memory starts fresh, never crashes)", () => {
    expect(rowsToMemory("p", null).docs).toEqual([]);
    expect(rowsToMemory("p", []).docs).toEqual([]);
    expect(rowsToMemory("p", null).product).toBe("p");
  });

  it("maps a real row into a ProductDoc", () => {
    const doc = rowToProductDoc({ product: "p", kind: "architecture", seq: 0, title: "Architecture — p", body: "# Architecture", created_at: "2026-07-11T00:00:00Z" });
    expect(doc.kind).toBe("architecture");
    expect(doc.seq).toBe(0);
    expect(doc.title).toBe("Architecture — p");
    expect(doc.createdAt).toBe(Date.parse("2026-07-11T00:00:00Z"));
  });

  it("coerces garbage fields to safe defaults (unknown kind → adr, bad seq → 0)", () => {
    const doc = rowToProductDoc({ kind: "nonsense", seq: "oops", title: null, body: null });
    expect(doc.kind).toBe("adr");
    expect(doc.seq).toBe(0);
    expect(doc.title).toBe("");
    expect(doc.body).toBe("");
  });

  it("assembles multiple rows into one memory", () => {
    const mem = rowsToMemory("p", [
      { product: "p", kind: "architecture", seq: 0, title: "A", body: "x" },
      { product: "p", kind: "adr", seq: 1, title: "D1", body: "y" },
    ]);
    expect(mem.docs).toHaveLength(2);
    expect(mem.docs.filter((d) => d.kind === "adr")).toHaveLength(1);
  });
});
