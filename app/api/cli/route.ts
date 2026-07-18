import { NextRequest } from "next/server";
import { cliScript } from "@/lib/core/cli-script";

// GET /api/cli — serves the one-line activation script (ADR-0011):
//   curl -fsSL <site>/api/cli | node
// Plain text so anyone can read it BEFORE piping — transparency is the security posture.

export function GET(req: NextRequest) {
  return new Response(cliScript(req.nextUrl.origin), {
    headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" },
  });
}
