import { LogoMark } from "@/components/Logo";

// Branded route-level loading fallback (Suspense boundary for app routes).
export function RouteLoading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted-2">
        <span className="animate-pulse"><LogoMark size={44} /></span>
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
