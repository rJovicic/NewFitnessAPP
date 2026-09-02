// Bare stat block, no card — composed into Home's "This week" section.
export function StreakTile({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Streak</p>
      <p className="tabular-data text-lg font-semibold">
        {streak} <span className="text-sm font-normal text-muted-foreground">days</span>
      </p>
    </div>
  );
}
