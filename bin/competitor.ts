#!/usr/bin/env tsx
// `competitor` — operate the company OS from the terminal. The proof that the backend is the product: the
// same lib/core that powers the web app answers here with no React, no server, no keys. Run: `npm run
// competitor -- <command>`. This is the interim primary interface while the backend is built out; the web
// app is just one more client of the same core.

import { core, type ActionContext, type AgentRole, type ExecAction } from "@/lib/core";

const [cmd, ...rest] = process.argv.slice(2);

// tiny, dependency-free flag parser: --key value  /  --flag (boolean true)  /  --no-flag (boolean false)
function flags(args: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key.startsWith("no-")) { out[key.slice(3)] = false; continue; }
    const next = args[i + 1];
    if (next && !next.startsWith("--")) { out[key] = next; i++; } else { out[key] = true; }
  }
  return out;
}

function line(s = "") { process.stdout.write(s + "\n"); }

function cmdOrg() {
  const issues = core.org.validate();
  line(`competitor — org`);
  line(`  positions:   ${core.org.size()}`);
  line(`  departments: ${core.org.departments.length}  (${core.org.departments.map((d) => d.name).join(", ")})`);
  line(`  integrity:   ${issues.length === 0 ? "OK — no issues" : `${issues.length} issue(s)`}`);
  for (const i of issues) line(`    · ${JSON.stringify(i)}`);
}

function cmdAgents() {
  line(`competitor — governed agents (${core.agents.roles.length})`);
  for (const a of core.agents.roles) {
    line(`  ${a.title.padEnd(20)} ${String(a.department).padEnd(12)} ${a.blurb}`);
  }
}

function cmdDecide(args: string[]) {
  const f = flags(args);
  const ctx: ActionContext = {
    type: (f.type as ExecAction) ?? "spend",
    agent: (f.agent as AgentRole) ?? "marketing",
    amountUsd: f.amount !== undefined ? Number(f.amount) : undefined,
    hasCredential: f.credential === undefined ? undefined : Boolean(f.credential),
    compliancePass: f.compliance === undefined ? undefined : Boolean(f.compliance),
    observable: f.observable === undefined ? undefined : Boolean(f.observable),
    reversible: f.reversible === undefined ? undefined : Boolean(f.reversible),
  };
  const d = core.governance.governedDecision(ctx);
  line(`competitor — decide`);
  line(`  action:  ${ctx.type} by ${ctx.agent}${ctx.amountUsd !== undefined ? ` ($${ctx.amountUsd})` : ""}`);
  line(`  tier:    ${d.tier}  (${d.tierReason})`);
  line(`  verdict: ${d.verdict}`);
  line(`  reason:  ${d.reason}`);
}

async function cmdDeliberate(args: string[]) {
  const task = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!task) { line(`usage: npm run competitor -- deliberate "<task>"`); process.exitCode = 1; return; }
  const d = await core.deliberate(task);
  line(`competitor — deliberation${d.simulated ? "   (structure + governance real; reasoned debate pending a model key)" : ""}`);
  line(`  task:  ${d.task}`);
  line(`  room:  ${d.participants.join(", ")}`);
  line(``);
  for (const p of d.positions) line(`  ${p.title} — ${p.stance}`);
  line(``);
  line(`  decision: ${d.decision}  (by ${d.decidedBy})`);
  line(`  why:      ${d.rationale}`);
}

function cmdPlan(args: string[]) {
  const goal = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!goal) { line(`usage: npm run competitor -- plan "<goal>"`); process.exitCode = 1; return; }
  const p = core.plan(goal, { operate: Boolean(flags(args).operate) });
  line(`competitor — plan  (${p.tasks.length} tasks)`);
  line(`  goal: ${p.goal}`);
  line(``);
  for (const step of p.chain) line(`  • ${step}`);
}

async function cmdRun(args: string[]) {
  const goal = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!goal) { line(`usage: npm run competitor -- run "<goal>"`); process.exitCode = 1; return; }
  const c = await core.coordinate(goal, { operate: Boolean(flags(args).operate) });
  const { tasks, proceed, escalate } = c.summary;
  line(`competitor — run  (${tasks} tasks: ${proceed} proceed, ${escalate} escalate-to-founder)`);
  line(`  goal: ${c.goal}`);
  line(``);
  c.plan.tasks.forEach((t, i) => {
    const d = c.decisions[i];
    const tag = d.decision === "escalate-to-founder" ? "⛳ founder" : "▶ proceed";
    line(`  ${tag}  ${t.orgTitle ?? t.role}: ${t.goal}`);
  });
}

