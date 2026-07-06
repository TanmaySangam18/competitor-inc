import { redirect } from "next/navigation";

// Retired: /watch was a second "run the org" surface driven by the separate operating-cycle engine. Per the
// one-engine decision, the business runs on ONE engine (runShift) surfaced on the dashboard — the live crew
// (CrewBox), the Glass Box (activity log), and the Approval Inbox (the one desk). Any old /watch link lands
// on the dashboard. (The operating-loop engine remains in-tree, flag-gated off, for future long-horizon work.)
export default function WatchPage() {
  redirect("/dashboard");
}
