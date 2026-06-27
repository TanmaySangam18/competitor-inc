"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone, Check, AlertTriangle, Loader2 } from "lucide-react";
import { generateCampaignPosts, evaluatePost, ROOMIE, type CampaignPlatform, type CampaignPost } from "@/lib/engine/campaign";

// Block 4b — the visible autonomous-marketing UI. The founder approves a campaign POLICY once; the
// roomie bots generate branded posts (the user's company + link, "built on competitor.inc"), the
// evaluator gates each, and they reveal in a live feed. On-policy → queued to post; off-policy → escalated.
// Real posting fires through the gated Bluesky/Mastodon executors once those accounts are connected.

type Status = { pass: boolean; reason: string };

const PLATFORM_LABEL: Record<CampaignPlatform, string> = { bluesky: "Bluesky", mastodon: "Mastodon" };

export default function CampaignPanel({ company }: { company: { name: string; idea: string; slug: string; product?: { url: string } } }) {
  const [platforms, setPlatforms] = useState<CampaignPlatform[]>(["bluesky", "mastodon"]);
  const [maxPosts, setMaxPosts] = useState(2);
  const [posts, setPosts] = useState<(CampaignPost & { status: Status })[]>([]);
  const [reveal, setReveal] = useState(0);
  const [launched, setLaunched] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const link =
    company.product?.url ||
    (typeof window !== "undefined" ? `${window.location.origin}/t/${company.slug}` : `/t/${company.slug}`);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function launch() {
    if (platforms.length === 0) return;
    const policy = { platforms, maxPosts, link };
    const generated = generateCampaignPosts(company, policy).map((p) => ({ ...p, status: evaluatePost(p, policy) }));
    setPosts(generated);
    setReveal(0);
    setLaunched(true);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setReveal((n) => {
        if (n >= generated.length) { if (timer.current) clearInterval(timer.current); return n; }
        return n + 1;
      });
    }, 850);
  }

  function togglePlatform(p: CampaignPlatform) {
    setPlatforms((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));
  }

  const escalated = posts.filter((p) => !p.status.pass).length;

  return (
    <div className="mt-6 rounded-3xl border border-violet/25 bg-violet/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Megaphone size={16} className="text-violet" /> Autonomous marketing
        <span className="rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet">
          {ROOMIE}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-2">
        Approve the campaign <span className="text-muted">once</span> — the roomie bots post about {company.name} (with your
        link) within your policy. Anything off-policy comes back to you. Reddit/LinkedIn stay human-posted.
      </p>

      {!launched ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["bluesky", "mastodon"] as CampaignPlatform[]).map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  platforms.includes(p) ? "border-violet/40 bg-violet/15 text-violet" : "border-border text-muted-2 hover:text-text"
                }`}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
            <label className="ml-2 inline-flex items-center gap-2 text-xs text-muted-2">
              Posts each
              <input
                type="number"
                min={1}
                max={3}
                value={maxPosts}
                onChange={(e) => setMaxPosts(Math.max(1, Math.min(3, Number(e.target.value) || 1)))}
                className="w-14 rounded-lg border border-border bg-bg/50 px-2 py-1 text-sm text-text outline-none"
              />
            </label>
          </div>
          <button
            onClick={launch}
            disabled={platforms.length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
          >
            <Megaphone size={15} /> Approve &amp; launch campaign
          </button>
        </>
      ) : (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-2">
            <span>{reveal < posts.length ? <><Loader2 size={12} className="mr-1 inline animate-spin" /> roomie posting…</> : "campaign complete"}</span>
            <button onClick={() => { setLaunched(false); setPosts([]); }} className="transition hover:text-text">new campaign</button>
          </div>
          {posts.slice(0, reveal).map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-bg/40 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-2">
                <span className="font-medium text-muted">{ROOMIE} · {PLATFORM_LABEL[p.platform]}</span>
                {p.status.pass ? (
                  <span className="inline-flex items-center gap-1 text-mint"><Check size={12} /> on-policy · queued</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber"><AlertTriangle size={12} /> escalated: {p.status.reason}</span>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-text">{p.text}</p>
            </div>
          ))}
          {reveal >= posts.length && (
            <p className="pt-1 text-xs text-muted-2">
              {posts.length - escalated} on-policy post{posts.length - escalated === 1 ? "" : "s"} queued
              {escalated ? ` · ${escalated} escalated for your review` : ""}. Connect competitor.inc&apos;s Bluesky/Mastodon in
              env to post for real — until then this is a preview.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