async function cmdDrills() {
  const r = await core.drills();
  line(`competitor — failure drills (ship gate)  ${r.ok ? "ALL PASS ✓" : `${r.passed}/${r.total} — NOT READY`}`);
  line(``);
  for (const d of r.drills) line(`  ${d.passed ? "✓" : "✗"}  ${d.name.padEnd(22)} ${d.detail}`);
  if (!r.ok) process.exitCode = 1;
}

async function cmdDoctor() {
  const h = await core.checkHealth();
  line(`competitor — doctor  (${h.ok ? "ALL SYSTEMS GO" : "ATTENTION NEEDED"})`);
  line(``);
  for (const c of h.checks) line(`  ${c.ok ? "✓" : "✗"}  ${c.name.padEnd(12)} ${c.detail}`);
  if (!h.ok) process.exitCode = 1;
}

function cmdOutreach(args: string[]) {
  const f = flags(args);
  const company = typeof f.company === "string" ? f.company : "";
  if (!company) {
    line(`usage: npm run competitor -- outreach --company "<name>" [--source referral|inbound|community|event|list] [--trigger "..."] [--title "..."] [--size N] [--name "..."] [--permission]`);
    process.exitCode = 1; return;
  }
  const lead: import("@/lib/core").Lead = {
    id: "cli",
    company,
    name: typeof f.name === "string" ? f.name : undefined,
    title: typeof f.title === "string" ? f.title : undefined,
    companySize: f.size !== undefined ? Number(f.size) : undefined,
    source: (typeof f.source === "string" ? f.source : "list") as import("@/lib/core").Lead["source"],
    triggerReason: typeof f.trigger === "string" ? f.trigger : undefined,
    contactPermission: f.permission === true || undefined,
    signals: typeof f.signals === "string" ? f.signals.split(",").map((s) => s.trim()) : undefined,
  };
  const p = core.outreach.for(lead);
  line(`competitor — outreach`);
  line(`  lead:  ${company}${lead.title ? ` (${lead.title})` : ""} · source: ${lead.source}`);
  line(`  fit:   ${p.qualification.fit}/100 · ${p.qualification.tier}`);
  line(`  gate:  ${p.gate.allowed ? "✓ allowed" : "✗ blocked"} — ${p.gate.reason}`);
  if (p.draft) {
    line(``);
    line(`  subject: ${p.draft.subject}`);
    line(`  ${p.draft.body}`);
  } else {
    line(`  (no draft — the no-spam rail blocked this contact)`);
  }
  line(``);
  line(`  send:  ${core.outreach.configured() ? "configured — governed transmit ready (CAN-SPAM + AI-disclosed)" : "not configured — add a send credential to transmit"}`);
}

function cmdOperate(args: string[]) {
  const f = flags(args);
  const body = typeof f.body === "string" ? f.body : "";
  if (!body) {
    line(`usage: npm run competitor -- operate --type bug|info|feature|billing --body "<end-user ticket>" [--regulated]`);
    process.exitCode = 1; return;
  }
  const ticket: import("@/lib/core").Ticket = {
    id: "cli",
    type: (typeof f.type === "string" ? f.type : "bug") as import("@/lib/core").Ticket["type"],
    body,
  };
  const tri = core.operate.triageTicket(ticket);
  line(`competitor — operate (end-user ticket)`);
  line(`  ticket: [${ticket.type}] ${body}`);
  line(`  route:  ${tri.route}  (${tri.autonomy})`);
  line(`  why:    ${tri.why}`);
  if (tri.route === "fix") {
    const cycle = core.operate.improve({
      product: "your product",
      signals: [core.operate.ticketToSignal(ticket)],
      regulated: f.regulated === true,
    });
    line(``);
    line(`  → improvement loop:`);
    for (const a of cycle.actions) {
      const tag = a.lane === "auto" ? "▶ auto" : a.lane === "owner-approval" ? "⛳ your OK" : "⛔ held";
      line(`     ${tag}  ${a.task}`);
    }
    line(`  ${cycle.report}`);
  }
}

