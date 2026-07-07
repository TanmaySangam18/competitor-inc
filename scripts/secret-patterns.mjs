// Shared secret-detection patterns — imported by scripts/secret-scan.mjs (the deploy gate) AND by
// lib/engine/mission-invariants.test.ts, so the scanner's efficacy is itself verified (a scanner nobody
// tests is a scanner nobody trusts). [name, regex] pairs; each regex matches a key-shaped LITERAL, so
// prose / env-var names don't false-positive.
export const SECRET_PATTERNS = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{16,}/],
  ["OpenAI key", /sk-[A-Za-z0-9]{24,}/],
  ["Groq key", /gsk_[A-Za-z0-9]{20,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{30,}/],
  ["GitHub token", /gh[pousr]_[0-9A-Za-z]{30,}/],
  ["Slack token", /xox[baprs]-[0-9A-Za-z-]{12,}/],
  ["Polar token", /polar_[A-Za-z0-9_]{16,}/],
  ["JWT (e.g. Supabase service key)", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ["PEM private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
