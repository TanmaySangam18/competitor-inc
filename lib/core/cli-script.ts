// ─────────────────────────────────────────────────────────────────────────────
// THE ONE-LINE ACTIVATION (ADR-0011): `curl -fsSL <site>/api/cli | node`
//
// This module GENERATES the zero-dependency Node script our own domain serves. The user runs one line;
// the script pairs the terminal to their signed-in browser session (copy-paste a short-lived signed
// code — no localhost listener, no mixed-content games), then walks the connection map: OAuth-armed
// providers open in the browser, key-based ones are prompted for and stored ENCRYPTED in the user's
// vault (ADR-0010). Transparent by design: curl it without piping and read every line.
//
// HONESTY RULES: the script never claims a connection it didn't verify via /api/cli/status; skipped
// entries are listed as skipped; secrets are read with echo off and never printed back.
// ─────────────────────────────────────────────────────────────────────────────

export function cliScript(origin: string): string {
  const o = origin.replace(/\/$/, "");
  return `#!/usr/bin/env node
// competitor.inc — one-line activation. Read me before piping: curl -fsSL ${o}/api/cli
const readline = require("node:readline");
const { execFile } = require("node:child_process");

const ORIGIN = ${JSON.stringify(o)};
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));
const askSecret = (q) => new Promise((res) => {
  process.stdout.write(q);
  const onData = (c) => { const s = c.toString(); if (s.includes("\\n")) { process.stdin.off("data", onData); process.stdout.write("\\n"); res(buf.trim()); } else buf += s; };
  let buf = ""; process.stdin.setRawMode && process.stdin.setRawMode(true);
  const plain = (c) => { buf += c; };
  // raw mode: collect chars without echo; Enter finishes; Ctrl-C aborts
  const raw = (c) => {
    const ch = c.toString();
    if (ch === "\\u0003") { process.exit(1); }
    if (ch === "\\r" || ch === "\\n") { process.stdin.setRawMode(false); process.stdin.off("data", raw); process.stdout.write("\\n"); res(buf); return; }
    if (ch === "\\u007f") { buf = buf.slice(0, -1); return; }
    buf += ch;
  };
  if (process.stdin.setRawMode) { process.stdin.resume(); process.stdin.on("data", raw); } else { process.stdin.on("data", onData); }
});
const openBrowser = (url) => {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  execFile(cmd, [url], () => {});
};
const post = async (path, body) => {
  const r = await fetch(ORIGIN + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

(async () => {
  console.log("");
  console.log("  competitor.inc — connect your company. One terminal, ~2 minutes.");
  console.log("  Everything lands encrypted in YOUR vault; revoke any time on /connect.");
  console.log("");
  console.log("  Step 1 · Pair this terminal:");
  console.log("    Opening " + ORIGIN + "/cli/pair — sign in and copy the pairing code (valid 10 minutes).");
  openBrowser(ORIGIN + "/cli/pair");
  const token = (await ask("    Paste pairing code: ")).trim();
  const who = await post("/api/cli/status", { token });
  if (who.status !== 200) { console.log("    ✗ Pairing failed: " + (who.data.error || who.status) + " — get a fresh code and rerun."); process.exit(1); }
  console.log("    ✓ Paired.");

  const map = await fetch(ORIGIN + "/api/cli/map").then((r) => r.json());
  const done = [], skipped = [];
  console.log("");
  console.log("  Step 2 · Connections (Enter to skip any):");
  for (const c of map.connections) {
    if (c.oauth) {
      const a = (await ask("    " + c.name + " — press o to open OAuth in browser, Enter to skip: ")).trim().toLowerCase();
      if (a === "o") { openBrowser(ORIGIN + c.oauth); await ask("      Finish in the browser, then press Enter…"); done.push(c.name + " (verify on /connect)"); }
      else skipped.push(c.name);
      continue;
    }
    if (!c.env || c.env.length === 0) { skipped.push(c.name + " (tracked only — nothing to store)"); continue; }
    const v = await askSecret("    " + c.name + " — paste " + c.env[0] + " (hidden, Enter to skip): ");
    if (!v) { skipped.push(c.name); continue; }
    const r = await post("/api/cli/store", { token, connectionId: c.id, envName: c.env[0], value: v });
    if (r.status === 200) { done.push(c.name); console.log("      ✓ stored encrypted"); }
    else { skipped.push(c.name + " (store failed: " + (r.data.error || r.status) + ")"); console.log("      ✗ " + (r.data.error || "failed") + " — not stored"); }
  }

  console.log("");
  const st = await post("/api/cli/status", { token });
  const n = st.status === 200 ? st.data.connections.length : 0;
  console.log("  Done. " + n + " connection(s) in your vault." + (skipped.length ? " Skipped: " + skipped.join(", ") + "." : ""));
  console.log("  Live status, buttons, and revocation: " + ORIGIN + "/connect");
  console.log("");
  rl.close(); process.exit(0);
})().catch((e) => { console.error("  ✗ " + (e && e.message || e)); process.exit(1); });
`;
}
