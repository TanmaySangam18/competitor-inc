import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DemandCapture from "./DemandCapture";
import TrackBeacon from "@/components/TrackBeacon";
import { CompanyLogo } from "@/components/CompanyLogo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // a live test reflects the latest DB state

interface DemandTest {
  slug: string;
  headline: string;
  subhead: string;
}

// Reads the public test row. Anon key is enough (demand_tests has a public select policy); the
// service role works too. Returns null when Supabase isn't configured or the test doesn't exist.
async function getTest(slug: string): Promise<DemandTest | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await sb.from("demand_tests").select("slug, headline, subhead").eq("slug", slug).maybeSingle();
    return (data as DemandTest) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTest(slug);
  if (!test) return { title: "Coming soon" };
  return { title: test.headline, description: test.subhead || test.headline };
}

export default async function DemandTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const test = await getTest(slug);
  if (!test) notFound(); // not configured or no such test → real 404 (honest)

  return (
    <div className="min-h-screen mesh">
      <TrackBeacon slug={test.slug} />
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-20">
        <CompanyLogo name={test.headline} size={52} className="mb-6 rounded-xl shadow-sm" />
        <h1 className="display text-4xl leading-tight md:text-5xl">{test.headline}</h1>
        {test.subhead && <p className="mt-5 text-lg leading-relaxed text-muted">{test.subhead}</p>}
        <div className="mt-9">
          <DemandCapture slug={test.slug} />
        </div>
        <p className="mt-10 text-xs text-muted-2">
          Be the first to know when it launches. No spam — just one email when it&apos;s ready.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-2 transition hover:text-muted"
        >
          Powered by{" "}
          <span className="font-mono font-semibold text-muted">
            competitor<span className="text-coral">.inc</span>
          </span>
        </a>
      </div>
    </div>
  );
}
