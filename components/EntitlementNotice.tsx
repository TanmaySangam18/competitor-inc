"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { billingLive, getEntitlement } from "@/lib/engine/billing";

// The visible half of failed-payment / cancellation handling: a calm, honest banner when the user's
// subscription is in a non-clean state (past_due → "update your card", cancelled → "access until <date>",
// paused/expired → "renew"). No-op unless billing is live + a notice applies. Reads the user's own row.
export default function EntitlementNotice({ email }: { email?: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!billingLive() || !email) return;
    let on = true;
    getEntitlement(email).then((e) => {
      if (on) setNotice(e.notice);
    });
    return () => {
      on = false;
    };
  }, [email]);

  if (!notice) return null;
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1 leading-snug">{notice}</span>
      <Link
        href="/dashboard/settings"
        className="shrink-0 rounded-lg border border-amber/40 px-3 py-1 text-xs font-medium transition hover:bg-amber/10"
      >
        Manage
      </Link>
    </div>
  );
}
