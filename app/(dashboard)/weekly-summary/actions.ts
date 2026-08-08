"use server";

import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone, getWeekDates } from "@/lib/timezone";
import {
  computeWeeklySummary,
  type WeeklySummary,
  type DayActivitySummary,
} from "@/lib/weekly-summary";

export type { WeeklySummary };

export async function getWeeklySummary(): Promise<WeeklySummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const todayDate = todayInAppTimezone();
  const weekDates = getWeekDates(todayDate);

  const { data } = await supabase
    .from("daily_activity")
    .select("activity_date, workout_completed, meals_logged_count, water_ml, fasting_window_honored")
    .eq("profile_id", user.id)
    .gte("activity_date", weekDates[0])
    .lte("activity_date", weekDates[6]);

  const rows: DayActivitySummary[] = (data ?? []).map((r) => ({
    date: r.activity_date as string,
    workoutCompleted: r.workout_completed,
    mealsLoggedCount: r.meals_logged_count,
    waterMl: r.water_ml,
    fastingWindowHonored: r.fasting_window_honored,
  }));

  return computeWeeklySummary(weekDates, rows, todayDate);
}
