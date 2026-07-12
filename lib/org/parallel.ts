// ─────────────────────────────────────────────────────────────────────────────
// PARALLEL ENGINEERING (P2 — the throughput pillar). Many ICs on concurrent branches, landing SAFELY.
//
// The discipline that lets an org build in parallel without breaking itself:
//   • CI is the ARBITER — a branch that isn't green never merges (no exceptions, no "it's probably fine").
//   • REVIEWER GATES per discipline — the Design-Lead gate, generalized: design always; architect when the
//     change touches structure (api/route/schema/migration); security when it touches auth/keys/input.
//   • A SERIALIZED merge queue — one branch merges at a time, oldest-first.
//   • CONFLICTS ESCALATE — if a branch's files collide with something already merged this round, it is NOT
//     force-merged; it's handed back to the lead to rebase + re-verify.
//
// HONESTY FLOOR ([[crack-audit-and-no-fake-proof]]): a review that is PENDING is not a pass — only an
// explicit "passed" clears the gate (same rule the verification wall + ops desk use). Pure + deterministic:
// no I/O; branches are never mutated.
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewKind = "design" | "architect" | "security";
export type ReviewState = "pending" | "passed" | "failed";

export interface Branch {
  id: string;
  task: string;
  files: string[]; // the files this branch changes (for conflict detection)
  ciGreen: boolean; // the arbiter — must be true to merge
  reviews: Partial<Record<ReviewKind, ReviewState>>; // discipline gates that have a verdict so far
  createdAt: number; // queue order (oldest merges first)
}

/** Which reviews a branch REQUIRES, from what it touches. Design is always required (the existing gate);
 *  architect + security are added only when the change actually reaches structure / trust surfaces. */
export function requiredReviews(files: string[]): ReviewKind[] {
  const req: ReviewKind[] = ["design"];
  if (files.some((f) => /route|\/api\/|schema|migration|\.sql$/i.test(f))) req.push("architect");
  if (files.some((f) => /auth|login|secret|token|password|mandate|policy|\bkey\b|keys/i.test(f))) req.push("security");
  return req;
}

export interface BranchAssessment {
  branchId: string;
  mergeable: boolean;
  blockers: string[]; // honest reasons it can't merge yet (empty ⇒ mergeable)
}

/** Can this branch merge? Green CI + every REQUIRED review explicitly passed. Anything else is a blocker. */
export function assessBranch(b: Branch): BranchAssessment {
  const blockers: string[] = [];
  if (!b.ciGreen) blockers.push("CI is not green — the arbiter must pass before merge");
  for (const kind of requiredReviews(b.files)) {
    const st = b.reviews[kind];
    if (st === "failed") blockers.push(`${kind} review failed`);
    else if (st !== "passed") blockers.push(`${kind} review not done (pending is not a pass)`);
  }
  return { branchId: b.id, mergeable: blockers.length === 0, blockers };
}

export interface MergePlan {
  merged: string[]; // branch ids merged this pass, in order
  blocked: { branchId: string; reason: string }[]; // not mergeable (red CI / failed or pending review)
  escalations: { branchId: string; reason: string }[]; // mergeable but conflicts — the lead must resolve
}

/**
 * The merge queue. Oldest-first, serialized. A branch merges only if it's mergeable AND none of its files
 * collide with a branch already merged (this pass or previously, via alreadyMergedFiles). A collision is
 * NEVER force-merged — it escalates to the lead to rebase + re-verify against the moved base.
 */
export function processMergeQueue(branches: Branch[], alreadyMergedFiles: string[] = []): MergePlan {
  const plan: MergePlan = { merged: [], blocked: [], escalations: [] };
  const owned = new Set(alreadyMergedFiles);
  const queue = [...branches].sort((a, b) => a.createdAt - b.createdAt);

  for (const b of queue) {
    const a = assessBranch(b);
    if (!a.mergeable) {
      plan.blocked.push({ branchId: b.id, reason: a.blockers[0] });
      continue;
    }
    const collision = b.files.find((f) => owned.has(f));
    if (collision) {
      plan.escalations.push({ branchId: b.id, reason: `conflict on ${collision} — base moved; rebase + re-verify (escalated to the lead)` });
      continue;
    }
    plan.merged.push(b.id);
    for (const f of b.files) owned.add(f);
  }
  return plan;
}
