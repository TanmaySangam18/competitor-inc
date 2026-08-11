#!/usr/bin/env node
// scripts/hands-caption.mjs — annotate a recorded hands session FROM ITS OWN AUDIT LOG.
//
// WHY: a raw screen recording of an agent is nearly useless as a demo. You watch pages load and never
// see the decision, and the decision is the entire product. So the captions are not written by hand and
// they are not narration: each one is generated from a real line in hands-audit.log, at that line's real
// timestamp. If the video says the hand refused at 4.2 seconds, the ledger says so too.
//
// This is the same honesty rule the Video Factory applies to footage (ADR-0026), turned on ourselves.
//
// Local ffmpeg here has no drawtext (documented gotcha), so caption strips are rendered as PNGs via
// headless Chrome and composited. Matched frame rates on every input: mismatched rates make ffmpeg
// buffer frames unboundedly until the OS kills it (the v4 trailer lesson).
//
// Usage: node scripts/hands-caption.mjs <session.webm> <hands-audit.log> <out.mp4>

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [, , videoIn, auditIn, outPath] = process.argv;
if (!videoIn || !auditIn || !outPath) {
  console.error("usage: hands-caption.mjs <session.webm> <hands-audit.log> <out.mp4>");
  process.exit(2);
}
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = 1280, H = 800, FPS = 25, STRIP_H = 132;
const tmp = mkdtempSync(join(tmpdir(), "handscap-"));

// ── read the ledger ──────────────────────────────────────────────────────────
const rows = readFileSync(auditIn, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const openRow = rows.find((r) => r.event === "browser-open");
if (!openRow) { console.error("no browser-open in the audit log; cannot align captions to the recording"); process.exit(1); }
const t0 = Date.parse(openRow.at);
const at = (r) => (Date.parse(r.at) - t0) / 1000;

// One caption per meaningful event. Wording stays close to the ledger's own words.
function caption(r) {
  switch (r.event) {
    case "navigate": return { kind: "act", head: "NAVIGATE", body: r.url };
    case "detect": return { kind: r.detected ? "act" : "note", head: r.detected ? "DETECTED" : "NOT FOUND", body: `"${r.signal}"` };
    case "fill": return { kind: "act", head: "TYPED", body: `${r.name} (${r.chars} chars, value never logged)` };
    case "fill-failed": return { kind: "note", head: "NOTHING TYPED", body: `no field matched: ${(r.missed || []).join(", ")}` };
    case "hard-stop": return { kind: "stop", head: `HARD STOP · ${String(r.kind).toUpperCase()}`, body: `matched "${r.matched}". This one is the human's.` };
    case "refused": return { kind: "stop", head: "REFUSED", body: r.reason };
    default: return null;
  }
}

const events = rows.map((r) => ({ t: at(r), cap: caption(r) })).filter((e) => e.cap && e.t >= 0);
if (events.length === 0) { console.error("no captionable events"); process.exit(1); }

// ── render each caption strip as a PNG ───────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function strip(cap, i) {
  const accent = cap.kind === "stop" ? "#E5484D" : cap.kind === "note" ? "#8B8B85" : "#F2F2F0";
  const html = `<!doctype html><body style="margin:0;width:${W}px;height:${STRIP_H}px;background:rgba(10,10,10,0.94);display:flex;align-items:center;">
<div style="padding:0 46px;font-family:'SF Mono',Menlo,monospace;color:#F2F2F0;">
<div style="font-size:15px;letter-spacing:.22em;color:${accent};margin-bottom:12px;">${esc(cap.head)}</div>
<div style="font-size:26px;line-height:1.25;color:#F2F2F0;">${esc(cap.body).slice(0, 96)}</div>
</div></body>`;
  const h = join(tmp, `c${i}.html`), p = join(tmp, `c${i}.png`);
  writeFileSync(h, html);
  execFileSync(CHROME, ["--headless", "--disable-gpu", "--default-background-color=00000000",
    `--window-size=${W},${STRIP_H}`, `--screenshot=${p}`, `file://${h}`], { stdio: "ignore" });
  return p;
}

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });

// Total duration from the source, so the last caption holds to the end.
const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", videoIn]).toString().trim();
const total = Math.max(Number(probe) || 0, events[events.length - 1].t + 1);

const inputs = ["-i", videoIn];
const filters = [`[0:v]fps=${FPS},scale=${W}:${H}[base0]`];
let prev = "base0";
events.forEach((e, i) => {
  const png = strip(e.cap, i);
  inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(total), "-i", png);
  const end = i + 1 < events.length ? events[i + 1].t : total;
  filters.push(`[${i + 1}:v]fps=${FPS},format=rgba[s${i}]`);
  filters.push(`[${prev}][s${i}]overlay=0:${H - STRIP_H}:enable='between(t,${e.t.toFixed(2)},${end.toFixed(2)})'[base${i + 1}]`);
  prev = `base${i + 1}`;
});

ff([...inputs, "-filter_complex", filters.join(";"), "-map", `[${prev}]`,
  "-t", String(total), "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p", outPath]);

if (!existsSync(outPath)) { console.error("render produced no file"); process.exit(1); }
console.log(`captioned ${events.length} real ledger events into ${outPath}`);
