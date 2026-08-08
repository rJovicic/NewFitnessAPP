"use server";

import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone } from "@/lib/timezone";
import { computeProgramProgress, type ProgramProgress } from "@/lib/program-progress";

export type { ProgramProgress };

export async function getProgramProgress(): Promise<ProgramProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("program_start_date, starting_weight_kg, goal_weight_kg")
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

  const currentWeightKg = latestWeight?.weight_kg ?? profile.starting_weight_kg;

  return computeProgramProgress(
    profile.program_start_date,
    todayInAppTimezone(),
    profile.starting_weight_kg,
    profile.goal_weight_kg,
    currentWeightKg
  );
}
