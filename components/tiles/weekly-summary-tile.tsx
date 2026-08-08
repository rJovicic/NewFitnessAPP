import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getWeeklySummary } from "@/app/(dashboard)/weekly-summary/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern.
export async function WeeklySummaryTile() {
  const summary = await getWeeklySummary();
  if (!summary) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-calories">
          <CalendarCheck className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">This week</span>
        </div>
        <p className="tabular-data text-2xl font-semibold">
          {summary.daysOnPlan}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {summary.daysElapsed} days on plan
          </span>
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-data">{summary.workoutsCompleted} workouts</span>
          <span className="tabular-data">{summary.mealLoggingDays} days logged</span>
          <span className="tabular-data">{(summary.avgWaterMl / 1000).toFixed(1)}L avg water</span>
        </div>
      </CardContent>
    </Card>
  );
}