async function cmdRoom(args: string[]) {
  const task = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!task) { line(`usage: npm run competitor -- room "<task>"`); process.exitCode = 1; return; }
  const convo = await core.room.conversation(task);
  line(`competitor — team room${convo.simulated ? "   (structure + governance real; live reasoning wakes with a model key)" : ""}`);
  line(`  task: ${convo.task}`);
  line(``);
  for (const t of convo.turns) {
    const tag = t.kind === "decision" ? "⛳" : t.kind === "open" ? "▸" : "·";
    line(`  ${tag} ${t.title}: ${t.text}`);
  }
}

function cmdControl() {
  const ks = core.killSwitch.status();
  const integ = core.audit.verifyIntegrity();
  line(`competitor — control plane (out-of-band)`);
  line(`  global stop:   ${ks.global ? "ENGAGED — all actions halted" : "clear"}`);
  line(`  stopped agents: ${ks.agents.length ? ks.agents.join(", ") : "(none)"}`);
  line(`  frozen customers: ${ks.customers.length ? ks.customers.join(", ") : "(none)"}`);
  line(`  audit ledger:  ${integ.count} entries · integrity ${integ.ok ? "OK" : `BROKEN at #${integ.brokenAt} (${integ.reason})`}`);
}

function cmdStop(args: string[], engage: boolean) {
  const f = flags(args);
  const verb = engage ? "engage" : "clear";
  if (f.global) { engage ? core.killSwitch.engageGlobal() : core.killSwitch.disengageGlobal(); line(`global stop ${engage ? "ENGAGED" : "cleared"}`); }
  else if (typeof f.agent === "string") { engage ? core.killSwitch.stopAgent(f.agent) : core.killSwitch.resumeAgent(f.agent); line(`agent "${f.agent}" ${engage ? "stopped" : "resumed"}`); }
  else if (typeof f.customer === "string") { engage ? core.killSwitch.freezeCustomer(f.customer) : core.killSwitch.unfreezeCustomer(f.customer); line(`customer "${f.customer}" ${engage ? "frozen" : "unfrozen"}`); }
  else { line(`usage: npm run competitor -- ${engage ? "stop" : "resume"} --global | --agent <id> | --customer <id>`); process.exitCode = 1; return; }
  cmdControl();
}

function cmdAudit(args: string[]) {
  const f = flags(args);
  const n = f.n !== undefined ? Number(f.n) : 10;
  const all = core.audit.all();
  const integ = core.audit.verifyIntegrity();
  line(`competitor — audit ledger (${all.length} entries · integrity ${integ.ok ? "OK" : "BROKEN"})`);
  for (const e of all.slice(-n)) {
    line(`  #${e.seq} ${e.ts}  ${e.actor} · ${e.action}${e.customer ? ` (${e.customer})` : ""} → ${e.verdict ?? "?"}${e.rationale ? ` — ${e.rationale}` : ""}`);
  }
  if (all.length === 0) line(`  (empty — the ledger records governed actions at runtime)`);
}

function cmdScreen(args: string[]) {
  const summary = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!summary) { line(`usage: npm run competitor -- screen "<what the customer wants to build/do>"`); process.exitCode = 1; return; }
  const r = core.abuse.screenIntake({ summary });
  const tag = r.decision === "allow" ? "✓ allow" : r.decision === "review" ? "⛳ human review" : "⛔ deny";
  line(`competitor — intake screen`);
  line(`  use:      ${summary}`);
  line(`  decision: ${tag}`);
  line(`  why:      ${r.reason}${r.matched.length ? ` (matched: ${r.matched.join(", ")})` : ""}`);
}

function cmdServices() {
  const services = core.listServices();
  const badge = (s: string) => (s === "ready" ? "ready" : s === "partial" ? "partial" : "planned");
  line(`competitor — services  (${services.length} the customer can hire)`);
  line(`  ready = built + tested, keyless (needs a key to act live) · partial = some pieces built · planned = decided, not built`);
  line(``);
  for (const s of services) {
    line(`  ${s.flagship ? "★" : " "} [${badge(s.status).padEnd(7)}] ${s.name}`);
    line(`      ${s.summary}`);
    line(`      run by: ${s.agents.join(", ")}`);
    line(``);
  }
}

