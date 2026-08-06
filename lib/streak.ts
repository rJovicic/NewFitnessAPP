// Streak is always computed from daily_activity, never a stored counter —
// a stored counter can drift from the underlying logs. Default definition
// (see CLAUDE.md/BUILD-LOOP-PROMPT Phase 7): consecutive days where
// workout_completed = true AND meals_logged_count >= 3.

export interface DailyActivitySummary {
  date: string; // YYYY-MM-DD
  workoutCompleted: boolean;
  mealsLoggedCount: number;
}

function dayQualifies(day: DailyActivitySummary | undefined): boolean {
  if (!day) return false;
  return day.workoutCompleted && day.mealsLoggedCount >= 3;
}

/**
 * Walks backward from `todayDate`, counting consecutive qualifying days.
 * A day that's missing from `rows` (no daily_activity row) counts as not
 * qualifying, breaking the streak. Today itself is skipped if it doesn't
 * yet qualify — the day isn't over, so it shouldn't zero out an active
 * streak from previous days — but any earlier day that fails breaks it.
 */
export function computeStreak(rows: DailyActivitySummary[], todayDate: string): number {
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const cursor = new Date(`${todayDate}T00:00:00Z`);
  if (!dayQualifies(byDate.get(todayDate))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (true) {
    const dStr = cursor.toISOString().slice(0, 10);
    if (!dayQualifies(byDate.get(dStr))) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
