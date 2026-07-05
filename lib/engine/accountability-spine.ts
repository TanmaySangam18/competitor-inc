// The Accountability Spine — the human "2%". Some acts CANNOT be delegated to agents (sign a contract, file
// a tax, clear KYC, pass a vendor security review, move money). Agents PREPARE 100% of each act into a packet
// (materials gathered, exactly what the human must do); the single founder-operator reviews → executes it
// manually. This is the governed core of the autonomous company, not a gap. Pure + deterministic.

import type { AgentRole } from "./types";

// "Your desk" = anything needing the human's YES: the irreducible legal/financial acts only a human can
// do, PLUS consequential drafts an agent prepared but must not send without approval (Phase D outbound).
export type SpineActKind =
  | "sign_contract"
  | "file_tax"
  | "kyc"
  | "vendor_review"
  | "move_money"
  | "legal_other"
  | "approve_outreach" // a drafted email/DM — approve to send
  | "approve_publish" // a drafted public post — approve to publish
  | "approve_support"; // a drafted support reply — approve to send

export type PacketStatus = "prepared" | "in_review" | "completed";

export interface PreparedPacket {
  id: string;
  kind: SpineActKind;
  title: string;
  summary: string;
  preparedBy: AgentRole; // the agent that assembled it
  materials: string[]; // links/notes the agent gathered so the human doesn't start from scratch
  actionRequired: string; // exactly what the human must do (the irreducible manual step)
  status: PacketStatus;
  createdAt: number;
}

export function preparePacket(opts: {
  id: string;
  kind: SpineActKind;
  title: string;
  summary: string;
  preparedBy: AgentRole;
  materials?: string[];
  actionRequired: string;
  now?: number;
}): PreparedPacket {
  return {
    id: opts.id,
    kind: opts.kind,
    title: opts.title,
    summary: opts.summary,
    preparedBy: opts.preparedBy,
    materials: opts.materials ?? [],
    actionRequired: opts.actionRequired,
    status: "prepared",
    createdAt: opts.now ?? Date.now(),
  };
}

export function startReview(p: PreparedPacket): PreparedPacket {
  if (p.status !== "prepared") throw new Error(`can only review a prepared packet (was ${p.status})`);
  return { ...p, status: "in_review" };
}

// The human has done the irreducible act (signed/filed/etc.). Only they can complete a packet.
export function completePacket(p: PreparedPacket): PreparedPacket {
  if (p.status !== "in_review") throw new Error(`can only complete a packet in review (was ${p.status})`);
  return { ...p, status: "completed" };
}

export function pendingPackets(packets: PreparedPacket[]): PreparedPacket[] {
  return packets.filter((p) => p.status !== "completed");
}
