import { getWeeklySummary } from "@/app/(dashboard)/weekly-summary/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern. Renders
// two bare stat blocks (Training, Meals) — no target denominator is
// fabricated (the program doesn't define a weekly workout count), so
// this shows days-hit / days-elapsed-this-week instead.
export async function WeeklySummaryTile() {
  const summary = await getWeeklySummary();
  if (!summary) return null;

  return (
    <>
      <div className="flex flex-col gap-0.5 border-l-2 pl-3" style={{ borderColor: "var(--protein)" }}>
        <p className="text-label">
          Training
        </p>
        <p className="tabular-data text-lg font-semibold">
          {summary.workoutsCompleted} / {summary.daysElapsed}
        </p>
      </div>
      <div className="flex flex-col gap-0.5 border-l-2 pl-3" style={{ borderColor: "var(--carbs)" }}>
        <p className="text-label">Meals</p>
        <p className="tabular-data text-lg font-semibold">
          {summary.mealLoggingDays} / {summary.daysElapsed}
        </p>
      </div>
    </>
  );
}
