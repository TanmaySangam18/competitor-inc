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
  const d = core.governance.decide(ctx);
  line(`competitor — decide`);
  line(`  action:  ${ctx.type} by ${ctx.agent}${ctx.amountUsd !== undefined ? ` ($${ctx.amountUsd})` : ""}`);
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

async function cmdDoctor() {
  const h = await core.checkHealth();
  line(`competitor — doctor  (${h.ok ? "ALL SYSTEMS GO" : "ATTENTION NEEDED"})`);
  line(``);
  for (const c of h.checks) line(`  ${c.ok ? "✓" : "✗"}  ${c.name.padEnd(12)} ${c.detail}`);
  if (!h.ok) process.exitCode = 1;
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
  line(`  doctor                   self-check: is the whole company OS coherent + alive?`);
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
    case "doctor": await cmdDoctor(); break;
    case "help": case undefined: cmdHelp(); break;
    default:
      line(`unknown command: ${cmd}`);
      cmdHelp();
      process.exitCode = 1;
  }
}

main();
