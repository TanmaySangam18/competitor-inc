import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { embed, remember, recall } from "./memory";

// These verify the GATED, fail-soft contract — no network, no DB. (Live vector recall is verified
// only after Block 0 sets Supabase + an embeddings key.)
describe("agent memory — gated/fail-soft", () => {
  const saved = process.env.EMBEDDINGS_API_KEY;
  beforeEach(() => {
    delete process.env.EMBEDDINGS_API_KEY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.EMBEDDINGS_API_KEY;
    else process.env.EMBEDDINGS_API_KEY = saved;
  });

  it("embed() returns null with no embeddings key (no network call)", async () => {
    expect(await embed("anything")).toBeNull();
  });

  it("embed() returns null for empty input", async () => {
    process.env.EMBEDDINGS_API_KEY = "test-key";
    expect(await embed("   ")).toBeNull();
  });

  it("remember() is a no-op (false) with no Supabase client", async () => {
    expect(await remember(null, "company-1", 0, "shift", "did things")).toBe(false);
  });

  it("recall() returns [] with no Supabase client", async () => {
    expect(await recall(null, "company-1", "what happened?")).toEqual([]);
  });
});
