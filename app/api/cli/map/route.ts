import { NextRequest, NextResponse } from "next/server";
import { connectionMapStatus } from "@/lib/core/connections";
import { oauthProviderFor } from "@/lib/core/oauth";

// GET /api/cli/map — the connection map the CLI walks. Public + secret-free: names, env var NAMES,
// and the OAuth start path when (and only when) that provider is armed. Never values, never status
// of other users.

export function GET(_req: NextRequest) {
  const connections = connectionMapStatus().map((c) => {
    const p = oauthProviderFor(c.id);
    return { id: c.id, name: c.name, tier: c.tier, env: c.env, oauth: p ? `/api/oauth/${p.id}/start` : null };
  });
  return NextResponse.json({ connections });
}
