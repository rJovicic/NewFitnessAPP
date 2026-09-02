// Program timeline per CLAUDE.md's Key program parameters table: ~28-32
// weeks. 30 is the documented midpoint, used only to show an estimate —
// not a promise, since actual pace depends on adherence and the Phase 6
// adjustment engine can shift the deficit mid-program.
export const PROGRAM_TIMELINE_WEEKS = 30;

export interface ProgramProgress {
  weekNumber: number;
  totalWeeks: number;
  weightLostKg: number;
  weightRemainingKg: number;
  percentToGoal: number; // 0-100, clamped
  projectedEndDate: string; // YYYY-MM-DD
  daysRemaining: number;
  daysElapsed: number;
}

export function computeProgramProgress(
  programStartDate: string,
  todayDate: string,
  startingWeightKg: number,
  goalWeightKg: number,
  currentWeightKg: number
): ProgramProgress {
  const start = new Date(`${programStartDate}T00:00:00Z`);
  const today = new Date(`${todayDate}T00:00:00Z`);
  const daysElapsed = Math.max(
    Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
    0
  );
  const weekNumber = Math.min(Math.floor(daysElapsed / 7) + 1, PROGRAM_TIMELINE_WEEKS);

  const totalToLose = startingWeightKg - goalWeightKg;
  const lostSoFar = startingWeightKg - currentWeightKg;
  const percentToGoal =
    totalToLose > 0 ? Math.min(Math.max((lostSoFar / totalToLose) * 100, 0), 100) : 0;

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + PROGRAM_TIMELINE_WEEKS * 7);
  const daysRemaining = Math.max(
    Math.floor((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
    0
  );

  return {
    weekNumber,
    totalWeeks: PROGRAM_TIMELINE_WEEKS,
    weightLostKg: Math.round(lostSoFar * 10) / 10,
    weightRemainingKg: Math.round(Math.max(currentWeightKg - goalWeightKg, 0) * 10) / 10,
    percentToGoal: Math.round(percentToGoal),
    projectedEndDate: end.toISOString().slice(0, 10),
    daysRemaining,
    daysElapsed,
  };
}
