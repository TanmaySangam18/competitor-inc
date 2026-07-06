import { redirect } from "next/navigation";

// Retired: this was a second goal-runner ("give the company a goal → supervisor → one agent per task"),
// identical in mechanic to /watch. Consolidated into /watch (the single "watch the org run" surface).
// Any old /orchestrator link lands there.
export default function OrchestratorPage() {
  redirect("/watch");
}
