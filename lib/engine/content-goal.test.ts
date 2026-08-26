import { describe, it, expect } from "vitest";
import { impliesContent, contentBrief, fullstackPromptFile } from "./fullstack-build";

describe("recognising a content goal", () => {
  it("recognises the things people actually ask for", () => {
    for (const g of [
      "an ebook of every Google tool with a short how-to for each",
      "an e-book about React",
      "a guide to Boston co-ops",
      "a handbook for new managers",
      "a directory of AI tools",
      "a glossary of legal terms",
      "a cheat sheet for git",
      "a course on TypeScript",
    ]) {
      expect(impliesContent(g), g).toBe(true);
    }
  });

  it("does not mistake an app for a book", () => {
    for (const g of [
      "a tool to track my co-op applications",
      "a marketplace for tutors",
      "a dashboard for my sales pipeline",
      "an app that reminds me to water plants",
      "a booking system for a barber",
    ]) {
      expect(impliesContent(g), g).toBe(false);
    }
  });
});

describe("THE BUG THIS FIXES: every goal came out as a CRUD app", () => {
  const book = fullstackPromptFile("an ebook of every Google tool with a short how-to for each");
  const app = fullstackPromptFile("a tool to track my co-op applications");

  it("stops demanding a create/list/delete flow for a book", () => {
    // Asked for an ebook, the pipeline previously produced a working item tracker containing the word
    // "Docs" once. The software compiled. It was not what anyone asked for.
    // Assert on the REQUIREMENT, not the bare phrase: the content brief itself says "Do NOT build a
    // create/list/delete form", which a naive negative match trips over.
    expect(book).not.toMatch(/with the core create\/list\/delete flow/);
    expect(book).toMatch(/Do NOT build a create\/list\/delete form/);
    expect(book).not.toMatch(/A REAL backend API route at app\/api\/items/);
  });

  it("still demands one for an app, because that shape was right", () => {
    expect(app).toMatch(/with the core create\/list\/delete flow/);
    expect(app).toMatch(/A REAL backend API route at app\/api\/items/);
  });

  it("asks the book for real prose, in words that leave no room to stub it", () => {
    expect(book).toMatch(/WRITE THE ACTUAL WORDS/);
    expect(book).toMatch(/lorem ipsum/i);
    expect(book).toMatch(/count as not having built the product/);
  });

  it("tells the book not to persist anything, since there is nothing to persist", () => {
    expect(book).not.toMatch(/in-memory store/);
    expect(app).toMatch(/in-memory store/);
  });

  it("keeps the dependency rule on BOTH, since that killed the first real build", () => {
    for (const [name, p] of [["book", book], ["app", app]] as const) {
      expect(p, name).toMatch(/DO NOT add, import, or require ANY package/);
    }
  });

  it("names a floor on depth, so three entries cannot pass as a book", () => {
    expect(contentBrief()).toMatch(/three entries is a failure/);
  });
});
