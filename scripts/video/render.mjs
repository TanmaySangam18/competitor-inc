#!/usr/bin/env node
// scripts/video/render.mjs — the Video Factory render runner (ADR-0026, slice 2).
//
// Takes a storyboard JSON (the exact shape lib/core/video-factory.planStoryboard emits) plus an
// assets manifest, and renders the finished MP4 with ffmpeg. Runs identically on a laptop and on
// the Actions farm. No browser dependency: cards and teletype frames are drawtext, archival clips
// are downloaded ONLY from the allowlisted PD sources named in the manifest, and every clip's
// provenance is emitted next to the artifact.
//
// Hard-won rules encoded here:
//  - every filter branch is forced to the same fps BEFORE any overlay/concat (the v4 OOM lesson:
//    mismatched input rates make ffmpeg buffer frames unboundedly until the OS kills it);
//  - audio is synthesized (132 BPM pulse), ducked when the final card starts — zero license risk;
//  - fail loudly: any missing asset or nonzero ffmpeg exit kills the render, no silent gaps.
//
// Usage: node scripts/video/render.mjs <storyboard.json> <manifest.json> <outdir> [--res 1080x1920] [--fast]

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , sbPath, mfPath, outDir, ...flags] = process.argv;
if (!sbPath || !mfPath || !outDir) {
  console.error("usage: render.mjs <storyboard.json> <manifest.json> <outdir> [--res WxH] [--fast]");
  process.exit(2);
}
const RES = (flags.find((f) => f.startsWith("--res"))?.split("=")[1]) ?? "1080x1920";
const [W, H] = RES.split("x").map(Number);
const FAST = flags.includes("--fast");
const PRESET = FAST ? "ultrafast" : "medium";
const FPS = 30;
const FONT = process.env.RENDER_FONT ?? "/System/Library/Fonts/Courier.ttc";
const FONT_FALLBACK = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf";
const font = existsSync(FONT) ? FONT : FONT_FALLBACK;

const board = JSON.parse(readFileSync(sbPath, "utf8"));
const manifest = JSON.parse(readFileSync(mfPath, "utf8")); // { clips: { [footageQuery]: { file|url, identifier, collection, license, seek } } }
mkdirSync(outDir, { recursive: true });
const seg = (n) => join(outDir, `seg-${String(n).padStart(2, "0")}.mp4`);

function ff(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
}

