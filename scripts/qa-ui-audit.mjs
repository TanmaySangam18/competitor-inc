// Repeatable UI audit for the OPERATING dashboard view (the surface the route-pass couldn't reach without a
// company). Loads a demo company (operating), then exercises every tab + the crew/approval/glass-box controls,
// capturing console errors, failed network, dead controls, and screenshots. Run: `node scripts/qa-ui-audit.mjs`
// (needs the dev server up on :3000). HEADED=0 for CI/headless.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = process.env.QA_OUT || "/private/tmp/claude-501/-Users-durgasaitanmaysangam-competitor-inc/f35f24a5-7779-4ba2-a686-b1195ffd1146/scratchpad/qa";
mkdirSync(OUT + "/op", { recursive: true });

const findings = [];
const add = (sev, type, detail) => findings.push({ sev, type, detail });

const browser = await chromium.launch({ headless: process.env.HEADED === "0", slowMo: Number(process.env.SLOWMO || 80) });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errs = [], fails = [];
let net = 0;
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => add("blocker", "uncaught-exception", String(e).slice(0, 200)));
page.on("response", (r) => { net++; if (r.status() >= 400) fails.push(`${r.status()} ${r.url().replace(BASE, "").slice(0, 100)}`); });

// 1) Reach the operating view via the demo company
await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(1500);
let loaded = false;
for (const b of await page.$$("button")) {
  const t = ((await b.textContent()) || "").trim();
  if (/load a demo/i.test(t)) { await b.click().catch(() => {}); loaded = true; break; }
}
await page.waitForTimeout(2000);
if (!loaded) add("blocker", "no-demo-entry", "Could not find the 'load a demo company' entry to reach the operating view");

// 2) Assert the operating-view surfaces render
const body = await page.evaluate(() => document.body.innerText);
const must = {
  "CrewBox ('The crew · the floor')": /the crew|the floor/i,
  "SpecialistCrew ('Your specialist crew')": /your specialist crew/i,
  "Glass Box (every action, logged)": /glass box|every action/i,
  "Approval Inbox or empty-state": /approval inbox|nothing yet|run tonight/i,
};
for (const [name, re] of Object.entries(must)) {
  if (!re.test(body)) add("major", "missing-surface", `Operating view did not render: ${name}`);
}
await page.screenshot({ path: `${OUT}/op/operating-operations.png` }).catch(() => {});

// 3) Click every tab, capture per-tab console/net + screenshot + dead-control check
const TABS = ["Operations", "Growth", "History", "Chat", "Brain", "Operate"];
for (const tab of TABS) {
  const before = { len: body.length, net, url: page.url() };
  let clicked = false;
  for (const b of await page.$$('button, [role="tab"]')) {
    const t = ((await b.textContent()) || "").trim();
    if (new RegExp("^" + tab, "i").test(t) && (await b.isVisible().catch(() => false))) { await b.click().catch(() => {}); clicked = true; break; }
  }
  await page.waitForTimeout(900);
  const afterLen = (await page.evaluate(() => document.body.innerText.length));
  if (!clicked) add("minor", "tab-missing", `Tab "${tab}" not found`);
  else if (Math.abs(afterLen - before.len) < 4 && net === before.net) add("major", "dead-tab", `Tab "${tab}" — click produced no visible change`);
  await page.screenshot({ path: `${OUT}/op/tab-${tab.toLowerCase()}.png` }).catch(() => {});
}

// 4) Crew chat input present + accepts typing (don't submit — no model locally)
await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(1200);
const chatInput = await page.$('input[placeholder*="Ask the crew" i], input[aria-label*="crew" i]');
if (chatInput) { await chatInput.fill("status?").catch(() => {}); add("info", "crew-chat", `Crew chat input present + accepts text: "${await chatInput.inputValue()}"`); }
else add("major", "crew-chat-missing", "CrewBox chat input not found in the operating view");

// 5) Approval approve/reject — only if approvals exist (demo may seed them)
const approveBtns = await page.$$('button[aria-label*="approve" i], button:has-text("Approve")').catch(() => []);
add("info", "approvals-present", `Approve controls found: ${approveBtns.length}`);

for (const e of [...new Set(errs)]) add("major", "console-error", e);
for (const f of [...new Set(fails)]) add("major", "failed-request", f);

await browser.close();
writeFileSync(`${OUT}/operating-findings.json`, JSON.stringify(findings, null, 2));
const bySev = findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});
console.log("=== OPERATING-VIEW AUDIT ===", JSON.stringify(bySev));
for (const f of findings) console.log(`  [${f.sev}] ${f.type}: ${f.detail}`);
