// E2E smoke + API fuzz against the PRODUCTION build (Testing Trophy's top layer).
// Boots `next start`, sweeps every route + API, fuzzes the API for 5xx, then tears down.
// Run via `npm run qa` (which builds first). Exit non-zero on any failure.
import { spawn } from "node:child_process";

const PORT = 3041;
const BASE = `http://localhost:${PORT}`;
const root = process.cwd();
let failures = 0;
const fail = (m) => { failures++; console.error("  ✗", m); };
const ok = (m) => console.log("  ✓", m);

async function get(path, want = 200) {
  try {
    const r = await fetch(BASE + path, { signal: AbortSignal.timeout(10000) });
    if (r.status >= 500) fail(`GET ${path} → ${r.status} (5xx)`);
    else if (r.status !== want) fail(`GET ${path} → ${r.status} (want ${want})`);
    else ok(`GET ${path} → ${r.status}`);
    return r;
  } catch (e) { fail(`GET ${path} threw: ${e}`); }
}

async function post(path, body, want) {
  try {
    const r = await fetch(BASE + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    // Only flag 5xx as unexpected when the caller didn't explicitly request a 5xx status.
    if (r.status >= 500 && (!want || want < 500)) fail(`POST ${path} → ${r.status} (5xx!) ${JSON.stringify(body).slice(0, 50)}`);
    else if (want && r.status !== want) fail(`POST ${path} → ${r.status} (want ${want})`);
    return r;
  } catch (e) { fail(`POST ${path} threw: ${e}`); }
}

async function waitReady(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(3000) }); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const company = { id: "c1", name: "X", slug: "x", idea: "an idea", createdAt: 0, status: "operating", night: 0, ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 } };

