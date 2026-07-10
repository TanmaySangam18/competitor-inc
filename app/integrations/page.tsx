import type { Metadata } from "next";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";
import { GateProbe } from "./GateProbe";

export const metadata: Metadata = {
  title: "Integrations — competitor.inc",
  description:
    "The rails the company actually runs on — each one doing real work, with its live status shown honestly. Depth over a logo wall.",
};

// Status must be honest at REQUEST time, not baked at build time.
export const dynamic = "force-dynamic";

// THE CONNECTOR SURFACE (Block 6e) — Resleeve shows 500 logos; we show the rails we ACTUALLY run on,
// what each one does in THIS company, and its live status read from the server env right now (presence
// booleans only — never values). An unconfigured rail says so plainly: honesty over logo-wall breadth.
const RAILS: { name: string; role: string; env: string[] }[] = [
  { name: "GitHub", role: "Where every customer build lives — real repos, real commits, the Design-Lead review history.", env: ["GITHUB_TOKEN"] },
  { name: "Anthropic Claude", role: "The build brain — implements, self-repairs, and design-reviews every customer app.", env: ["FULLSTACK_ANTHROPIC_KEY"] },
  { name: "Vercel", role: "Every build deploys here and is verified live before you ever see a link.", env: ["FULLSTACK_VERCEL_TOKEN"] },
  { name: "Supabase", role: "The company's memory — companies, approvals, mandates, the Glass Box, all under row-level security.", env: ["NEXT_PUBLIC_SUPABASE_URL"] },
  { name: "Slack", role: "The team room — departments post as their positions in your workspace.", env: ["SLACK_BOT_TOKEN"] },
  { name: "Telegram", role: "Approvals from your pocket — yes/no from your phone, applied laptop-off under your mandate.", env: ["TELEGRAM_BOT_TOKEN"] },
  { name: "Twilio", role: "The founder line — SMS briefings of what ran overnight.", env: ["TWILIO_ACCOUNT_SID"] },
  { name: "Resend", role: "Email that reaches you — feedback with Theo's drafted reply, weekly digests, alerts.", env: ["RESEND_API_KEY"] },
  { name: "Polar", role: "The merchant of record — when money moves, it moves through a verified webhook, never a claim.", env: ["POLAR_WEBHOOK_SECRET"] },
  { name: "Upstash Redis", role: "The shared rate-limit ledger — abuse guards that hold across every server instance.", env: ["UPSTASH_REDIS_REST_URL"] },
  { name: "Bluesky", role: "The Receipts Campaign — persona-authored posts of verified work, on the platform's own account.", env: ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD"] },
  { name: "Mastodon", role: "Same receipts, second channel — governed by the same policy gate and kill switch.", env: ["MASTODON_BASE_URL", "MASTODON_ACCESS_TOKEN"] },
];

export default function IntegrationsPage() {
  const rails = RAILS.map((r) => ({ ...r, live: r.env.every((k) => !!process.env[k]?.trim()) }));
  const liveCount = rails.filter((r) => r.live).length;
  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-5 py-14">
        <Eyebrow>THE RAILS · READ LIVE FROM THE SERVER</Eyebrow>
        <h1 className="mt-4 text-[34px] font-medium leading-[1.12]" style={serifStyle}>
          {liveCount} of {rails.length} rails connected, <em>right now</em>.
        </h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          No logo wall. These are the systems this company actually runs on — what each one does here,
          and its live status read from the server as this page loaded. An unconfigured rail says so.
        </p>

        <div className="mt-8">
          {rails.map((r, i) => (
            <div key={r.name} className={`flex items-start justify-between gap-4 border-t border-rule px-1 py-4 ${i === rails.length - 1 ? "border-b" : ""}`}>
              <div className="min-w-0">
                <h2 className="text-base font-medium" style={serifStyle}>{r.name}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{r.role}</p>
              </div>
              {r.live ? (
                <span className="mt-1 shrink-0 rounded-md border-[1.5px] border-pine px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-pine">CONNECTED</span>
              ) : (
                <span className="mt-1 shrink-0 rounded-md border border-rule px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-ink-faint">NOT CONFIGURED</span>
              )}
            </div>
          ))}
        </div>

        {/* The launch-gate diagnostic: the SERVER reads this env at runtime; the CLIENT chip shows what
            was INLINED into the bundle at build time. Both ON ⇒ the campus gate is fully live; a
            mismatch is the Sensitive-toggle trap made visible. */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
          <span className="text-sm font-medium" style={serifStyle}>Campus launch gate</span>
          <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] ${process.env.NEXT_PUBLIC_CAMPUS_GATE === "1" ? "border-pine font-semibold text-pine" : "border-rule text-ink-faint"}`}>
            SERVER: {process.env.NEXT_PUBLIC_CAMPUS_GATE === "1" ? "ON" : process.env.NEXT_PUBLIC_CAMPUS_GATE ? `"${process.env.NEXT_PUBLIC_CAMPUS_GATE}"` : "NOT SET"}
          </span>
          <GateProbe />
        </div>

        <p className="mt-6 text-xs italic text-ink-faint" style={serifStyle}>
          Statuses are presence checks on the server&apos;s own configuration — never keys, never values, and
          never claimed when absent.
        </p>
      </div>
    </LedgerShell>
  );
}
