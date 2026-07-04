"use client";

// The Company Brain — the company's decision history as a living, tappable graph.
// Center = the company. Ring = nights. Leaves = every action and approval: done (filled),
// failed-credited (hollow), rejected (crossed), pending (pulsing ring). Tap any node and the
// panel explains WHY it happened (rationale), HOW (meta + proof), what it cost, and the
// playbook-grounded founder lesson behind it — the operating knowledge early founders usually
// pay years of mistakes to learn. Monochrome ink; everything real, nothing invented.

import { useMemo, useState } from "react";
import type { useEngine } from "@/lib/engine/useEngine";
import { AGENTS, type Activity, type ApprovalItem, type ApprovalKind } from "@/lib/engine/types";
import { rationaleFor } from "@/lib/engine/rationale";
import { auditShiftActivities } from "@/lib/engine/office-house-architecture";

type NodeStatus = "done" | "failed" | "rejected" | "approved" | "pending";

interface BrainNode {
  id: string;
  kind: "activity" | "approval";
  night: number;
  agent: Activity["agent"];
  title: string;
  status: NodeStatus;
  x: number;
  y: number;
  activity?: Activity;
  approval?: ApprovalItem;
  auditIssues?: string[]; // Office Chief Audit Officer flags (overclaim / unproven high cost)
}

// The founder lesson behind each approval kind — why this class of decision deserves a human.
const APPROVAL_LESSONS: Partial<Record<ApprovalKind, string>> = {
  spend: "Pre-revenue, every dollar is runway. Approve spend only against a measurable hypothesis — never against optimism. (The Lean Startup)",
  outreach: "Outbound is your reputation in someone else's inbox. The founder signs every message until the voice is proven. (The Mom Test)",
  deploy: "Ship the smallest real version, verify before done — a launch you can't roll back is a bet you didn't size. (Shape Up)",
  delete: "Destructive operations are one-way doors. Slow down at one-way doors; move fast everywhere else. (Bezos, Type 1/Type 2 decisions)",
  twitter: "Public posts compound — in both directions. Say less, prove more. (Obviously Awesome)",
  linkedin: "Public posts compound — in both directions. Say less, prove more. (Obviously Awesome)",
  reddit: "Communities smell marketing instantly. Contribute first, mention the product last. (Traction)",
  bluesky: "Public posts compound — in both directions. Say less, prove more. (Obviously Awesome)",
  mastodon: "Public posts compound — in both directions. Say less, prove more. (Obviously Awesome)",
};

const CX = 300;
const CY = 280;
const HUB_R = 105;
const LEAF_R = 205;
const MAX_NIGHTS = 5;

