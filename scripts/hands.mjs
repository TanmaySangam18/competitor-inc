#!/usr/bin/env node
// scripts/hands.mjs — THE PHYSICAL HANDS (slice 1 of the hands build, ADR-0019's missing backend).
//
// lib/core/browser-driver.ts has defined a BrowserTransport interface since ADR-0019, and until now the
// ONLY implementation in the repo was a test mock. The brain (onboarding-runner.ts) was complete and
// drove nothing. This is the real backend.
//
// WHERE IT RUNS: on the user's own machine, against their own browser, on their explicit consent.
// competitor.inc never drives a screen from our servers. That is why this is a local CLI reading NDJSON
// on stdin rather than an API route.
//
// PROTOCOL (one JSON object per line in, one per line out — exactly BrowserCommand/BrowserResult):
//   {"op":"navigate","url":"https://…"}            -> {"ok":true}
//   {"op":"fill","fields":["name=My App","scope=chat:write"]} -> {"ok":true}
//   {"op":"detect","signal":"Bot User OAuth Token"} -> {"ok":true,"detected":true}
//   {"op":"close"}                                  -> {"ok":true}  (and exits)
//
// FOUR GUARDS, all enforced HERE, at the last inch, not just upstream:
//   1. THE SIX HARD-STOPS. Before any click or fill, the target is inspected (scripts/hands-guard.mjs,
//      kept character-identical to lib/core/hard-stops.ts by test). A match refuses and escalates.
//      A hostile page cannot talk this hand into signing up, accepting terms, typing a password,
//      solving a CAPTCHA, granting consent, or paying.
//   2. NO SECRETS TYPED. Any value that looks like a credential is refused, mirroring looksSecret().
//   3. SAFE NAVIGATION ONLY. http/https; javascript:, data:, and file: are refused.
//   4. AUDIT. Every command and verdict is appended to hands-audit.log next to the repo, so the run is
//      reviewable afterwards. Refusals are logged as loudly as actions.
//
// USAGE
//   node scripts/hands.mjs                       # headed (you watch it), default
//   node scripts/hands.mjs --headless
//   node scripts/hands.mjs --stops="internal wiki,payroll"   # ADD customer stops (tighten only)
//   echo '{"op":"navigate","url":"https://api.slack.com/apps"}' | node scripts/hands.mjs
//
// There is deliberately no flag that removes a hard-stop. The floor is not configurable downward.

import { appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { inspect as inspectTarget } from "./hands-guard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "hands-audit.log");

const argv = process.argv.slice(2);
const HEADLESS = argv.includes("--headless");
const EXTRA_STOPS = (argv.find((a) => a.startsWith("--stops="))?.slice(8) ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Mirror of lib/core/browser-driver.ts SECRET_PATTERNS. A value matching any of these is never typed.
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /(pk|sk|rk|whsec)_(live|test)_[A-Za-z0-9]{16,}/,
  /AKIA[A-Z0-9]{16}/,
  /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\./,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:^|[\s:=])[A-Za-z0-9_\-+/]{40,}={0,2}(?:$|[\s])/,
];
const looksSecret = (v) => SECRET_PATTERNS.some((re) => re.test(v));

const safeNavUrl = (url) => {
  if (typeof url !== "string" || url.length === 0) return false;
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

function audit(entry) {
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry });
  try { appendFileSync(AUDIT, line + "\n"); } catch { /* never let logging break a run */ }
}

