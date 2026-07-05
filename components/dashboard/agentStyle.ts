import { Gauge, Code2, Megaphone, LifeBuoy, TrendingUp, Landmark, Scale, Settings } from "lucide-react";
import type { AgentRole } from "@/lib/engine/types";

// One visual identity per agent, shared by every dashboard surface that renders a crew member.
export const agentStyle: Record<AgentRole, { icon: typeof Gauge; color: string; ring: string }> = {
  ceo: { icon: Gauge, color: "text-violet", ring: "bg-violet/12" },
  engineering: { icon: Code2, color: "text-mint", ring: "bg-mint/12" },
  marketing: { icon: Megaphone, color: "text-amber", ring: "bg-amber/12" },
  manufacturing: { icon: Gauge, color: "text-amber", ring: "bg-amber/12" },
  support: { icon: LifeBuoy, color: "text-coral", ring: "bg-coral/12" },
  growth: { icon: TrendingUp, color: "text-mint", ring: "bg-mint/12" },
  finance: { icon: Landmark, color: "text-mint", ring: "bg-mint/12" },
  legal: { icon: Scale, color: "text-violet", ring: "bg-violet/12" },
  ops: { icon: Settings, color: "text-amber", ring: "bg-amber/12" },
};
