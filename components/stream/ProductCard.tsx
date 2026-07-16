"use client";

// The money moment — the built product's live / locked / building state, logic preserved EXACTLY from
// the old Operating rail (dashboard page ~740-757): live+entitled links out (plus the founding-member
// offer while Operator checkout isn't live) · live+not-entitled is the paywall (the reveal is the paid
// unlock) · a product without a verified URL is honestly "shipping", never "live". Rendered as a
// special pinned artifact turn in the Stream.

import Link from "next/link";
import type { Company } from "@/lib/engine/types";
import { checkoutLiveFor, checkoutUrlFor } from "@/lib/engine/billing";
import FoundingMember from "@/components/dashboard/FoundingMember";

export function ProductCard({ product, entitled, userEmail }: { product?: Company["product"]; entitled: boolean; userEmail?: string }) {
  if (!product) return null;
  if (product.status === "live" && /^https?:\/\//.test(product.url)) {
    return entitled ? (
      <>
        <a href={product.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-2 border border-text bg-bg px-4 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">Your product is live</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted">{product.url}</div>
          </div>
          <span className="shrink-0 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition group-hover:border-text group-hover:bg-text group-hover:text-bg">
            view ↗
          </span>
        </a>
        {!checkoutLiveFor("operator") && <FoundingMember tier="operator" email={userEmail} />}
      </>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-2 border border-text bg-bg px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">Built &amp; live — locked</div>
          <div className="mt-0.5 font-mono text-[11px] text-muted">The crew shipped a real site. Opening the link is the paid unlock.</div>
        </div>
        <a
          href={userEmail ? checkoutUrlFor(userEmail) : "/login"}
          className="shrink-0 border border-text bg-text px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg transition hover:bg-bg hover:text-text"
        >
          Unlock — Operator $199/mo →
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-bg px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Shipping your site…</span>
      <Link
        href="/dashboard/settings#connect-accounts"
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text underline decoration-dotted underline-offset-2 hover:no-underline"
      >
        Connect keys →
      </Link>
    </div>
  );
}
