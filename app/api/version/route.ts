export const runtime = "nodejs";

// Deploy freshness (no secrets, no PII — a build timestamp and, when present, the git SHA). The
// House board renders staleness from this; anyone can read it, nothing sensitive to protect.
export async function GET() {
  return Response.json({
    ok: true,
    builtAt: Number(process.env.BUILD_STAMP) || null,
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