async function run() {
  console.log("• routes");
  const home = await get("/");
  if (home) { const t = await home.text(); t.includes("competitor.inc") ? ok("/ contains brand") : fail("/ missing 'competitor.inc'"); }
  await get("/dashboard"); await get("/login"); await get("/live"); await get("/dashboard/settings"); await get("/join"); await get("/how-it-works"); await get("/delegation"); await get("/house"); await get("/house/board");
  await get("/proof");
  await get("/radar");
  await get("/compare");
  await get("/lockin");
  await get("/playbooks"); await get("/playbooks/validate-before-you-build");
  await get("/playbooks/how-people-decide"); await get("/playbooks/tell-a-story-that-sells");
  await get("/playbooks/cold-outreach-that-isnt-spam");
  await get("/playbooks/run-a-discovery-call"); await get("/playbooks/close-without-being-pushy");
  await get("/playbooks/keep-them-then-grow-them"); await get("/playbooks/price-without-leaving-money");
  await get("/playbooks/not-a-real-playbook", 404);
  await get("/definitely-not-a-real-route", 404);
  await get("/sitemap.xml"); await get("/robots.txt");

  console.log("• api happy path");
  const st = await get("/api/engine");
  if (st) { const j = await st.json(); j.ok === true ? ok("status ok") : fail("status not ok"); }
  const v = await post("/api/engine", { kind: "validate", idea: "a meal planner" }, 200);
  if (v) { const j = await v.json(); j.validation && ["strong", "weak"].includes(j.validation.verdict) ? ok("validate shape ok") : fail("validate shape bad"); }
  const s = await post("/api/engine", { kind: "shift", company }, 200);
  if (s) { const j = await s.json(); Array.isArray(j.activities) && Array.isArray(j.approvals) ? ok("shift shape ok") : fail("shift shape bad"); }
  const c = await post("/api/engine", { kind: "chat", company: { name: "X", idea: "i" }, message: "hi" }, 200);
  if (c) { const t = await c.text(); t.trim().length > 0 ? ok("chat streamed text") : fail("chat empty"); }
  // N1: a consequential request queues a real approval (signalled via header); a benign one doesn't.
  const ca = await post("/api/engine", { kind: "chat", company: { name: "X", idea: "i" }, message: "Spend $200 on Google ads" }, 200);
  if (ca) { await ca.text(); ca.headers.get("x-approval") ? ok("chat queued an approval") : fail("chat did not queue approval"); }
  const cb = await post("/api/engine", { kind: "chat", company: { name: "X", idea: "i" }, message: "how are we doing this week?" }, 200);
  if (cb) { await cb.text(); !cb.headers.get("x-approval") ? ok("benign chat queued nothing") : fail("benign chat wrongly queued"); }

  console.log("• waitlist capture (fail-soft without Supabase)");
  const wl = await post("/api/waitlist", { email: "smoke@example.com", ref: null }, 200);
  if (wl) { const j = await wl.json(); j.ok && typeof j.code === "string" ? ok("waitlist returns ok + code") : fail("waitlist shape bad"); }
  await post("/api/waitlist", { email: "not-an-email" }, 400);
  await post("/api/waitlist", {}, 400);

  console.log("• demand radar (input guards — no live crawl in smoke)");
  await post("/api/radar", { idea: "x" }, 400); // too short → rejects before crawling
  await post("/api/radar", {}, 400);
  ok("radar rejects bad input before crawling");

  console.log("• demand test (fail-soft without Supabase)");
  const dq = await get("/api/demand?slug=smoke-test");
  if (dq) { const j = await dq.json(); j.ok && typeof j.signups === "number" ? ok("demand GET returns shape") : fail("demand GET shape bad"); }
  const ds = await post("/api/demand", { action: "signup", slug: "smoke-test", email: "v@example.com" }, 200);
  if (ds) { const j = await ds.json(); j.ok ? ok("demand signup ok") : fail("demand signup bad"); }
  await post("/api/demand", { action: "signup", slug: "x", email: "bad" }, 400);
  await post("/api/demand", { action: "nope" }, 400);
  await get("/t/no-such-demand-test", 404);
  const mt = await get("/api/metrics");
  if (mt) { const j = await mt.json(); j.ok ? ok("metrics returns ok (locked without secret)") : fail("metrics shape bad"); }
  // Billing webhook is fail-CLOSED without LEMONSQUEEZY_WEBHOOK_SECRET — 503 is correct here.
  await post("/api/billing/webhook", { meta: { event_name: "subscription_created" } }, 503);
  ok("billing webhook rejects when unconfigured (fail-closed)");
  await post("/api/billing/webhook", { meta: { event_name: "order_created" } }, 503);
  ok("billing webhook rejects non-subscription (fail-closed)");
  // Polar (Merchant-of-Record) webhook is fail-CLOSED too: 503 until POLAR_WEBHOOK_SECRET is set.
  await post("/api/billing/polar", { type: "subscription.created", data: {} }, 503);
  ok("polar webhook rejects when unconfigured (fail-closed)");
  // Nightly heartbeat triggers real spend/deploys — it must be fail-CLOSED: 401 unauthenticated AND
  // 401 with a wrong bearer (never silently open, even before CRON_SECRET is set).
  await get("/api/cron", 401);
  ok("cron heartbeat rejects unauthenticated (fail-closed)");
  const cronBad = await fetch(BASE + "/api/cron", { headers: { authorization: "Bearer wrong-secret" }, signal: AbortSignal.timeout(10000) }).catch(() => null);
  if (cronBad && cronBad.status === 401) ok("cron heartbeat rejects a wrong bearer (401)");
  else fail(`cron heartbeat with wrong bearer → ${cronBad ? cronBad.status : "threw"} (want 401)`);

  console.log("• new routes (enrich / import / proof — gated, fail-soft)");
  const en = await get("/api/enrich");
  if (en) { const j = await en.json(); typeof j.found === "boolean" ? ok("enrich acks (found:false without session)") : fail("enrich shape bad"); }
  // Right-to-delete: self-only DELETE is fail-soft (returns ok even with no session / nothing stored).
  const ed = await fetch(BASE + "/api/enrich", { method: "DELETE", signal: AbortSignal.timeout(10000) }).catch(() => null);
  if (ed && ed.status < 500) { const j = await ed.json().catch(() => ({})); j.ok ? ok("enrich DELETE acks (right-to-delete, fail-soft)") : fail("enrich DELETE shape bad"); }
  else fail(`enrich DELETE → ${ed ? ed.status : "threw"}`);
  // SSRF-blocked URL → fails before any network call, so smoke needs no internet.
  const im = await post("/api/import", { url: "http://localhost:99" }, 200);
  if (im) { const j = await im.json(); j.ok === false ? ok("import refuses an unsafe URL (fail-soft)") : fail("import shape bad"); }
  await post("/api/import", {}, 400);
  // Ownership verify: self-only. Without a session → signedIn:false (no token handed to a guest). No network.
  const ov = await post("/api/import/verify", { url: "acme.com" }, 200);
  if (ov) { const j = await ov.json(); j.ok && j.signedIn === false ? ok("import/verify withholds a token from a guest") : fail("import/verify shape bad"); }
  await post("/api/import/verify", { url: "not a domain" }, 400);
  await post("/api/import/verify", {}, 400);
  const pf = await get("/api/proof");
  if (pf) { const j = await pf.json(); (j.locked || Array.isArray(j.cards)) ? ok("proof acks (locked without secret)") : fail("proof shape bad"); }

  const fb = await post("/api/feedback", { message: "smoke feedback", path: "/smoke" }, 200);
  if (fb) { const j = await fb.json(); j.ok ? ok("feedback acks (fail-soft)") : fail("feedback shape bad"); }
  await post("/api/feedback", {}, 400);
  const nt = await post("/api/notify", { chatId: "123", text: "smoke" }, 200);
  if (nt) { const j = await nt.json(); typeof j.disabled === "boolean" || typeof j.ok === "boolean" ? ok("notify acks (gated)") : fail("notify shape bad"); }
  await post("/api/notify", { chatId: "" }, 400);
  await post("/api/notify", { chatId: "123", approval: { title: "" } }, 400);
  // ChatOps: webhook ignores unverified callers (fail-closed → still 200 so Telegram won't retry-storm)
  const tw = await post("/api/telegram/webhook", { callback_query: { id: "1", data: "ap:x:y" } }, 200);
  if (tw) { const j = await tw.json(); j.ok ? ok("telegram webhook acks (ignores unverified)") : fail("tg webhook shape bad"); }
  const td = await get("/api/telegram/decisions?ids=11111111-2222-3333-4444-555555555555");
  if (td) { const j = await td.json(); j.decisions && typeof j.decisions === "object" ? ok("telegram decisions shape ok") : fail("tg decisions shape bad"); }

  console.log("• api 400s");
  await post("/api/engine", { kind: "nope" }, 400);
  await post("/api/engine", { kind: "validate" }, 400);
  await post("/api/engine", { kind: "chat", company: { name: "X", idea: "i" }, message: "   " }, 400);

  console.log("• fuzz — no 5xx under garbage input");
  const payloads = [null, 1, "x", [], true, { kind: "" }, { kind: "validate", idea: 42 }, { kind: "shift" }, { kind: "shift", company: 5 }, { kind: "chat" }, { kind: "chat", message: "" }, { idea: "x".repeat(40000) }, { kind: "validate", idea: " ￿".repeat(500) }];
  for (let i = 0; i < 60; i++) await post("/api/engine", payloads[Math.floor(Math.random() * payloads.length)]);
  ok("fuzzed 60 payloads — zero 5xx" + (failures ? " (see above)" : ""));
}

const bin = root + "/node_modules/.bin/next";
const child = spawn(bin, ["start", "-p", String(PORT)], { cwd: root, stdio: "ignore", detached: true });
try {
  (await waitReady()) ? await run() : fail("server did not become ready in time");
} finally {
  try { process.kill(-child.pid, "SIGTERM"); } catch { try { child.kill("SIGTERM"); } catch {} }
  await new Promise((r) => setTimeout(r, 800));
  try { process.kill(-child.pid, "SIGKILL"); } catch {}
}
console.log(failures ? `\nSMOKE FAILED: ${failures} issue(s)` : "\nSMOKE PASSED ✓");
process.exit(failures ? 1 : 0);
