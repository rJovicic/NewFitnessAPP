export interface DayActivitySummary {
  date: string; // YYYY-MM-DD
  workoutCompleted: boolean;
  mealsLoggedCount: number;
  waterMl: number;
  fastingWindowHonored: boolean | null;
}

export interface WeeklySummary {
  daysOnPlan: number;
  daysElapsed: number;
  workoutsCompleted: number;
  mealLoggingDays: number;
  avgWaterMl: number;
  fastingHonoredDays: number;
}

// Same "on plan" definition as lib/streak.ts (workout done + 3+ meals
// logged) so the two don't drift apart on what counts as a good day.
// Only counts days up to and including todayDate — future days in the
// week (Mon-Sun) haven't happened yet and shouldn't drag the average down.
export function computeWeeklySummary(
  weekDates: string[],
  rows: DayActivitySummary[],
  todayDate: string
): WeeklySummary {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const elapsedDates = weekDates.filter((d) => d <= todayDate);

  let daysOnPlan = 0;
  let workoutsCompleted = 0;
  let mealLoggingDays = 0;
  let waterSum = 0;
  let fastingHonoredDays = 0;

  for (const date of elapsedDates) {
    const day = byDate.get(date);
    if (!day) continue;
    if (day.workoutCompleted && day.mealsLoggedCount >= 3) daysOnPlan++;
    if (day.workoutCompleted) workoutsCompleted++;
    if (day.mealsLoggedCount >= 3) mealLoggingDays++;
    waterSum += day.waterMl;
    if (day.fastingWindowHonored) fastingHonoredDays++;
  }

  return {
    daysOnPlan,
    daysElapsed: elapsedDates.length,
    workoutsCompleted,
    mealLoggingDays,
    avgWaterMl: elapsedDates.length > 0 ? Math.round(waterSum / elapsedDates.length) : 0,
    fastingHonoredDays,
  };
}
