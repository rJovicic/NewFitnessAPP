import { CalendarCheck } from "lucide-react";
import { MetricCard } from "@/components/fitness/metric-card";
import { getWeeklySummary } from "@/app/(dashboard)/weekly-summary/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern.
export async function WeeklySummaryTile() {
  const summary = await getWeeklySummary();
  if (!summary) return null;

  return (
    <MetricCard
      tone="calories"
      icon={CalendarCheck}
      label="This week"
      value={summary.daysOnPlan}
      unit={`/ ${summary.daysElapsed} days on plan`}
      footer={
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-data">{summary.workoutsCompleted} workouts</span>
          <span className="tabular-data">{summary.mealLoggingDays} days logged</span>
          <span className="tabular-data">{(summary.avgWaterMl / 1000).toFixed(1)}L avg water</span>
        </div>
      }
    />
  );
}
