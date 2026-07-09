import { fetchDeployedUrl } from "@/lib/engine/fullstack-build";
import { verifyProof } from "@/lib/engine/execution";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Phase 1c — poll target for an async full-stack build. Given a repo the engine created, reads the live
// Vercel URL the workflow wrote (fetchDeployedUrl) and HEAD-verifies it resolves before declaring it live
// (verify-before-done — never surface a URL that 404s). The client polls this after a build until `live`,
// then upgrades the product to the real deployed link. Rate-limited; repo format-validated; fail-soft.
export async function GET(req: Request) {
  if (rateLimited(`buildstatus:${clientIp(req)}`)) {
    return Response.json({ live: false, error: "rate limited" }, { status: 429 });
  }
  const repo = (new URL(req.url).searchParams.get("repo") ?? "").trim();
  // owner/name only — no path traversal, no arbitrary URLs into the GitHub API.
  if (!/^[A-Za-z0-9_.-]{1,80}\/[A-Za-z0-9_.-]{1,100}$/.test(repo)) {
    return Response.json({ live: false, error: "bad repo" }, { status: 400 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) return Response.json({ live: false, status: "no-token" });

  const url = await fetchDeployedUrl({ repo, token });
  if (!url) return Response.json({ live: false, status: "building" }); // deploy-url.txt not committed yet

  const resolves = await verifyProof({ kind: "url", value: url }).catch(() => false);
  return resolves
    ? Response.json({ live: true, url }) // verified live — safe to show
    : Response.json({ live: false, status: "deploying", url }); // deployed but still propagating
}
