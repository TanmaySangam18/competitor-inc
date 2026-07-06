import { redirect } from "next/navigation";

// Retired: the full-page "office" is gone. The crew now lives as a compact box (components/CrewBox) on the
// dashboard + /watch — one crew visualization, not a whole page. Any old /delegation link lands on the
// dashboard where the box is. (Superseded DelegationScene2D / DelegationScenePixel remain in-tree, unused.)
export default function DelegationPage() {
  redirect("/dashboard");
}
