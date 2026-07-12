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

function cmdDeliberate(args: string[]) {
  const task = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!task) { line(`usage: npm run competitor -- deliberate "<task>"`); process.exitCode = 1; return; }
  const d = core.deliberate(task);
  line(`competitor — deliberation${d.simulated ? "   (structure + governance real; reasoned debate pending a model key)" : ""}`);
  line(`  task:  ${d.task}`);
  line(`  room:  ${d.participants.join(", ")}`);
  line(``);
  for (const p of d.positions) line(`  ${p.title} — ${p.stance}`);
  line(``);
  line(`  decision: ${d.decision}  (by ${d.decidedBy})`);
  line(`  why:      ${d.rationale}`);
}

function cmdHelp() {
  line(`competitor — the company OS, from the terminal`);
  line(``);
  line(`  org                      the org: positions, departments, integrity check`);
  line(`  agents                   the governed agent roster (real titles)`);
  line(`  decide [--type ..] [--agent ..] [--amount N] [--no-reversible] ...`);
  line(`                           run one action through the governance engine → AUTO | QUEUE | BLOCK`);
  line(`  deliberate "<task>"     convene the relevant roles → a governed Decision Record`);
  line(`  help                     this`);
  line(``);
  line(`  e.g.  npm run competitor -- decide --type spend --agent marketing --amount 600`);
  line(`        npm run competitor -- deliberate "launch a paid ads campaign for $2000"`);
}

switch (cmd) {
  case "org": cmdOrg(); break;
  case "agents": cmdAgents(); break;
  case "decide": cmdDecide(rest); break;
  case "deliberate": cmdDeliberate(rest); break;
  case "help": case undefined: cmdHelp(); break;
  default:
    line(`unknown command: ${cmd}`);
    cmdHelp();
    process.exitCode = 1;
}