function reply(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

// ── browser ──────────────────────────────────────────────────────────────────
let browser = null;
let page = null;

async function ensurePage() {
  if (page) return page;
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  page = await context.newPage();
  audit({ event: "browser-open", headless: HEADLESS });
  return page;
}

/**
 * Read what is actually on the page around a field so the guard sees the truth rather than our
 * intention: every input's name/type/autocomplete/placeholder/aria-label, plus the page title and url.
 */
async function pageTargets(p) {
  const url = p.url();
  const title = await p.title().catch(() => "");
  const fields = await p
    .$$eval("input, button, [role=button]", (els) =>
      els.slice(0, 200).map((e) => ({
        text: (e.innerText || e.value || "").slice(0, 120),
        name: e.getAttribute("name") || "",
        type: e.getAttribute("type") || "",
        autocomplete: e.getAttribute("autocomplete") || "",
        placeholder: e.getAttribute("placeholder") || "",
        ariaLabel: e.getAttribute("aria-label") || "",
      })),
    )
    .catch(() => []);
  return { url, title, fields };
}

/** Refuse if ANY visible target on the page is one of the six. Conservative on purpose. */
function screenVerdict({ url, title, fields }) {
  const pageLevel = inspectTarget({ url, text: title }, EXTRA_STOPS);
  if (pageLevel.stopped) return { ...pageLevel, where: "page" };
  for (const f of fields) {
    const v = inspectTarget(f, EXTRA_STOPS);
    if (v.stopped) return { ...v, where: `field:${f.name || f.ariaLabel || f.type || "unnamed"}` };
  }
  return { stopped: false };
}

// ── ops ──────────────────────────────────────────────────────────────────────
async function opNavigate(cmd) {
  if (!safeNavUrl(cmd.url)) {
    audit({ event: "refused", op: "navigate", reason: "unsafe scheme", url: String(cmd.url).slice(0, 60) });
    return { ok: false, error: `refused unsafe navigation target: ${String(cmd.url).slice(0, 40)}` };
  }
  const p = await ensurePage();
  await p.goto(cmd.url, { waitUntil: "domcontentloaded", timeout: 45000 });
  audit({ event: "navigate", url: cmd.url });
  return { ok: true };
}

async function opFill(cmd) {
  const fields = Array.isArray(cmd.fields) ? cmd.fields : [];
  const offending = fields.find((f) => looksSecret(String(f)));
  if (offending) {
    audit({ event: "refused", op: "fill", reason: "value looks like a secret" });
    return { ok: false, error: "refused to type a value that looks like a secret. Secrets are the human's to enter." };
  }
  const p = await ensurePage();

  // THE LAST INCH: look at the real screen before touching it.
  const verdict = screenVerdict(await pageTargets(p));
  if (verdict.stopped) {
    audit({ event: "hard-stop", op: "fill", kind: verdict.kind, matched: verdict.matched, where: verdict.where, url: p.url() });
    return {
      ok: false,
      error: `hard-stop (${verdict.kind}): refused to act on this screen because it contains "${verdict.matched}". This one is yours.`,
      hardStop: verdict.kind,
    };
  }

  // HONEST REPORTING: a transport that says ok when it typed nothing teaches the brain a lie, and the
  // brain would mark the step done. So count what actually landed and say so. All-miss is a failure.
  const filled = [];
  const missed = [];
  for (const spec of fields) {
    const [rawName, ...rest] = String(spec).split("=");
    const name = rawName.trim();
    const value = rest.join("=").trim();
    if (!name || !value) { missed.push(rawName.trim() || "(blank)"); continue; }
    const target = `input[name="${name}"], textarea[name="${name}"], input[aria-label="${name}"]`;
    const el = await p.$(target);
    if (!el) { audit({ event: "fill-miss", name }); missed.push(name); continue; }
    await el.fill(value);
    audit({ event: "fill", name, chars: value.length }); // never the value itself
    filled.push(name);
  }
  if (fields.length > 0 && filled.length === 0) {
    audit({ event: "fill-failed", missed, url: p.url() });
    return { ok: false, error: `no field matched on this page: ${missed.join(", ")}. Nothing was typed.`, filled: [], missed };
  }
  return { ok: true, filled, missed };
}

async function opDetect(cmd) {
  const p = await ensurePage();
  const signal = String(cmd.signal ?? "");
  if (!signal) return { ok: false, error: "detect needs a signal" };
  const body = await p.textContent("body").catch(() => "");
  const detected = (body ?? "").toLowerCase().includes(signal.toLowerCase());
  audit({ event: "detect", signal, detected });
  return { ok: true, detected };
}

// ── main loop ────────────────────────────────────────────────────────────────
audit({ event: "start", headless: HEADLESS, extraStops: EXTRA_STOPS.length });

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  const raw = line.trim();
  if (!raw) continue;
  let cmd;
  try {
    cmd = JSON.parse(raw);
  } catch {
    reply({ ok: false, error: "not JSON" });
    continue;
  }
  try {
    if (cmd.op === "navigate") reply(await opNavigate(cmd));
    else if (cmd.op === "fill") reply(await opFill(cmd));
    else if (cmd.op === "detect") reply(await opDetect(cmd));
    else if (cmd.op === "close") { reply({ ok: true }); break; }
    else reply({ ok: false, error: `unknown op ${cmd.op}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    audit({ event: "error", op: cmd.op, message: msg });
    reply({ ok: false, error: msg });
  }
}

if (browser) await browser.close().catch(() => {});
audit({ event: "stop" });
