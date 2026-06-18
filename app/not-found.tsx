import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-xl font-bold tracking-tight">
          <LogoMark size={38} />
          competitor.inc
        </Link>
        <h1 className="mt-8 font-display text-6xl font-bold">404</h1>
        <p className="mt-3 text-muted">competitor.inc looked everywhere — that page isn&apos;t here.</p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110"
        >
          <ArrowLeft size={17} /> Back to your workspace
        </Link>
      </div>
    </div>
  );
}
