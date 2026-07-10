// The stat card — one number, one label. Was identical inline markup in Operating and OperateTab.
export function Stat({ label, val }: { label: string; val: string | number }) {
  return (
    <div className="rounded-2xl glass-panel px-4 py-3">
      <div className="font-display text-2xl font-bold tracking-tight">{val}</div>
      <div className="mt-0.5 text-xs text-muted-2">{label}</div>
    </div>
  );
}
