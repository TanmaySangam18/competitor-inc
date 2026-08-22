import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readTokens, checkChange, applyChanges, paletteSummary } from "./design-tokens";

const SAMPLE = `:root {
  --color-bg: #212121; /* charcoal canvas */
  --color-text: #ececec;
  --color-border: rgba(255, 255, 255, 0.12); /* white hairlines */
  --font-display: "Space Grotesk", sans-serif;
}
:root { --ripple-ink: rgba(236, 236, 236, 0.1); }
`;

describe("reading the real look", () => {
  it("parses tokens with their values and comments", () => {
    const t = readTokens(SAMPLE);
    expect(t.find((x) => x.name === "--color-bg")).toEqual({ name: "--color-bg", value: "#212121", comment: "charcoal canvas" });
    expect(t.find((x) => x.name === "--color-text")?.value).toBe("#ececec");
    expect(t.find((x) => x.name === "--color-border")?.value).toBe("rgba(255, 255, 255, 0.12)");
  });

  it("reads the actual stylesheet, not just the fixture", () => {
    // If the real file stops parsing, the design agent goes blind. This is the tripwire.
    const real = readTokens();
    expect(real.length).toBeGreaterThan(15);
    expect(real.some((t) => t.name === "--color-bg")).toBe(true);
    expect(paletteSummary()).toMatch(/--color-bg/);
  });
});

describe("REFUSALS: nothing that could escape a CSS declaration gets through", () => {
  // Each of these is a real way to break out of `--token: VALUE;` and inject new rules into a source
  // file that the whole site loads. The narrow grammar exists for exactly these.
  const attacks = [
    "#fff; } body { display: none",
    "red; } * { visibility: hidden",
    "url(https://evil.example/x.css)",
    "var(--color-text)",
    "calc(1px + 2px)",
    "linear-gradient(red, blue)",
    "expression(alert(1))",
    "#fff /* sneaky */",
    "</style><script>alert(1)</script>",
    "\n  --color-text: red",
    "#ffff; --color-bg: black",
    "attr(data-x)",
    "inherit",
    "initial",
    "currentColor",
  ];

  for (const bad of attacks) {
    it(`refuses ${JSON.stringify(bad).slice(0, 46)}`, () => {
      const r = checkChange({ name: "--color-bg", to: bad }, SAMPLE);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/not an accepted colour/i);
    });
  }

  it("refuses a token that does not already exist, so it cannot invent one", () => {
    const r = checkChange({ name: "--color-invented", to: "#fff" }, SAMPLE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/no token called/i);
  });

  it("refuses a name outside the colour and ripple namespaces", () => {
    const r = checkChange({ name: "--evil", to: "#fff" }, SAMPLE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not a design token/i);
  });

  it("refuses font tokens WITH A REASON, rather than silently ignoring them", () => {
    const r = checkChange({ name: "--font-display", to: "#fff" }, SAMPLE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/font-family value is a free-text list/i);
  });

  it("refuses a no-op instead of pretending it changed something", () => {
    const r = checkChange({ name: "--color-bg", to: "#212121" }, SAMPLE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/already/i);
  });
});

describe("ACCEPTS: the colour forms a designer actually uses", () => {
  for (const good of ["#fff", "#ffff", "#a1b2c3", "#a1b2c3ff", "rgb(1,2,3)", "rgba(1, 2, 3, 0.5)", "hsl(210, 50%, 50%)", "hsla(210deg, 50%, 50%, 0.4)", "transparent"]) {
    it(`accepts ${good}`, () => {
      expect(checkChange({ name: "--color-bg", to: good }, SAMPLE).ok).toBe(true);
    });
  }

  it("reports what it is changing from and to, so the founder sees the diff", () => {
    const r = checkChange({ name: "--color-bg", to: "#0a0a0a" }, SAMPLE);
    expect(r).toEqual({ ok: true, name: "--color-bg", from: "#212121", to: "#0a0a0a" });
  });
});

describe("writing is all-or-nothing, and it really does change the site", () => {
  const sheet = join(process.cwd(), "app", "globals.css");

  it("writes NOTHING when any single change in the batch is invalid", () => {
    const before = readFileSync(sheet, "utf8");
    const r = applyChanges([
      { name: "--color-bg", to: "#0b0b0b" }, // valid
      { name: "--color-text", to: "red; } * { display: none" }, // hostile
    ]);
    expect(r.ok).toBe(false);
    expect(r.written).toBe(false);
    expect(readFileSync(sheet, "utf8")).toBe(before); // the valid half did not land either
  });

  it("applies a real change to the real stylesheet, then restores it", () => {
    const before = readFileSync(sheet, "utf8");
    const original = readTokens(before).find((t) => t.name === "--color-bg")!.value;
    try {
      const r = applyChanges([{ name: "--color-bg", to: "#0c0c0c" }]);
      expect(r.ok).toBe(true);
      expect(r.written).toBe(true);
      expect(readTokens().find((t) => t.name === "--color-bg")?.value).toBe("#0c0c0c");
      // and only that one declaration moved
      expect(readFileSync(sheet, "utf8").replace("#0c0c0c", original)).toBe(before);
    } finally {
      writeFileSync(sheet, before, "utf8");
    }
    expect(readFileSync(sheet, "utf8")).toBe(before);
  });
});
