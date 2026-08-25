// ─────────────────────────────────────────────────────────────────────────────
// THE WORKSPACE REMEMBERS. Firestore-backed transcript persistence.
//
// FOUND BY USING IT: messages posted to /api/workspace never appeared in the UI, and a page refresh
// lost the conversation, because the transcript lived only in the browser. A company whose memory
// vanishes on reload is not a company, and "persistent cross-session context" is the specific thing the
// enterprise-fleet brief asks for. So this is the Google Cloud service earning its place by fixing a
// real defect rather than being bolted on to satisfy a checkbox.
//
// FAIL SOFT, NEVER FAIL SILENT. With no credentials the workspace keeps working exactly as it does
// today, in memory, and says so. What it must never do is claim a message was saved when it was not.
// ─────────────────────────────────────────────────────────────────────────────

import { Firestore } from "@google-cloud/firestore";

export interface StoredMessage {
  channel: string;
  author: string;      // "you" or an agent id
  authorTitle?: string;
  text: string;
  at: string;          // ISO
  /** Set when this message recorded a tool actually running, so the demo is reconstructible. */
  ran?: string;
}

export type SaveResult =
  | { saved: true; where: "firestore" }
  | { saved: false; why: string };

const COLLECTION = process.env.FIRESTORE_COLLECTION?.trim() || "workspace_messages";

export function firestoreConfigured(env: Record<string, string | undefined> = process.env): boolean {
  // Either an explicit project id, or the ambient credentials Cloud Run and GKE inject automatically.
  return !!(env.GOOGLE_CLOUD_PROJECT?.trim() || env.GCLOUD_PROJECT?.trim() || env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
}

let db: Firestore | null = null;
function client(): Firestore | null {
  if (!firestoreConfigured()) return null;
  if (!db) {
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT?.trim() || process.env.GCLOUD_PROJECT?.trim(),
      ignoreUndefinedProperties: true,
    });
  }
  return db;
}

/** Reset between tests. */
export function resetTranscriptStore(): void {
  db = null;
}

export async function saveMessage(m: StoredMessage): Promise<SaveResult> {
  const c = client();
  if (!c) {
    return {
      saved: false,
      why: "Firestore is not configured (set GOOGLE_CLOUD_PROJECT), so this message exists only in this browser.",
    };
  }
  try {
    await c.collection(COLLECTION).add({ ...m });
    return { saved: true, where: "firestore" };
  } catch (e) {
    return { saved: false, why: `Firestore refused the write: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

/** The channel's history, oldest first. Returns a reason rather than an empty array when it cannot read. */
export async function loadChannel(
  channel: string,
  limit = 100
): Promise<{ messages: StoredMessage[] } | { error: string }> {
  const c = client();
  if (!c) return { error: "Firestore is not configured, so there is no stored history to read." };
  try {
    // Ordered by the message's own timestamp rather than by write order, because a retry can arrive late
    // and a transcript out of sequence reads as a different conversation.
    const snap = await c
      .collection(COLLECTION)
      .where("channel", "==", channel)
      .orderBy("at", "desc")
      .limit(limit)
      .get();
    const messages = snap.docs.map((d) => d.data() as StoredMessage).reverse();
    return { messages };
  } catch (e) {
    return { error: `Firestore refused the read: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
