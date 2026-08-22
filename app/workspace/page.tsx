import type { Metadata } from "next";
import { channels } from "@/lib/workspace/channels";
import { allAgents } from "@/lib/workspace/agents";
import { realModelConfigured } from "@/lib/engine/server";
import WorkspaceClient from "./WorkspaceClient";

// THE WORKSPACE (2026-08-22). The founder's instruction was to talk to agents the way they talk to
// human employees, design agents included. This is that surface, and it is the in-house replacement
// for Slack: goal step 4 ("give a prompt to the agents") no longer needs another company's webhook.
//
// Everything on this page is derived: the channels come from the org chart, the roster comes from the
// 56 roles, and the model status is the same single answer the rest of the app reads. Nothing here is
// a hand-maintained copy of something else.

export const metadata: Metadata = {
  title: "Workspace · competitor.inc",
  description: "Talk to the company. Channels, colleagues, and the work they actually do.",
};

export default function WorkspacePage() {
  return (
    <WorkspaceClient
      channels={channels().map((c) => ({ id: c.id, name: c.name, purpose: c.purpose, members: c.memberCount, lead: c.lead?.title ?? null }))}
      agents={allAgents().map((a) => ({ id: a.id, title: a.title, handle: a.handle, department: a.departmentName, channel: a.channel }))}
      modelConfigured={realModelConfigured()}
    />
  );
}
