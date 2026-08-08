import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProgramProgress } from "@/app/(dashboard)/program-progress/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern.
export async function ProgramProgressTile() {
  const progress = await getProgramProgress();
  if (!progress) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-protein">
          <Target className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">Program progress</span>
        </div>
        <p className="tabular-data text-2xl font-semibold">
          Week {progress.weekNumber}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / ~{progress.totalWeeks}
          </span>
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-protein"
            style={{ width: `${progress.percentToGoal}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {progress.weightLostKg > 0 ? `${progress.weightLostKg}kg lost` : "Just started"}
          {" · "}
          {progress.weightRemainingKg > 0
            ? `${progress.weightRemainingKg}kg to goal`
            : "At goal weight"}
        </p>
      </CardContent>
    </Card>
  );
}
