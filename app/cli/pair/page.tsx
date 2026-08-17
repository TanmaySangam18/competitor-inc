import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getServerSupabase } from "@/lib/supabase/server";
import { signState } from "@/lib/core/oauth";
import { vaultReady } from "@/lib/engine/user-connections-db";

// /cli/pair — pairs a terminal with the signed-in browser session (ADR-0011). Server component: when
// signed in, mints a SHORT-LIVED (10 min) HMAC pairing code bound to this user. Copy-paste by design —
// no localhost listeners, nothing stored until the CLI actually saves a key.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "competitor.inc · pair your terminal" };

export default async function CliPairPage() {
  const sb = await getServerSupabase();
  const { data } = sb ? await sb.auth.getUser() : { data: { user: null } };
  const user = data?.user;
  const armed = vaultReady() && Boolean(process.env.CONNECTIONS_SECRET);

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">One-line activation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Pair your terminal</h1>
        {!armed ? (
          <p className="mt-6 border border-border p-4 text-sm">
            Pairing is not armed on this deployment (CONNECTIONS_SECRET missing). Keys can still be set as env vars — see <Link href="/connect" className="underline underline-offset-2">/connect</Link>.
          </p>
        ) : !user ? (
          <p className="mt-6 text-sm leading-relaxed">
            Sign in first, then come back here for your pairing code.{" "}
            <Link href="/login?next=/cli/pair" className="underline underline-offset-2">Sign in →</Link>
          </p>
        ) : (
          <>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Paste this code into the terminal running the activation script. It expires in 10 minutes,
              works only for your account, and stores nothing by itself.
            </p>
            <code className="mt-4 block break-all border border-text p-4 font-mono text-[12px] leading-relaxed">
              {signState({ provider: "cli", userId: user.id }, process.env.CONNECTIONS_SECRET!)}
            </code>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
              Didn&apos;t run the script yet? One line: curl -fsSL {process.env.NEXT_PUBLIC_SITE_URL ?? "https://competitor-inc-zeta.vercel.app"}/api/cli | node
            </p>
          </>
        )}
      </main>
    </div>
  );
}
