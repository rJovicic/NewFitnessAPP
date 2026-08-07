import { createClient } from "@/lib/supabase/server";
import { calculateAge, calculateTargets } from "@/lib/macros";
import { todayInAppTimezone, zonedDayRangeUtc } from "@/lib/timezone";
import { computeStreak, type DailyActivitySummary } from "@/lib/streak";
import { getSyncedDailyMetrics } from "@/lib/health-metrics";

// Shared daily targets — not per-profile settings yet, just the PDF's
// general guidance. Used here and by the Phase 7 daily checklist so the
// two don't drift apart.
export const WATER_TARGET_ML = 3000;
export const STEPS_TARGET = 10000;
export const SLEEP_TARGET_HOURS = 7;

export interface DashboardData {
  fullName: string;
  dateStr: string;
  isToday: boolean;
  targets: {
    targetKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  logged: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  water: { ml: number; targetMl: number };
  steps: { count: number; targetCount: number };
  fastingWindow: { start: string; end: string };
  streak: number;
}

export async function getDashboardData(
  dateStr: string = todayInAppTimezone()
): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, date_of_birth, height_cm, starting_weight_kg, activity_factor, protein_g_per_kg, deficit_kcal, eating_window_start, eating_window_end"
    )
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const { data: latestWeight } = await supabase
    .from("weight_logs")
    .select("weight_kg")
    .eq("profile_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const weightKg = latestWeight?.weight_kg ?? profile.starting_weight_kg;
  const age = calculateAge(profile.date_of_birth);
  const targets = calculateTargets(profile, weightKg, age);

  const { start, end } = zonedDayRangeUtc(dateStr);

  const { data: dayItems } = await supabase
    .from("meal_items")
    .select("kcal, protein_g, carbs_g, fat_g, meal_logs!inner(profile_id, logged_at)")
    .eq("meal_logs.profile_id", user.id)
    .gte("meal_logs.logged_at", start.toISOString())
    .lt("meal_logs.logged_at", end.toISOString());

  const logged = (dayItems ?? []).reduce(
    (acc, item) => ({
      kcal: acc.kcal + Number(item.kcal),
      proteinG: acc.proteinG + Number(item.protein_g),
      carbsG: acc.carbsG + Number(item.carbs_g),
      fatG: acc.fatG + Number(item.fat_g),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const { data: activity } = await supabase
    .from("daily_activity")
    .select("water_ml, steps")
    .eq("profile_id", user.id)
    .eq("activity_date", dateStr)
    .maybeSingle();

  const synced = await getSyncedDailyMetrics(user.id, dateStr);

  // Streak is always relative to the real current day, not whatever date
  // the day-strip happens to be viewing.
  const realToday = todayInAppTimezone();
  const streakSince = new Date();
  streakSince.setDate(streakSince.getDate() - 60);
  const { data: streakHistory } = await supabase
    .from("daily_activity")
    .select("activity_date, workout_completed, meals_logged_count")
    .eq("profile_id", user.id)
    .gte("activity_date", streakSince.toISOString().slice(0, 10))
    .order("activity_date", { ascending: true });

  const streakSummaries: DailyActivitySummary[] = (streakHistory ?? []).map((r) => ({
    date: r.activity_date as string,
    workoutCompleted: r.workout_completed,
    mealsLoggedCount: r.meals_logged_count,
  }));

  return {
    fullName: profile.full_name ?? "there",
    dateStr,
    isToday: dateStr === realToday,
    targets: {
      targetKcal: Math.round(targets.targetKcal),
      proteinG: Math.round(targets.proteinG),
      carbsG: Math.round(targets.carbsG),
      fatG: Math.round(targets.fatG),
    },
    logged: {
      kcal: Math.round(logged.kcal),
      proteinG: Math.round(logged.proteinG),
      carbsG: Math.round(logged.carbsG),
      fatG: Math.round(logged.fatG),
    },
    water: { ml: activity?.water_ml ?? 0, targetMl: WATER_TARGET_ML },
    steps: { count: synced.steps ?? activity?.steps ?? 0, targetCount: STEPS_TARGET },
    fastingWindow: {
      start: profile.eating_window_start ?? "10:00",
      end: profile.eating_window_end ?? "19:30",
    },
    streak: computeStreak(streakSummaries, realToday),
  };
}
