// Bare stat block, no card — composed into Home's "This week" grid. A thin
// colored left accent (not a full tinted box) is what carries the
// per-metric identity here, matching the color-coded stat language used
// across the app (macro-bar dots, GF badge) rather than a card wrapper.
export function StreakTile({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 pl-3" style={{ borderColor: "var(--fat)" }}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Streak</p>
      <p className="tabular-data text-lg font-semibold">
        {streak} <span className="text-sm font-normal text-muted-foreground">days</span>
      </p>
    </div>
  );
}