function cmdEconomics() {
  const r = core.economics.rollup(core.audit.all());
  line(`competitor — unit economics (from the audit ledger)`);
  line(`  total cost:   $${r.totalUsd.toFixed(4)}`);
  const custs = Object.entries(r.perCustomer);
  line(`  per customer: ${custs.length ? custs.map(([c, v]) => `${c} $${v.toFixed(4)}`).join(" · ") : "(none recorded yet)"}`);
  const agents = Object.entries(r.perAgent);
  line(`  per agent:    ${agents.length ? agents.map(([a, v]) => `${a} $${v.toFixed(4)}`).join(" · ") : "(none)"}`);
  line(`  note: cost is attributed per governed action; margin needs revenue (Stripe Connect events).`);
}

function cmdPayments() {
  const configured = core.payments.configured();
  line(`competitor — payments  (${configured ? "LIVE — Stripe connected" : "not configured"})`);
  line(`  model:   Stripe Connect — a product's buyers pay the CUSTOMER's own account; we orchestrate, never hold it`);
  line(`  in:      POST /api/payments/stripe (verified webhook) → revenue_events (the honest ledger)`);
  line(`  floor:   payouts / refunds / transfers stay founder-approved`);
  if (!configured) line(`  enable:  add STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET) in the env — then a product can charge`);
  // read-only by design: onboarding a Stripe account is a real side effect → done from the governed
  // engine / an authenticated dashboard action (core.connectProduct), never casually from the CLI.
}

function cmdHelp() {
  line(`competitor — the company OS, from the terminal`);
  line(``);
  line(`  org                      the org: positions, departments, integrity check`);
  line(`  agents                   the governed agent roster (real titles)`);
  line(`  decide [--type ..] [--agent ..] [--amount N] [--no-reversible] ...`);
  line(`                           run one action through the governance engine → AUTO | QUEUE | BLOCK`);
  line(`  deliberate "<task>"     convene the relevant roles → a governed Decision Record`);
  line(`  plan "<goal>"           break a goal into the org's IC→lead→sign-off task chain`);
  line(`  run "<goal>"            plan it AND govern every task → what proceeds vs escalates`);
  line(`  room "<task>"           watch the team deliberate it → a chair-led conversation`);
  line(`  doctor                   self-check: is the whole company OS coherent + alive?`);
  line(`  control                  the out-of-band control plane: kill-switch state + audit integrity`);
  line(`  stop  --global | --agent <id> | --customer <id>     throw a kill switch`);
  line(`  resume --global | --agent <id> | --customer <id>    clear a kill switch`);
  line(`  audit [--n N]            the append-only black-box ledger (last N + integrity check)`);
  line(`  screen "<use>"          screen a customer's use-case against the prohibited-use list`);
  line(`  services                 the catalog a customer can hire (build-run-sell, growth, support, ...)`);
  line(`  payments                 the money layer's status (Stripe Connect)`);
  line(`  economics                per-customer unit economics (cost per customer/agent from the ledger)`);
  line(`  outreach --company "<x>"  qualify a lead → no-spam gate → honest first-touch draft`);
  line(`  operate --type .. --body "<ticket>"  triage an end-user ticket → the governed improvement loop`);
  line(`  help                     this`);
  line(``);
  line(`  e.g.  npm run competitor -- decide --type spend --agent marketing --amount 600`);
  line(`        npm run competitor -- deliberate "launch a paid ads campaign for $2000"`);
  line(`        npm run competitor -- plan "a booking tool for a dog groomer"`);
}

async function main() {
  switch (cmd) {
    case "org": cmdOrg(); break;
    case "agents": cmdAgents(); break;
    case "decide": cmdDecide(rest); break;
    case "deliberate": await cmdDeliberate(rest); break;
    case "plan": cmdPlan(rest); break;
    case "run": await cmdRun(rest); break;
    case "room": await cmdRoom(rest); break;
    case "control": cmdControl(); break;
    case "stop": cmdStop(rest, true); break;
    case "resume": cmdStop(rest, false); break;
    case "audit": cmdAudit(rest); break;
    case "screen": cmdScreen(rest); break;
    case "payments": cmdPayments(); break;
    case "economics": cmdEconomics(); break;
    case "services": cmdServices(); break;
    case "outreach": cmdOutreach(rest); break;
    case "operate": cmdOperate(rest); break;
    case "doctor": await cmdDoctor(); break;
    case "drills": await cmdDrills(); break;
    case "help": case undefined: cmdHelp(); break;
    default:
      line(`unknown command: ${cmd}`);
      cmdHelp();
      process.exitCode = 1;
  }
}

main();
