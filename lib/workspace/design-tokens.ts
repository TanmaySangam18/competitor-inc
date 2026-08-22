// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN AGENT'S HANDS — read and change the real look of the product.
//
// Founder's instruction: "I will be talking to agents ... including the designing agents, the way it
// looks etc!" A design agent that can only DESCRIBE a change is a chatbot. This module is the one
// place where a conversation about the look becomes an actual edit to the actual stylesheet.
//
// The Product Designer role already owns "design-system tokens" in its responsibilities, so this is
// that role's hands, not a new capability invented for a demo.
//
// SAFETY, and this is the whole reason the module is shaped this way. Writing model output into a
// source file is a code-injection surface: a stylesheet can carry `}` and escape its own block. So
// nothing here accepts free text. A change must name a token that ALREADY EXISTS in the file, and
// carry a value that matches a strict colour grammar. Anything else is refused with a reason. The
// blast radius is one value between a colon and a semicolon.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STYLESHEET = join(process.cwd(), "app", "globals.css");

/** Token names this module will touch. Fonts are deliberately excluded (see refuse reason below). */
const TOKEN_NAME = /^--(?:color|ripple)-[a-z0-9-]+$/;

/**
 * The colour grammar. Deliberately narrow: hex, rgb/rgba, hsl/hsla, and `transparent`. No `var()`,
 * no `calc()`, no gradients, no keywords beyond transparent. Narrow is the point: every character
 * class here is one that cannot terminate a CSS declaration or open a new rule.
 */
const COLOR_VALUE =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)|hsla?\(\s*[\d.]+(?:deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)|transparent)$/i;

export interface DesignToken {
  name: string;
  value: string;
  comment?: string;
}

/** Every design token currently in effect, read from the real stylesheet. */
export function readTokens(css = readFileSync(STYLESHEET, "utf8")): DesignToken[] {
  const out: DesignToken[] = [];
  for (const line of css.split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/i);
    if (!m) continue;
    out.push({ name: m[1], value: m[2].trim(), ...(m[3] ? { comment: m[3] } : {}) });
  }
  return out;
}

export type TokenChange = { name: string; to: string };
export type ChangeResult =
  | { ok: true; name: string; from: string; to: string }
  | { ok: false; name: string; reason: string };

/**
 * Validate a change without writing. Exported so the agent can be told exactly why a request was
 * refused, in words it can pass back to the founder, instead of failing silently.
 */
export function checkChange(change: TokenChange, css = readFileSync(STYLESHEET, "utf8")): ChangeResult {
  const name = change.name.trim();
  const to = change.to.trim();

  if (!TOKEN_NAME.test(name)) {
    return {
      ok: false,
      name,
      reason: name.startsWith("--font")
        ? "Font tokens are not editable this way. A font-family value is a free-text list, which is exactly the shape this module refuses on purpose. Changing a typeface is a founder decision made in the file."
        : `Not a design token this module can change. Editable names look like --color-bg or --ripple-ink.`,
    };
  }
  if (!COLOR_VALUE.test(to)) {
    return {
      ok: false,
      name,
      reason: `"${to}" is not an accepted colour. Use a hex value (#212121), rgb/rgba, hsl/hsla, or transparent. Nothing else is allowed into the stylesheet.`,
    };
  }

  const existing = readTokens(css).find((t) => t.name === name);
  if (!existing) {
    return { ok: false, name, reason: `There is no token called ${name} in the stylesheet. This module can change existing tokens, never invent new ones.` };
  }
  if (existing.value === to) {
    return { ok: false, name, reason: `${name} is already ${to}. Nothing to change.` };
  }
  return { ok: true, name, from: existing.value, to };
}

/**
 * Apply changes to the real stylesheet. All-or-nothing: if any single change is invalid, NOTHING is
 * written. A half-applied theme is worse than a refused one, because the founder would have to work
 * out which half landed.
 */
export function applyChanges(changes: TokenChange[]): { ok: boolean; results: ChangeResult[]; written: boolean } {
  const css = readFileSync(STYLESHEET, "utf8");
  const results = changes.map((c) => checkChange(c, css));
  if (!results.every((r) => r.ok)) return { ok: false, results, written: false };

  let next = css;
  for (const r of results) {
    if (!r.ok) continue;
    // Surgical: only the value between the colon and the semicolon on that token's own declaration.
    const decl = new RegExp(`(^\\s*${r.name}\\s*:\\s*)([^;]+)(;)`, "m");
    next = next.replace(decl, `$1${r.to}$3`);
  }
  if (next === css) return { ok: false, results, written: false };
  writeFileSync(STYLESHEET, next, "utf8");
  return { ok: true, results, written: true };
}

/** A compact summary of the current look, for an agent's context window. */
export function paletteSummary(css = readFileSync(STYLESHEET, "utf8")): string {
  const t = readTokens(css).filter((x) => TOKEN_NAME.test(x.name));
  return t.map((x) => `${x.name}: ${x.value}${x.comment ? ` (${x.comment})` : ""}`).join("\n");
}