// Some ffmpeg builds (brew-minimal) ship without drawtext; CI's has it. Probe once, fall back to
// headless-Chrome text frames when missing — output is identical in spirit, path differs.
const HAS_DRAWTEXT = (() => {
  try { return execFileSync("ffmpeg", ["-hide_banner", "-filters"]).toString().includes("drawtext"); }
  catch { return false; }
})();
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function textFramePng(lines, { dark = "#0F0F0F", size = Math.round(W / 16), align = "center", left = Math.round(W * 0.08) } = {}) {
  const html = `<!doctype html><body style="margin:0;width:${W}px;height:${H}px;background:${dark};display:flex;align-items:center;justify-content:${align === "center" ? "center" : "flex-start"};">
    <div style="font-family:'Courier New',monospace;color:#F2F2F0;font-size:${size}px;line-height:1.45;${align === "center" ? "text-align:center;" : `padding-left:${left}px;`}white-space:pre-wrap;">${lines.map((l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;")).join("\n")}</div></body>`;
  const stamp = Math.random().toString(36).slice(2, 8);
  const htmlPath = join(outDir, `frame-${stamp}.html`);
  const pngPath = join(outDir, `frame-${stamp}.png`);
  writeFileSync(htmlPath, html);
  execFileSync(CHROME, ["--headless", "--disable-gpu", `--window-size=${W},${H}`, `--screenshot=${pngPath}`, `file://${htmlPath}`], { stdio: "ignore" });
  return pngPath;
}
function esc(t) {
  return t.replace(/\\/g, "\\\\").replace(/'/g, "\\\\'").replace(/:/g, "\\:").replace(/%/g, "\\%");
}
function wrap(t, width = 26) {
  const words = t.split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > width) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

// ── shot renderers ───────────────────────────────────────────────────────────
function renderCard(shot, i) {
  const lines = shot.text.split("\n").flatMap((l) => wrap(l));
  const fades = `fade=t=in:st=0:d=0.15,fade=t=out:st=${(shot.seconds - 0.15).toFixed(2)}:d=0.15`;
  if (HAS_DRAWTEXT) {
    const draw = lines.map((l, li) =>
      `drawtext=fontfile=${font}:text='${esc(l)}':fontcolor=0xF2F2F0:fontsize=${Math.round(W / 16)}:x=(w-text_w)/2:y=(h/2)+(${li}-${(lines.length - 1) / 2})*${Math.round(W / 11)}`,
    ).join(",");
    ff(["-f", "lavfi", "-i", `color=0x0F0F0F:s=${W}x${H}:d=${shot.seconds}:r=${FPS}`, "-vf", `${draw},${fades}`,
      "-preset", PRESET, "-pix_fmt", "yuv420p", seg(i)]);
  } else {
    const png = textFramePng(lines);
    ff(["-framerate", String(FPS), "-loop", "1", "-t", String(shot.seconds), "-i", png, "-vf", `fps=${FPS},${fades}`,
      "-preset", PRESET, "-pix_fmt", "yuv420p", seg(i)]);
  }
}

function renderTeletype(shot, i) {
  const lines = wrap(shot.text, 30);
  const grain = `noise=alls=9:allf=t,vignette=PI/4.4`;
  if (HAS_DRAWTEXT) {
    const draw = lines.map((l, li) =>
      `drawtext=fontfile=${font}:text='${esc(l)}':fontcolor=0xF2F2F0:fontsize=${Math.round(W / 20)}:x=${Math.round(W * 0.08)}:y=(h/2)+(${li}-${(lines.length - 1) / 2})*${Math.round(W / 14)}`,
    ).join(",");
    ff(["-f", "lavfi", "-i", `color=0x0A0A0A:s=${W}x${H}:d=${shot.seconds}:r=${FPS}`, "-vf", `${draw},${grain}`,
      "-preset", PRESET, "-pix_fmt", "yuv420p", seg(i)]);
  } else {
    const png = textFramePng(lines, { dark: "#0A0A0A", size: Math.round(W / 20), align: "left" });
    ff(["-framerate", String(FPS), "-loop", "1", "-t", String(shot.seconds), "-i", png, "-vf", `fps=${FPS},${grain}`,
      "-preset", PRESET, "-pix_fmt", "yuv420p", seg(i)]);
  }
}

function renderArchival(shot, i) {
  const clip = manifest.clips[shot.footageQuery];
  if (!clip) throw new Error(`manifest has no clip for query "${shot.footageQuery}"`);
  for (const k of ["identifier", "collection", "license"]) {
    if (!clip[k]) throw new Error(`clip "${shot.footageQuery}" missing provenance field ${k} — refuse to render unproven footage`);
  }
  let src = clip.file;
  if (!src) {
    if (!/^https:\/\/archive\.org\//.test(clip.url)) throw new Error(`clip URL not on archive.org: ${clip.url}`);
    src = join(outDir, `dl-${clip.identifier}.mp4`);
    if (!existsSync(src)) execFileSync("curl", ["-sL", "--fail", "-o", src, clip.url], { stdio: "inherit" });
  }
  ff(["-ss", String(clip.seek ?? 0), "-t", String(shot.seconds), "-i", src, "-an", "-filter_complex",
    `[0:v]fps=${FPS},scale=${W}:-2,hue=s=0,eq=contrast=1.14:brightness=0.02,noise=alls=8:allf=t,pad=${W}:${H}:0:(oh-ih)/2:color=0x0F0F0F,fade=t=in:st=0:d=0.15,fade=t=out:st=${(shot.seconds - 0.15).toFixed(2)}:d=0.15[v]`,
    "-map", "[v]", "-preset", PRESET, "-pix_fmt", "yuv420p", seg(i)]);
}

// ── render all shots ─────────────────────────────────────────────────────────
board.shots.forEach((shot, i) => {
  if (shot.kind === "card") renderCard(shot, i);
  else if (shot.kind === "teletype") renderTeletype(shot, i);
  else if (shot.kind === "archival") renderArchival(shot, i);
  else throw new Error(`unknown shot kind ${shot.kind}`);
  console.log(`✓ shot ${i + 1}/${board.shots.length} (${shot.kind}, ${shot.seconds}s)`);
});

// concat (all segments share fps/res/pixfmt by construction)
writeFileSync(join(outDir, "list.txt"), board.shots.map((_, i) => `file 'seg-${String(i).padStart(2, "0")}.mp4'`).join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", join(outDir, "list.txt"), "-c:v", "libx264", "-preset", PRESET, "-pix_fmt", "yuv420p", join(outDir, "video-silent.mp4")]);

// pulse track, ducked when the last shot (the end card) begins
const total = board.totalSeconds;
const duckAt = total - board.shots[board.shots.length - 1].seconds;
ff(["-f", "lavfi", "-i",
  `aevalsrc=0.55*( sin(2*PI*(45+85*exp(-35*mod(t\\,0.4545)))*mod(t\\,0.4545))*exp(-9*mod(t\\,0.4545))*0.95 + sin(2*PI*(36+50*exp(-18*mod(t\\,1.818)))*mod(t\\,1.818))*exp(-4.5*mod(t\\,1.818))*0.75 + (random(0)-0.5)*exp(-70*mod(t+0.227\\,0.4545))*0.5 + 0.10*sin(2*PI*55*t) + 0.05*sin(2*PI*110.3*t) ):s=44100:d=${total}`,
  "-af", `acompressor=threshold=-14dB:ratio=3:attack=4:release=90,volume='if(gt(t,${duckAt.toFixed(1)}),0.18,1)':eval=frame,afade=t=in:st=0:d=0.4,afade=t=out:st=${(total - 1.4).toFixed(1)}:d=1.4,alimiter=limit=0.92`,
  join(outDir, "beat.wav")]);

ff(["-i", join(outDir, "video-silent.mp4"), "-i", join(outDir, "beat.wav"), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", join(outDir, "final.mp4")]);

// provenance record beside the artifact — receipts for footage, always
const used = board.shots.filter((s) => s.kind === "archival").map((s) => manifest.clips[s.footageQuery]);
writeFileSync(join(outDir, "PROVENANCE.txt"),
  `FOOTAGE PROVENANCE · rendered ${new Date().toISOString()} · template ${board.template}\n` +
  used.map((c) => `${c.identifier} · ${c.collection} · ${c.license} · ${c.url ?? c.file}`).join("\n") + "\n");

console.log(`✓ final: ${join(outDir, "final.mp4")} (${total}s) + PROVENANCE.txt`);
