"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone } from "@/lib/timezone";
import { WATER_TARGET_ML, STEPS_TARGET, SLEEP_TARGET_HOURS } from "@/lib/dashboard-data";

export async function addWater(ml: number): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const dateStr = todayInAppTimezone();
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("water_ml")
    .eq("profile_id", user.id)
    .eq("activity_date", dateStr)
    .maybeSingle();

  await supabase.from("daily_activity").upsert(
    {
      profile_id: user.id,
      activity_date: dateStr,
      water_ml: (existing?.water_ml ?? 0) + ml,
    },
    { onConflict: "profile_id,activity_date" }
  );

  revalidatePath("/");
  return { ok: true };
}

export async function logSleepHours(hours: number): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const dateStr = todayInAppTimezone();
  await supabase.from("daily_activity").upsert(
    { profile_id: user.id, activity_date: dateStr, sleep_hours: hours },
    { onConflict: "profile_id,activity_date" }
  );

  revalidatePath("/");
  return { ok: true };
}

export async function toggleSupplement(
  supplementId: string,
  taken: boolean
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const dateStr = todayInAppTimezone();
  await supabase.from("supplement_logs").upsert(
    {
      profile_id: user.id,
      supplement_id: supplementId,
      logged_date: dateStr,
      taken,
    },
    { onConflict: "profile_id,supplement_id,logged_date" }
  );

  revalidatePath("/");
  return { ok: true };
}

export interface SupplementChecklistItem {
  id: string;
  name: string;
  dose: string | null;
  timingNote: string | null;
  taken: boolean;
}

export interface DailyChecklistData {
  workoutCompleted: boolean;
  mealsLoggedCount: number;
  waterMl: number;
  waterTargetMl: number;
  steps: number | null;
  stepsTarget: number;
  sleepHours: number | null;
  sleepTargetHours: number;
  supplements: SupplementChecklistItem[];
}

export async function getDailyChecklist(): Promise<DailyChecklistData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dateStr = todayInAppTimezone();

  const { data: today } = await supabase
    .from("daily_activity")
    .select("workout_completed, meals_logged_count, water_ml, steps, sleep_hours")
    .eq("profile_id", user.id)
    .eq("activity_date", dateStr)
    .maybeSingle();

  const { data: supplements } = await supabase
    .from("supplements")
    .select("id, name, dose, timing_note")
    .eq("recommended", true)
    .order("name", { ascending: true });

  const { data: todaysSupplementLogs } = await supabase
    .from("supplement_logs")
    .select("supplement_id, taken")
    .eq("profile_id", user.id)
    .eq("logged_date", dateStr);

  const takenIds = new Set(
    (todaysSupplementLogs ?? []).filter((l) => l.taken).map((l) => l.supplement_id)
  );

  return {
    workoutCompleted: today?.workout_completed ?? false,
    mealsLoggedCount: today?.meals_logged_count ?? 0,
    waterMl: today?.water_ml ?? 0,
    waterTargetMl: WATER_TARGET_ML,
    steps: today?.steps ?? null,
    stepsTarget: STEPS_TARGET,
    sleepHours: today?.sleep_hours ?? null,
    sleepTargetHours: SLEEP_TARGET_HOURS,
    supplements: (supplements ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      dose: s.dose,
      timingNote: s.timing_note,
      taken: takenIds.has(s.id),
    })),
  };
}