export function BrainTab({ r }: { r: ReturnType<typeof useEngine> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, hubs, stats } = useMemo(() => {
    const live = r.activities.filter((a) => !a.undone);
    const approvals = r.approvals;

    // Run the SAME Office audit the cron runs (pure fn) so the graph shows exactly what the backend
    // flagged — overclaims and unproven high-cost actions — as a badge on the node, no persistence.
    const auditMap = new Map(auditShiftActivities(live).flagged.map((f) => [f.activity.id, f.issues]));

    const nightsAll = Array.from(new Set([...live.map((a) => a.night), ...approvals.map((p) => p.night)])).sort(
      (a, b) => b - a
    );
    const nights = nightsAll.slice(0, MAX_NIGHTS).sort((a, b) => a - b);

    const hubList = nights.map((night, i) => {
      const angle = (i / Math.max(nights.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return { night, angle, x: CX + Math.cos(angle) * HUB_R, y: CY + Math.sin(angle) * HUB_R };
    });

    const nodeList: BrainNode[] = [];
    for (const hub of hubList) {
      const acts = live.filter((a) => a.night === hub.night);
      const apps = approvals.filter((p) => p.night === hub.night);
      const items: Array<{ a?: Activity; p?: ApprovalItem }> = [
        ...acts.map((a) => ({ a })),
        ...apps.map((p) => ({ p })),
      ].slice(0, 8);

      items.forEach((item, j) => {
        const spread = Math.PI / 3.2;
        const offset = items.length > 1 ? (j / (items.length - 1) - 0.5) * spread : 0;
        const angle = hub.angle + offset;
        const x = CX + Math.cos(angle) * LEAF_R;
        const y = CY + Math.sin(angle) * LEAF_R;

        if (item.a) {
          nodeList.push({
            id: item.a.id,
            kind: "activity",
            night: hub.night,
            agent: item.a.agent,
            title: item.a.action,
            status: item.a.status === "failed-credited" ? "failed" : "done",
            x,
            y,
            activity: item.a,
            auditIssues: auditMap.get(item.a.id),
          });
        } else if (item.p) {
          nodeList.push({
            id: item.p.id,
            kind: "approval",
            night: hub.night,
            agent: item.p.agent,
            title: item.p.title,
            status: item.p.resolved === "rejected" ? "rejected" : item.p.resolved === "approved" ? "approved" : "pending",
            x,
            y,
            approval: item.p,
          });
        }
      });
    }

    const done = live.filter((a) => a.status === "done").length;
    const failed = live.filter((a) => a.status === "failed-credited").length;
    const rejected = approvals.filter((p) => p.resolved === "rejected").length;
    const pending = approvals.filter((p) => !p.resolved).length;

    return {
      nodes: nodeList,
      hubs: hubList,
      stats: { done, failed, rejected, pending, spent: r.company?.ledger.spent ?? 0, credited: r.company?.ledger.credited ?? 0 },
    };
  }, [r.activities, r.approvals, r.company]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        The company brain
        <span className="text-muted-2">· every decision, with the why — tap a node</span>
      </div>

      {/* Stats strip — real ledger numbers only. */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted">
        <span>{stats.done} done</span>
        <span>{stats.failed} failed (credited)</span>
        <span>{stats.rejected} rejected by you</span>
        <span>{stats.pending} awaiting you</span>
        <span>${stats.spent.toFixed(2)} spent</span>
        <span>${stats.credited.toFixed(2)} credited back</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* The graph */}
        <div className="rounded-2xl border border-border bg-bg/30">
          {nodes.length === 0 ? (
            <div className="grid h-72 place-items-center px-6 text-center text-xs text-muted-2">
              The brain forms as the crew works — run tonight&apos;s shift and every decision lands here, with its reasoning.
            </div>
          ) : (
            <svg viewBox="0 0 600 560" className="h-auto w-full" role="img" aria-label="Company decision graph">
              {/* spokes */}
              {hubs.map((h) => (
                <line key={`s-${h.night}`} x1={CX} y1={CY} x2={h.x} y2={h.y} stroke="currentColor" strokeOpacity="0.15" />
              ))}
              {nodes.map((n) => {
                const hub = hubs.find((h) => h.night === n.night)!;
                return (
                  <line
                    key={`e-${n.id}`}
                    x1={hub.x}
                    y1={hub.y}
                    x2={n.x}
                    y2={n.y}
                    stroke="currentColor"
                    strokeOpacity={n.status === "rejected" ? 0.12 : 0.22}
                    strokeDasharray={n.status === "rejected" ? "3 3" : undefined}
                  />
                );
              })}

              {/* center = the company */}
              <circle cx={CX} cy={CY} r="26" fill="currentColor" />
              <text x={CX} y={CY + 4} textAnchor="middle" className="fill-bg" fontSize="11" fontWeight="600">
                {(r.company?.name ?? "you").slice(0, 8)}
              </text>

              {/* night hubs */}
              {hubs.map((h) => (
                <g key={`h-${h.night}`}>
                  <circle cx={h.x} cy={h.y} r="13" fill="none" stroke="currentColor" strokeOpacity="0.5" />
                  <text x={h.x} y={h.y + 3.5} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.7">
                    n{h.night}
                  </text>
                </g>
              ))}

              {/* leaves */}
              {nodes.map((n) => {
                const isSel = n.id === selectedId;
                return (
                  <g
                    key={n.id}
                    onClick={() => setSelectedId(isSel ? null : n.id)}
                    className={`cursor-pointer ${n.status === "pending" ? "animate-pulse" : ""}`}
                    role="button"
                    aria-label={n.title}
                  >
                    <circle cx={n.x} cy={n.y} r="16" fill="transparent" />
                    {n.status === "done" && <circle cx={n.x} cy={n.y} r="9" fill="currentColor" />}
                    {n.status === "approved" && (
                      <>
                        <circle cx={n.x} cy={n.y} r="9" fill="currentColor" />
                        <circle cx={n.x} cy={n.y} r="13" fill="none" stroke="currentColor" strokeOpacity="0.4" />
                      </>
                    )}
                    {n.status === "failed" && (
                      <circle cx={n.x} cy={n.y} r="8" fill="none" stroke="currentColor" strokeDasharray="3 2" />
                    )}
                    {n.status === "pending" && <circle cx={n.x} cy={n.y} r="8" fill="none" stroke="currentColor" strokeWidth="2" />}
                    {n.status === "rejected" && (
                      <>
                        <circle cx={n.x} cy={n.y} r="8" fill="none" stroke="currentColor" strokeOpacity="0.55" />
                        <line x1={n.x - 5} y1={n.y - 5} x2={n.x + 5} y2={n.y + 5} stroke="currentColor" strokeOpacity="0.7" />
                        <line x1={n.x - 5} y1={n.y + 5} x2={n.x + 5} y2={n.y - 5} stroke="currentColor" strokeOpacity="0.7" />
                      </>
                    )}
                    {isSel && <circle cx={n.x} cy={n.y} r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />}
                    {n.auditIssues && n.auditIssues.length > 0 && (
                      <g aria-label="Office audit flag">
                        <circle cx={n.x + 11} cy={n.y - 11} r="7" fill="var(--color-bg, #f7f0da)" stroke="currentColor" strokeWidth="1.5" />
                        <text x={n.x + 11} y={n.y - 7.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">!</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-[10px] text-muted-2">
            <span>● done</span>
            <span>◌ failed (credited)</span>
            <span>⊗ rejected</span>
            <span>◎ awaiting you</span>
            <span>⊙! audit flag</span>
          </div>
        </div>

        {/* The detail panel — why, how, and the founder lesson. */}
        <div className="rounded-2xl border border-border bg-bg/30 p-4">
          {!selected ? (
            <div className="grid h-full min-h-40 place-items-center text-center text-xs text-muted-2">
              Tap a node to see the decision behind it — the why, the how, and the operating lesson.
            </div>
          ) : (
            <NodeDetail node={selected} />
          )}
        </div>
      </div>
    </div>
  );
}

function NodeDetail({ node }: { node: BrainNode }) {
  const agentSpec = AGENTS[node.agent];
  const rationale = node.activity
    ? (node.activity.rationale ?? rationaleFor(node.agent, node.activity.action, node.activity.meta))
    : null;

  const statusLine =
    node.status === "done"
      ? "Done — verified work"
      : node.status === "failed"
        ? "Failed — cost credited back to your allowance"
        : node.status === "approved"
          ? "Approved by you — executed"
          : node.status === "pending"
            ? "Awaiting your yes in the Approval Inbox"
            : "Rejected by you — never executed";

  const lesson = node.approval
    ? (APPROVAL_LESSONS[node.approval.kind] ?? "Consequential moves wait for a human. Autonomy is earned on evidence, never assumed.")
    : rationale?.principle;

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">
          {agentSpec?.name ?? node.agent} · night {node.night} · {node.kind}
        </div>
        <div className="mt-1 font-medium leading-snug text-text">{node.title}</div>
        <div className="mt-1 text-muted">{statusLine}</div>
      </div>

      <div className="border-t border-border pt-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">Why</div>
        <p className="mt-1 leading-relaxed text-muted">
          {node.activity ? rationale?.why : node.approval?.detail || "Queued for your judgment — the policy floor routes consequential moves to a human."}
        </p>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">How</div>
        <p className="mt-1 leading-relaxed text-muted">
          {node.activity?.meta || (node.approval?.amount != null ? `Proposed amount: $${node.approval.amount}` : "No execution detail recorded.")}
        </p>
        {node.activity?.proof && (
          <p className="mt-1 font-mono text-[11px] text-text">✓ proof · {node.activity.proof.kind}: {node.activity.proof.value}</p>
        )}
        {node.activity && <p className="mt-1 font-mono text-[11px] text-muted">cost ${node.activity.cost.toFixed(2)}</p>}
      </div>

      {node.status === "rejected" && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">Why it didn&apos;t run</div>
          <p className="mt-1 leading-relaxed text-muted">
            You declined it. Nothing consequential executes without your yes — and the crew factors the rejection into its next shift.
          </p>
        </div>
      )}

      {node.auditIssues && node.auditIssues.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/60 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">⚠ Office audit flag</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 leading-relaxed text-text">
            {node.auditIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-2">
            The Chief Audit Officer reviews every action after the shift; this one tripped a check. Verify it before you trust it.
          </p>
        </div>
      )}

      {lesson && (
        <div className="rounded-xl border border-border bg-surface/60 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">Founder lesson</div>
          <p className="mt-1 leading-relaxed text-text">{lesson}</p>
        </div>
      )}
    </div>
  );
}
