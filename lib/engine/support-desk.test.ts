import { describe, it, expect } from "vitest";
import { draftSupportReply } from "./support-desk";

describe("support desk — Theo drafts, a human sends (Block 6d)", () => {
  it("classifies a bug report and answers honestly — logged, no promised dates", () => {
    const r = draftSupportReply({ message: "The build button is broken, I get an error every time" });
    expect(r.author).toBe("Theo · Customer Success Manager");
    expect(r.body).toContain("flagging");
    expect(r.body).toContain("logged it");
    expect(r.body).not.toMatch(/we will fix|by tomorrow|next week/i); // no fabricated timeline
  });

  it("confusion gets 'that's on us' + a follow-up ask; praise gets a plain thank-you", () => {
    const c = draftSupportReply({ message: "How do I find where the settings are? Very confusing" });
    expect(c.body).toContain("that's on us");
    const p = draftSupportReply({ message: "I love this product, thank you!" });
    expect(p.body).toContain("Thank you");
  });

  it("EVERY reply carries the AI disclosure + the human-review line (named-AI rail)", () => {
    for (const m of ["broken thing", "how do I", "love it", "misc note"]) {
      const r = draftSupportReply({ message: m });
      expect(r.body).toContain("an AI employee");
      expect(r.body).toContain("a human reviews everything I send");
    }
  });
});
